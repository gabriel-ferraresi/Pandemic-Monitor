// Tipos exportados para leitura dos JSONs retornados pela nossa API Local
export interface Outbreak {
  id: string;
  disease: string;
  country: string;
  lat: number;
  lng: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  casesEstimate: string;
  trend: 'up' | 'down' | 'stable';
  summary: string;
}

export interface Anomaly {
  id: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  confidence: number;
}

export interface Prediction {
  id: string;
  disease: string;
  region: string;
  forecast: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface AIArticle {
  id: string;
  title: string;
  content: string;
  date: string;
  theme: string;
  isHistorical?: boolean;
  historicalPeriod?: string;
}

export interface ExternalNews {
  id: string;
  title: string;
  source: string;
  url: string;
  date: string;
  isHistorical?: boolean;
  historicalPeriod?: string;
}

export interface GlobalIntelligence {
  outbreaks: Outbreak[];
  anomalies: Anomaly[];
  predictions: Prediction[];
  stats: {
    globalThreatLevel: 'CRÍTICO' | 'ALTO' | 'MODERADO' | 'BAIXO';
    monitoredPathogens: number;
    activeAnomalies: number;
  };
  tickerNews: string[];
  aiArticles: AIArticle[];
  externalNews: ExternalNews[];
  historyLength?: number;  // Nova métrica temporal vinda da API
  lastSync?: string;
  provider?: string;
}

// Estado inicial limpo enquanto a API carrega.
// A Fonte Única de Verdade é o backend (merged_intelligence). Não fabricamos dados no frontend.
export const FALLBACK_DATA: GlobalIntelligence = {
  outbreaks: [],
  anomalies: [],
  predictions: [],
  stats: { globalThreatLevel: 'MODERADO', monitoredPathogens: 0, activeAnomalies: 0 },
  tickerNews: ['Conectando ao sistema de inteligência...'],
  aiArticles: [],
  externalNews: []
};

export async function getLiveHealthIntelligence(range = 'live'): Promise<GlobalIntelligence> {
  try {
    const response = await fetch(`/api/health-data?range=${range}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const parsedData = await response.json();
    return parsedData;
  } catch (error) {
    console.error("Erro ao buscar dados do servidor local de IA:", error);
    return FALLBACK_DATA;
  }
}
