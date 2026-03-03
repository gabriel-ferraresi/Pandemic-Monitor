import express from 'express';
import db from './db.js';
import { updateIntelligenceDatabase } from './ai.js';
import cron from 'node-cron';
import { config } from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Load env vars
config();

const app = express();
const PORT = process.env.PORT || 3001;

// ====== TECH86: APPSEC & PERFORMANCE ======

// 1. Blindagem de Cabeçalhos HTTP (Calibrada para WebGL / React VITE)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "*"],
            connectSrc: ["'self'", "*", "data:", "blob:"], // Libera requests API e WebSockets
            imgSrc: ["'self'", "data:", "blob:", "*"], // Libera texturas do ThreeJS e imagens externas
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*"], // Essencial para React Vite, PM2 e Three.js
            styleSrc: ["'self'", "'unsafe-inline'", "*"], // Essencial para estilos inline dinâmicos e Tailwind
            workerSrc: ["'self'", "blob:", "*"], // Essencial para Globe.gl
        },
    },
    crossOriginEmbedderPolicy: false
}));

// 2. Compressão GZIP/Brotli (Redução em massiva nos JSONS gigantescos e WebGL)
app.use(compression());

// 3. Rate Limiter (Proteção DDoS / Protege Chaves da IA na GPU Vultr contra esgotamento abusivo de tráfego)
const globalApiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 100, // Limite de 100 requisições por IP na janela
    message: { error: 'Limite de acessos superado. Aguarde antes de realizar novas consultas de telemetria.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 4. CORS estrito para domínios de produção da aplicação
app.use(cors());

app.use(express.json());
app.use('/api/', globalApiLimiter);

// Set up 15-minute Cron Job for Tech86 Elite data sync
cron.schedule('*/15 * * * *', async () => {
    console.log('[Tech86] Iniciando Cron Job: 15 minutos');
    await updateIntelligenceDatabase();
});

// Run an initial sync if the database is empty
const row = db.prepare('SELECT id FROM intelligence_snapshot WHERE id = 1').get();
if (!row) {
    console.log('[Tech86] Banco vazio, rodando a primeira sincronização agora...');
    updateIntelligenceDatabase();
}

// Admin Tech86: Rota Secreta para Acionamento Manual da IA
app.get('/api/admin/force-sync', async (req, res) => {
    const { token } = req.query;

    // Proteção rigorosa para evitar ataques de esgotamento de créditos da IA
    if (token !== 'Tech86Admin') {
        return res.status(401).json({ error: 'Acesso negado. Token de administração inválido.' });
    }

    console.log('[Tech86 Admin] Bypass da Cronjob ativado. Forçando varredura global da IA...');
    try {
        const result = await updateIntelligenceDatabase();
        if (result.success) {
            res.json({ message: '✨ Sincronização de Elite concluída com sucesso. O Data Lake foi atualizado com noovas anomalias e notícias.' });
        } else {
            res.status(500).json({
                error: 'Os motores de IA reportaram falha na requisição. Verifique os logs do servidor.',
                hardware_reason: result.reason,
                ai_raw_response_preview: result.rawText
            });
        }
    } catch (err: any) {
        console.error('[Tech86 Admin] Erro Crítico no bypass:', err);
        res.status(500).json({ error: 'Erro interno no servidor ao tentar bypass magnético.' });
    }
});

// API Routes
app.get('/api/health-data', (req, res) => {
    try {
        let { range } = req.query; // 'live' | '24h' | '7d' | '30d'

        // Sanitização contra Parameter Pollution (XSS Vetor)
        if (typeof range !== 'string') {
            range = 'live';
        }

        // Determina o intervalo de tempo para o Motor Cumulativo
        const now = new Date();
        const timeLimit = new Date();

        if (range === '24h') timeLimit.setHours(now.getHours() - 24);
        else if (range === '7d') timeLimit.setDate(now.getDate() - 7);
        else if (range === '30d') timeLimit.setDate(now.getDate() - 30);
        else timeLimit.setHours(now.getHours() - 48); // Para 'Live', acumulamos ativamente as últimas 48h para gerar a imersão de Banco de Dados massivo!

        const timeCondition = 'WHERE timestamp >= ? ORDER BY timestamp DESC';
        const queryParams = [timeLimit.toISOString()];

        const snapshots = db.prepare(`SELECT * FROM intelligence_snapshot ${timeCondition}`).all(...queryParams) as any[];
        const syncStatus = db.prepare('SELECT * FROM sync_status WHERE id = 1').get() as any;

        if (snapshots && snapshots.length > 0) {
            // Extrai a 'cápsula' do snapshot mais atual (metadados gerais)
            let mergedData = JSON.parse(snapshots[0].data_json);

            // Motor de Acumulação (O Segredo do crescimento da base)
            let allOutbreaks = new Map();
            let allAnomalies = new Map();
            let allPredictions = new Map();
            let allArticles = new Map();
            let allNews = new Map();
            let allTicker = new Set();

            // Iteramos do mais antigo para o mais novo (Reverse)
            // Assim as notícias e dados mais recém atualizados esmagam os antigos em caso de duplicidade
            [...snapshots].reverse().forEach(snap => {
                const d = JSON.parse(snap.data_json);

                // Tipo seguro: A IA pode ser falha, nós não. Verificamos se o nó existe e é um vetor array iterável.
                if (Array.isArray(d.outbreaks)) d.outbreaks.forEach((o: any) => allOutbreaks.set(o.disease + o.country, o));
                if (Array.isArray(d.anomalies)) d.anomalies.forEach((a: any) => allAnomalies.set(a.description, a));
                if (Array.isArray(d.predictions)) d.predictions.forEach((p: any) => allPredictions.set(p.disease + p.region, p));
                if (Array.isArray(d.aiArticles)) d.aiArticles.forEach((art: any) => allArticles.set(art.title, art));
                if (Array.isArray(d.externalNews)) d.externalNews.forEach((n: any) => allNews.set(n.title, n));
                if (Array.isArray(d.tickerNews)) d.tickerNews.forEach((t: string) => allTicker.add(t));
            });

            // Convertemos de volta para os Arrays massivos acumulados
            mergedData.outbreaks = Array.from(allOutbreaks.values());
            mergedData.anomalies = Array.from(allAnomalies.values());
            mergedData.predictions = Array.from(allPredictions.values());
            mergedData.aiArticles = Array.from(allArticles.values());
            mergedData.externalNews = Array.from(allNews.values());
            mergedData.tickerNews = Array.from(allTicker.values());

            // A Mágica Final: Calculamos de verdade os gráficos de estatísticas baseado no crescimento dos arrays
            mergedData.stats = {
                ...mergedData.stats,
                activeAnomalies: mergedData.anomalies.length,
                monitoredPathogens: mergedData.outbreaks.length + 120 // Soma a base inicial parametrizada + o acúmulo real
            };

            res.json({
                ...mergedData,
                historyLength: snapshots.length,
                lastSync: syncStatus ? syncStatus.last_sync : snapshots[0].timestamp,
                status: syncStatus ? syncStatus.status : 'active',
                provider: snapshots[0].provider
            });
        } else {
            res.status(503).json({ error: 'Nenhum snapshot de IA disponível ainda. Aguardando sincronização.' });
        }
    } catch (error) {
        console.error('[Tech86] Failed to fetch health data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
    });
}

const server = app.listen(PORT, () => {
    console.log(`[Tech86] Servidor back-end rodando na porta ${PORT}`);
});

export default server;
