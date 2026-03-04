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
Sua missão é pesquisar dados reais ou simular cenários hiper-realistas referentes EXATAMENTE aos últimos 5 dias imediatamente anteriores a ${today}, focando em notícias atuais sobre saúde global, surtos, vírus, bactérias e emergências médicas. Use as datas atuais de forma decrescente (mais recente primeiro). Tudo deve ser EXTREMAMENTE RECENTE.

PRIORIDADE MÁXIMA (FOCO BRASIL): Como esta é uma plataforma brasileira, você DEVE OBRIGATORIAMENTE buscar e incluir o cenário atualizado do BRASIL em todas as suas análises (ex: casos de Mpox no Brasil, Dengue, Febre Oropouche, etc). O Brasil deve ser sempre um dos destaques principais.
Procure por Dengue, H5N1, Mpox, Cólera, Sarampo, e principalmente ANOMALIAS.

**PROTOCOLO CRONOS (PROIBIÇÃO DE ALUCINAÇÃO TEMPORAL):**
Você NÃO DEVE relatar eventos históricos marcantes ocorridos há meses ou anos atrás (ex: o início da COVID-19 em Wuhan em 2020, o boom do Zika Vírus em 2016) como se fossem "ontem".
Os arrays 'outbreaks', 'anomalies' e 'predictions' DEVEM conter apenas eventos ativos de HOJE ou no MÁXIMO da semana atual antecedente a ${today}, e previsões do PRESENTE PARA O FUTURO.
No caso exclusivo dos relatórios e notícias (externalNews e aiArticles), SE, e SOMENTE SE, você quiser citar um caso muito antigo do passado como contexto ou comparativo histórico, você DEVE OBRIGATORIAMENTE preencher a chave 'isHistorical: true' e descrever o ano do evento em 'historicalPeriod'. Para notícias fresquinhas normais desses dias, passe 'isHistorical: false' e 'historicalPeriod: "N/A"'.

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
    { "id": "uuid", "title": "Título", "content": "Texto...", "date": "Data EXATAMENTE no formato YYYY-MM-DD", "theme": "Tema", "isHistorical": false, "historicalPeriod": "N/A" }
  ],
  "externalNews": [
    // ATENÇÃO: Nunca invente URLs falsas. Deixe sempre como "#" para que o sistema pesquise dinamicamente. Crie Títulos REAIS e DESCRITIVOS de notícias.
    { "id": "uuid", "title": "Notícia (Título Longo e Real)", "source": "Site/Jornal", "url": "#", "date": "Data EXATAMENTE no formato YYYY-MM-DD", "isHistorical": false, "historicalPeriod": "N/A" }
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
        model: "meta/llama-3.3-70b-instruct",
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
        model: "deepseek-ai/deepseek-v3.1",
        messages: [{ role: "user", content: getPrompt() }],
        temperature: 0.3,
        max_tokens: 4000,
    });
    return completion.choices[0]?.message?.content || "";
}

function parseJSON(text: string) {
    try {
        let cleanText = text.trim();
        // Remove markdown tags if any
        if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
        else if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
        if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);

        let parsed = JSON.parse(cleanText.trim());

        // Sanitização Ativa (Elite Fallback): forçamos os nós a existirem para não quebrar a UI
        parsed.outbreaks = Array.isArray(parsed.outbreaks) ? parsed.outbreaks : [];
        parsed.anomalies = Array.isArray(parsed.anomalies) ? parsed.anomalies : [];
        parsed.predictions = Array.isArray(parsed.predictions) ? parsed.predictions : [];
        parsed.aiArticles = Array.isArray(parsed.aiArticles) ? parsed.aiArticles : [];
        parsed.externalNews = Array.isArray(parsed.externalNews) ? parsed.externalNews : [];
        parsed.tickerNews = Array.isArray(parsed.tickerNews) ? parsed.tickerNews : [];

        // Assegura booleanos puros no Protocolo Cronos (IA as vezes manda como string "false")
        parsed.aiArticles = parsed.aiArticles.map((a: any) => ({
            ...a,
            isHistorical: a.isHistorical === true || a.isHistorical === "true"
        }));

        parsed.externalNews = parsed.externalNews.map((n: any) => ({
            ...n,
            isHistorical: n.isHistorical === true || n.isHistorical === "true"
        }));

        return parsed;
    } catch (err) {
        console.error("[Tech86 Parser] TEXTO BRUTO GERADO PELA IA QUE CAUSOU A FALHA:", text);
        throw err;
    }
}

