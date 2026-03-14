import express from 'express';
import db from './db.js';
import { updateIntelligenceDatabase } from './ai.js';
import donationRouter from './payments/routes.js';
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

// 1. Blindagem de Cabeçalhos HTTP (CSP restrita a domínios explícitos)
const trustedDomains = ['https://pandemic-monitor.tech86.com.br', 'https://tech86.com.br'];
const apiDomains = ['https://integrate.api.nvidia.com', 'https://generativelanguage.googleapis.com', 'https://disease.sh'];
const cdnDomains = ['https://unpkg.com', 'https://fonts.gstatic.com', 'https://fonts.googleapis.com'];
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", ...apiDomains, ...trustedDomains, ...cdnDomains, "data:", "blob:"],
            imgSrc: ["'self'", "data:", "blob:", ...trustedDomains, ...cdnDomains],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // React Vite + Three.js precisam eval
            styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind CSS inline
            workerSrc: ["'self'", "blob:"], // Globe.gl Web Workers
            fontSrc: ["'self'", ...cdnDomains],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// 2. Compressão GZIP/Brotli
app.use(compression());

// 3. Rate Limiter (Proteção DDoS contra esgotamento de créditos IA)
const globalApiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    message: { error: 'Limite de acessos superado. Aguarde antes de realizar novas consultas de telemetria.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// 4. CORS restrito aos domínios da Tech86
const isProduction = process.env.NODE_ENV === 'production';
app.use(cors(isProduction ? {
    origin: ['https://pandemic-monitor.tech86.com.br', 'https://tech86.com.br'],
    methods: ['GET'],
} : {}));

app.use(express.json());

// Montar rotas de doações (webhook tem seu próprio handler de autenticação)
app.use('/api/donations', donationRouter);

// Rate limiter global para demais rotas da API
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

    // Proteção via variável de ambiente (nunca expor tokens no código-fonte)
    const adminToken = process.env.ADMIN_TOKEN || 'Tech86Admin_CHANGE_ME';
    if (!token || token !== adminToken) {
        return res.status(401).json({ error: 'Acesso negado. Token de administração inválido.' });
    }

    console.log('[Tech86 Admin] Bypass da Cronjob ativado. Forçando varredura global da IA...');
    try {
        const result = await updateIntelligenceDatabase();
        if (result.success) {
            res.json({ message: '✨ Sincronização concluída com sucesso. O Data Lake foi atualizado com novas anomalias e notícias.' });
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
        const range = (req.query.range as string) || 'live';

        // Fonte Única de Verdade: Leitura O(1) da tabela merged_intelligence
        const mergedRow = db.prepare('SELECT data_json, updated_at FROM merged_intelligence WHERE id = 1').get() as any;
        const syncStatus = db.prepare('SELECT * FROM sync_status WHERE id = 1').get() as any;
        const snapshotCount = (db.prepare('SELECT COUNT(*) as count FROM intelligence_snapshot').get() as any)?.count || 0;

        if (mergedRow) {
            const data = JSON.parse(mergedRow.data_json);

            // Extrair contagens de arquivados antes de removê-los da resposta
            const archivedCounts = {
                outbreaks: (data.archivedOutbreaks || []).length,
                anomalies: (data.archivedAnomalies || []).length,
                predictions: (data.archivedPredictions || []).length,
            };

            // Remover arrays arquivados da resposta padrão (mantém payload leve)
            delete data.archivedOutbreaks;
            delete data.archivedAnomalies;
            delete data.archivedPredictions;

            // Filtragem temporal baseada em firstSeen
            const now = Date.now();
            const rangeMs: Record<string, number> = {
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
            };

            const cutoff = rangeMs[range];

            if (cutoff) {
                // Filtra por firstSeen — itens sem firstSeen são incluídos (backfill pendente)
                const filterByTime = (items: any[]) =>
                    (items || []).filter((item: any) => {
                        if (!item.firstSeen) return true; // Sem firstSeen = incluir (dado legado)
                        return (now - new Date(item.firstSeen).getTime()) <= cutoff;
                    });

                data.outbreaks = filterByTime(data.outbreaks);
                data.anomalies = filterByTime(data.anomalies);
                data.predictions = filterByTime(data.predictions);

                // Recalcular stats com dados filtrados
                const uniqueDiseases = new Set(
                    (data.outbreaks || []).map((o: any) => (o.disease || '').toLowerCase().trim())
                );

                // Recalcular globalThreatLevel baseado nos dados filtrados
                const hasCritical = (data.outbreaks || []).some((o: any) => o.severity === 'CRITICAL');
                const hasHigh = (data.outbreaks || []).some((o: any) => o.severity === 'HIGH');
                const filteredThreatLevel = hasCritical ? 'CRÍTICO' : hasHigh ? 'ALTO' : uniqueDiseases.size > 0 ? 'MODERADO' : 'BAIXO';

                data.stats = {
                    ...data.stats,
                    globalThreatLevel: filteredThreatLevel,
                    monitoredPathogens: uniqueDiseases.size,
                    activeAnomalies: (data.anomalies || []).length,
                    predictionsCount: (data.predictions || []).length,
                };
            }

            res.json({
                ...data,
                historyLength: snapshotCount,
                archivedCounts,
                lastSync: syncStatus ? syncStatus.last_sync : mergedRow.updated_at,
                status: syncStatus ? syncStatus.status : 'active',
                activeRange: range,
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
