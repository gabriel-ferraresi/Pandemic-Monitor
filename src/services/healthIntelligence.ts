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
}

export interface ExternalNews {
  id: string;
  title: string;
  source: string;
  url: string;
  date: string;
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

// Fallback ultra-realista caso a API demore
export const FALLBACK_DATA: GlobalIntelligence = {
  outbreaks: [
    { id: '1', disease: 'Dengue', country: 'Brasil', lat: -14.23, lng: -51.92, severity: 'HIGH', casesEstimate: '+150.000', trend: 'up', summary: 'Pico sazonal agravado por chuvas intensas nas regiões Sudeste e Sul.' },
    { id: '2', disease: 'Mpox', country: 'Brasil', lat: -23.55, lng: -46.63, severity: 'MODERATE', casesEstimate: '+1.200', trend: 'up', summary: 'Aumento de casos confirmados em centros urbanos, com nova variante sob monitoramento.' },
    { id: '3', disease: 'Influenza A (H5N1)', country: 'Vietnã', lat: 14.05, lng: 108.27, severity: 'CRITICAL', casesEstimate: 'Desconhecido', trend: 'up', summary: 'Novos casos em humanos detectados após contato com aves infectadas.' },
    { id: '4', disease: 'Cólera', country: 'Zâmbia', lat: -13.13, lng: 27.84, severity: 'HIGH', casesEstimate: '+2.100', trend: 'stable', summary: 'Surto contínuo devido a problemas de saneamento após enchentes.' }
  ],
  anomalies: [
    { id: 'a1', description: 'Aumento atípico de 400% em internações por pneumonia infantil de etiologia desconhecida.', location: 'Norte da China', lat: 39.90, lng: 116.40, confidence: 85 },
    { id: 'a2', description: 'Relatos de febre hemorrágica não identificada em vilarejos isolados.', location: 'República Democrática do Congo', lat: -4.03, lng: 21.75, confidence: 60 },
    { id: 'a3', description: 'Pico incomum de síndromes neurológicas pós-infecção viral.', location: 'Nordeste do Brasil', lat: -8.04, lng: -34.87, confidence: 72 }
  ],
  predictions: [
    { id: 'p1', disease: 'Dengue / Zika / Oropouche', region: 'Brasil e América do Sul', forecast: 'Modelos climáticos indicam chuvas acima da média, elevando o risco de epidemia recorde nos próximos 45 dias.', riskLevel: 'CRITICAL' },
    { id: 'p2', disease: 'Sarampo', region: 'Europa Ocidental', forecast: 'Queda na cobertura vacinal sugere provável surto em áreas metropolitanas nas próximas semanas.', riskLevel: 'HIGH' }
  ],
  stats: { globalThreatLevel: 'ALTO', monitoredPathogens: 144, activeAnomalies: 3 },
  tickerNews: [
    "ALERTA BRASIL: Casos de Mpox e Dengue apresentam alta em grandes centros urbanos.",
    "IA DETECTA: Padrão anômalo de doenças respiratórias na Ásia.",
    "MONITORAMENTO: OMS investiga casos de gripe aviária em mamíferos marinhos."
  ],
  aiArticles: [
    {
      id: 'art1',
      title: 'Foco Brasil: O Desafio Simultâneo da Dengue e Mpox',
      content: 'Nossos sistemas de inteligência artificial detectaram uma sobreposição preocupante de surtos no Brasil. Enquanto a Dengue atinge picos históricos impulsionados por anomalias climáticas, observamos também um aumento silencioso, mas constante, nos casos de Mpox em áreas metropolitanas.\n\nA infraestrutura de saúde brasileira precisa adotar uma postura de vigilância genômica dupla. O cruzamento de dados sugere que campanhas de conscientização unificadas podem ser a chave para mitigar a pressão sobre o sistema de saúde nas próximas semanas.',
      date: 'Hoje',
      theme: 'Saúde Pública BR'
    },
    {
      id: 'art2',
      title: 'Análise de Risco: O Avanço Silencioso do H5N1',
      content: 'Nossos modelos detectaram um aumento preocupante nas menções a infecções por Influenza A (H5N1) em mamíferos marinhos e aves de criação no Sudeste Asiático. Embora a transmissão sustentada entre humanos ainda não tenha sido confirmada, a taxa de mutação do vírus sugere uma janela de oportunidade cada vez menor para contenção.',
      date: 'Hoje',
      theme: 'H5N1'
    }
  ],
  externalNews: [
    { id: 'en1', title: 'Casos de Mpox voltam a subir no Brasil, alerta Ministério da Saúde', source: 'G1', url: '#', date: 'Há 2 horas' },
    { id: 'en2', title: 'OMS emite novo alerta sobre gripe aviária', source: 'Reuters', url: '#', date: 'Há 5 horas' },
    { id: 'en3', title: 'Investigação sobre pneumonia misteriosa na China', source: 'BBC News', url: '#', date: 'Há 1 dia' }
  ]
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