/**
 * Normaliza uma string para uso como chave de deduplicação.
 * Remove acentos, espaços extras, e converte para minúsculas.
 */
function normalizeKey(str: string): string {
    return (str || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Faz merge incremental de novos dados da IA na tabela merged_intelligence.
 * Esta é a Fonte Única de Verdade — todos os clientes leem do resultado final.
 */
function mergeIntoMasterTable(newData: any, provider: string) {
    // 1. Carregar dados acumulados atuais (se existirem)
    const existingRow = db.prepare('SELECT data_json FROM merged_intelligence WHERE id = 1').get() as any;
    let existing: any = null;

    if (existingRow) {
        try {
            existing = JSON.parse(existingRow.data_json);
        } catch {
            existing = null; // Se corrompido, recomeça do zero
        }
    }

    // 2. Preparar Maps de acumulação com dados existentes
    const allOutbreaks = new Map<string, any>();
    const allAnomalies = new Map<string, any>();
    const allPredictions = new Map<string, any>();
    const allArticles = new Map<string, any>();
    const allNews = new Map<string, any>();
    const allTicker = new Set<string>();

    // Carregar dados existentes primeiro (dados antigos — preservando firstSeen)
    if (existing) {
        if (Array.isArray(existing.outbreaks)) existing.outbreaks.forEach((o: any) => allOutbreaks.set(normalizeKey(o.disease) + '|' + normalizeKey(o.country), o));
        if (Array.isArray(existing.anomalies)) existing.anomalies.forEach((a: any) => allAnomalies.set(normalizeKey(a.description).substring(0, 80), a));
        if (Array.isArray(existing.predictions)) existing.predictions.forEach((p: any) => allPredictions.set(normalizeKey(p.disease) + '|' + normalizeKey(p.region), p));
        if (Array.isArray(existing.aiArticles)) existing.aiArticles.forEach((art: any) => allArticles.set(normalizeKey(art.title), art));
        if (Array.isArray(existing.externalNews)) existing.externalNews.forEach((n: any) => allNews.set(normalizeKey(n.title), n));
        if (Array.isArray(existing.tickerNews)) existing.tickerNews.forEach((t: string) => allTicker.add(t));
    }

    // Sobrescrever com dados novos (dados mais recentes vencem)
    // Itens novos recebem firstSeen = agora; itens existentes preservam o firstSeen original
    const now = new Date().toISOString();
    if (Array.isArray(newData.outbreaks)) newData.outbreaks.forEach((o: any) => {
        const key = normalizeKey(o.disease) + '|' + normalizeKey(o.country);
        const existingItem = allOutbreaks.get(key);
        allOutbreaks.set(key, { ...o, firstSeen: existingItem?.firstSeen || o.firstSeen || now });
    });
    if (Array.isArray(newData.anomalies)) newData.anomalies.forEach((a: any) => {
        const key = normalizeKey(a.description).substring(0, 80);
        const existingItem = allAnomalies.get(key);
        allAnomalies.set(key, { ...a, firstSeen: existingItem?.firstSeen || a.firstSeen || now });
    });
    if (Array.isArray(newData.predictions)) newData.predictions.forEach((p: any) => {
        const key = normalizeKey(p.disease) + '|' + normalizeKey(p.region);
        const existingItem = allPredictions.get(key);
        allPredictions.set(key, { ...p, firstSeen: existingItem?.firstSeen || p.firstSeen || now });
    });
    if (Array.isArray(newData.aiArticles)) newData.aiArticles.forEach((art: any) => allArticles.set(normalizeKey(art.title), art));
    if (Array.isArray(newData.externalNews)) newData.externalNews.forEach((n: any) => allNews.set(normalizeKey(n.title), n));
    if (Array.isArray(newData.tickerNews)) newData.tickerNews.forEach((t: string) => allTicker.add(t));

    // 3. Separar dados ativos vs arquivados (TTL de 7 dias)
    const ARCHIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();

    const partitionByTTL = (items: any[]) => {
        const active: any[] = [];
        const archived: any[] = [];
        for (const item of items) {
            if (item.firstSeen && (nowMs - new Date(item.firstSeen).getTime()) > ARCHIVE_TTL_MS) {
                archived.push({ ...item, archived: true });
            } else {
                active.push(item);
            }
        }
        return { active, archived };
    };

    const allOutbreaksList = Array.from(allOutbreaks.values());
    const allAnomaliesList = Array.from(allAnomalies.values());
    const allPredictionsList = Array.from(allPredictions.values());
    const aiArticles = Array.from(allArticles.values());
    const externalNews = Array.from(allNews.values());
    const tickerNews = Array.from(allTicker.values());

    const ob = partitionByTTL(allOutbreaksList);
    const an = partitionByTTL(allAnomaliesList);
    const pr = partitionByTTL(allPredictionsList);

    // 4. Calcular stats DETERMINÍSTICAS apenas sobre dados ATIVOS
    const uniqueDiseases = new Set(ob.active.map((o: any) => normalizeKey(o.disease)));

    const merged = {
        outbreaks: ob.active,
        anomalies: an.active,
        predictions: pr.active,
        archivedOutbreaks: ob.archived,
        archivedAnomalies: an.archived,
        archivedPredictions: pr.archived,
        aiArticles,
        externalNews,
        tickerNews,
        stats: {
            globalThreatLevel: newData.stats?.globalThreatLevel || existing?.stats?.globalThreatLevel || 'MODERADO',
            monitoredPathogens: uniqueDiseases.size,
            activeAnomalies: an.active.length,
            predictionsCount: pr.active.length,
        },
        provider,
        lastMerge: new Date().toISOString(),
    };

    // 5. Persistir na Fonte Única de Verdade
    const mergedJson = JSON.stringify(merged);
    db.prepare('INSERT OR REPLACE INTO merged_intelligence (id, data_json, updated_at) VALUES (1, ?, ?)')
        .run(mergedJson, new Date().toISOString());

    console.log(`[Tech86 Merge] Fonte Única atualizada: ${ob.active.length} surtos ativos (${ob.archived.length} arquivados), ${an.active.length} anomalias ativas (${an.archived.length} arquivadas), ${pr.active.length} previsões ativas, ${uniqueDiseases.size} doenças únicas.`);
}

export async function updateIntelligenceDatabase(): Promise<{ success: boolean, reason?: string, rawText?: string }> {
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

                db.prepare('UPDATE sync_status SET status = ?, message = ?, last_sync = ? WHERE id = 1')
                    .run('degraded', 'Sinal de telemetria degradado. Exibindo último snapshot validado.', new Date().toISOString());
                return { success: false, reason: 'Todos os provedores de IA (Gemini, DeepSeek, Kimi) comunicaram falha de API ou Time-out.', rawText: errorKimi.message };
            }
        }
    }

    // Parses and saves to SQLite
    try {
        const data = parseJSON(rawResponse);

        // Begin Transaction
        db.transaction(() => {
            // Save snapshot for historical audit trail
            db.prepare('INSERT INTO intelligence_snapshot (data_json, timestamp, provider) VALUES (?, ?, ?)')
                .run(JSON.stringify(data), new Date().toISOString(), provider);

            // CORE: Merge incremental na Fonte Única de Verdade
            mergeIntoMasterTable(data, provider);

            // Rotação automática: limpa snapshots com mais de 30 dias para evitar crescimento ilimitado do banco
            db.prepare("DELETE FROM intelligence_snapshot WHERE timestamp < datetime('now', '-30 days')").run();

            // Update sync status
            db.prepare('INSERT OR REPLACE INTO sync_status (id, last_sync, status, message) VALUES (1, ?, ?, ?)')
                .run(new Date().toISOString(), 'active', `Sincronizado via ${provider}`);
        })();

        console.log("[Tech86] Banco de dados inteligência atualizado com sucesso.");
        return { success: true };
    } catch (parseError: any) {
        console.error(`[Tech86] Falha catastrófica de Parsing JSON. A IA retornou sintaxe inválida. Motivo: ${parseError.message}`);
        db.prepare('UPDATE sync_status SET status = ?, message = ?, last_sync = ? WHERE id = 1')
            .run('degraded', 'Falha na formatação de dados. Exibindo snapshot validado.', new Date().toISOString());
        return { success: false, reason: `Erro crítico de Parse JSON. A IA alucinou fora do Type. Motivo: ${parseError.message || parseError}`, rawText: rawResponse.substring(0, 1000) };
    }
}
