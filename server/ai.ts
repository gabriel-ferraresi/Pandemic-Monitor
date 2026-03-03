import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import db from "./db.js";

// We instantiate clients inside functions to avoid startup crashes if keys are missing
let geminiBase: any = null;
let nvidiaOpenAI: any = null;

function getPrompt() {
    const today = new Date().toISOString().split('T')[0];
    return `
Você é o núcleo de inteligência artificial de um Monitor Global de Doenças.
HOJE É: ${today}.
Sua missão é pesquisar dados reais ou simular cenários hiper-realistas referentes EXATAMENTE aos últimos dias anteriores a ${today}, focando em notícias sobre saúde global, surtos, vírus, bactérias e emergências médicas. Não invente notícias de 2024. Use as datas atuais de forma decrescente (mais recente primeiro).

PRIORIDADE MÁXIMA (FOCO BRASIL): Como esta é uma plataforma brasileira, você DEVE OBRIGATORIAMENTE buscar e incluir o cenário atualizado do BRASIL em todas as suas análises (ex: casos de Mpox no Brasil, Dengue, Febre Oropouche, etc). O Brasil deve ser sempre um dos destaques principais.
Procure por Dengue, H5N1, Mpox, Cólera, Sarampo, e principalmente ANOMALIAS.

Com base na sua inteligência, gere um JSON rigoroso com a seguinte estrutura:

{
  "outbreaks": [
    { "id": "uuid", "disease": "Nome da Doença", "country": "País", "lat": 0.0, "lng": 0.0, "severity": "CRITICAL" | "HIGH" | "MODERATE" | "LOW", "casesEstimate": "ex: +5000", "trend": "up" | "down" | "stable", "summary": "Resumo" }
  ],
  "anomalies": [
    { "id": "uuid", "description": "Descrição", "location": "Região/País", "lat": 0.0, "lng": 0.0, "confidence": 85 }
  ],
  "predictions": [
    { "id": "uuid", "disease": "Doença", "region": "Região", "forecast": "Previsão", "riskLevel": "CRITICAL" }
  ],
  "stats": {
    "globalThreatLevel": "CRÍTICO" | "ALTO" | "MODERADO" | "BAIXO",
    "monitoredPathogens": 148,
    "activeAnomalies": 3
  },
  "tickerNews": ["Manchete 1", "Manchete 2", "Manchete 3", "Manchete 4", "Manchete 5"],
  "aiArticles": [
    { "id": "uuid", "title": "Título", "content": "Texto...", "date": "Data EXATAMENTE no formato YYYY-MM-DD", "theme": "Tema" }
  ],
  "externalNews": [
    { "id": "uuid", "title": "Notícia", "source": "Site", "url": "#", "date": "Data EXATAMENTE no formato YYYY-MM-DD" }
  ]
}

REGRAS:
1. Retorne APENAS o JSON válido.
`;
}

async function callGemini() {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
    if (!geminiBase) geminiBase = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await geminiBase.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: getPrompt(),
        config: {
            temperature: 0.3,
        }
    });
    return response.text || "";
}

async function callDeepSeek() {
    if (!process.env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY missing");
    if (!nvidiaOpenAI) nvidiaOpenAI = new OpenAI({ apiKey: process.env.NVIDIA_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });

    const completion = await nvidiaOpenAI.chat.completions.create({
        model: "deepseek-ai/deepseek-coder-6.7b-instruct",
        messages: [{ role: "user", content: getPrompt() }],
        temperature: 0.3,
        max_tokens: 4000,
    });
    return completion.choices[0]?.message?.content || "";
}

async function callKimi() {
    if (!process.env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY missing");
    if (!nvidiaOpenAI) nvidiaOpenAI = new OpenAI({ apiKey: process.env.NVIDIA_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' });

    const completion = await nvidiaOpenAI.chat.completions.create({
        model: "moonshot-v1-8k",
        messages: [{ role: "user", content: getPrompt() }],
        temperature: 0.3,
        max_tokens: 4000,
    });
    return completion.choices[0]?.message?.content || "";
}

function parseJSON(text: string) {
    const jsonMatch = text.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/) || text.match(/\`\`\`\n([\s\S]*?)\n\`\`\`/);
    if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(text);
}

export async function updateIntelligenceDatabase() {
    let rawResponse = "";
    let provider = "None";

    console.log("[Tech86] Iniciando varredura de Inteligência Artificial...");

    // Try Gemini
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
        rawResponse = await callGemini();
        provider = "Gemini";
        console.log("[Tech86] Dados obtidos via Google Gemini Flash.");
    } catch (errorGemini: any) {
        console.warn(`[Tech86] Falha no Gemini: ${errorGemini.message}. Tentando DeepSeek...`);

        // Try DeepSeek
        try {
            if (!process.env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY missing");
            rawResponse = await callDeepSeek();
            provider = "DeepSeek via NVIDIA";
            console.log("[Tech86] Dados obtidos via DeepSeek NVIDIA.");
        } catch (errorDeepSeek: any) {
            console.warn(`[Tech86] Falha no DeepSeek: ${errorDeepSeek.message}. Tentando Kimi...`);

            // Try Kimi
            try {
                if (!process.env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY missing");
                rawResponse = await callKimi();
                provider = "Kimi via NVIDIA";
                console.log("[Tech86] Dados obtidos via Kimi NVIDIA.");
            } catch (errorKimi: any) {
                console.error(`[Tech86] Falha catastrófica em todos os provedores AI. Mantendo snapshot anterior.`);

                // Tratamento de Falhas Premium: Database keeping old snapshot
                db.prepare('UPDATE sync_status SET status = ?, message = ?, last_sync = ? WHERE id = 1')
                    .run('degraded', 'Sinal de telemetria degradado. Exibindo último snapshot validado.', new Date().toISOString());
                return false;
            }
        }
    }

    // Parses and saves to SQLite
    try {
        const data = parseJSON(rawResponse);

        // Begin Transaction
        db.transaction(() => {
            // Save entire snapshot into historical timeline
            db.prepare('INSERT INTO intelligence_snapshot (data_json, timestamp, provider) VALUES (?, ?, ?)')
                .run(JSON.stringify(data), new Date().toISOString(), provider);

            // Update sync status
            db.prepare('INSERT OR REPLACE INTO sync_status (id, last_sync, status, message) VALUES (1, ?, ?, ?)')
                .run(new Date().toISOString(), 'active', `Sincronizado via ${provider}`);
        })();

        console.log("[Tech86] Banco de dados inteligência atualizado com sucesso.");
        return true;
    } catch (parseError) {
        console.error("[Tech86] Erro ao fazer o parsing ou inserir no BD:", parseError);
        db.prepare('UPDATE sync_status SET status = ?, message = ?, last_sync = ? WHERE id = 1')
            .run('degraded', 'Falha na formatação de dados. Exibindo snapshot validado.', new Date().toISOString());
        return false;
    }
}
