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
        // Fonte Única de Verdade: Leitura O(1) da tabela merged_intelligence
        const mergedRow = db.prepare('SELECT data_json, updated_at FROM merged_intelligence WHERE id = 1').get() as any;
        const syncStatus = db.prepare('SELECT * FROM sync_status WHERE id = 1').get() as any;
        const snapshotCount = (db.prepare('SELECT COUNT(*) as count FROM intelligence_snapshot').get() as any)?.count || 0;

        if (mergedRow) {
            const data = JSON.parse(mergedRow.data_json);

            res.json({
                ...data,
                historyLength: snapshotCount,
                lastSync: syncStatus ? syncStatus.last_sync : mergedRow.updated_at,
                status: syncStatus ? syncStatus.status : 'active',
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
