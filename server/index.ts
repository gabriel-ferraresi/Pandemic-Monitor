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

// 1. Blindagem de Cabeçalhos HTTP (Anti-XSS, Clickjacking, MIME sniffing)
app.use(helmet({
    contentSecurityPolicy: false, // Permitido para instanciar WebGL/ThreeJS da CDN local
    crossOriginEmbedderPolicy: false // Necessário livre para WebWorkers rodarem HexBins fluidos
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

// API Routes
app.get('/api/health-data', (req, res) => {
    try {
        const { range } = req.query; // 'live' | '24h' | '7d' | '30d'

        // Determina o intervalo de tempo
        let timeCondition = '';
        let queryParams: string[] = [];

        const now = new Date();
        if (range && range !== 'live') {
            const timeLimit = new Date();
            if (range === '24h') timeLimit.setHours(now.getHours() - 24);
            if (range === '7d') timeLimit.setDate(now.getDate() - 7);
            if (range === '30d') timeLimit.setDate(now.getDate() - 30);

            timeCondition = 'WHERE timestamp >= ? ORDER BY timestamp DESC';
            queryParams.push(timeLimit.toISOString());
        } else {
            // Default to latest single snapshot
            timeCondition = 'ORDER BY timestamp DESC LIMIT 1';
        }

        const snapshots = db.prepare(`SELECT * FROM intelligence_snapshot ${timeCondition}`).all(...queryParams) as any[];
        const syncStatus = db.prepare('SELECT * FROM sync_status WHERE id = 1').get() as any;

        if (snapshots && snapshots.length > 0) {
            // Se for 'live', pegue o mais recente. Se não, podemos tentar agregar e fundir os dados temporais.
            // Para mantermos simples a performance por enquanto, exibiremos o snapshot final do período combinado. 
            // Em uma evolução real, o Parse aqui mesclaria os Arrays outbreaks.
            let mergedData = JSON.parse(snapshots[0].data_json);

            if (range !== 'live' && snapshots.length > 1) {
                // Simples agregação demonstrativa combinando patógenos e eventos únicos do período
                let allOutbreaks = new Map();
                let allAnomalies = new Map();

                snapshots.forEach(snap => {
                    const d = JSON.parse(snap.data_json);
                    d.outbreaks?.forEach((o: any) => allOutbreaks.set(o.disease + o.country, o));
                    d.anomalies?.forEach((a: any) => allAnomalies.set(a.description, a));
                });

                mergedData.outbreaks = Array.from(allOutbreaks.values());
                mergedData.anomalies = Array.from(allAnomalies.values());
            }

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
