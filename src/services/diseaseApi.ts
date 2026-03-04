export interface DiseaseStats {
  globalCases24h: string;
  globalCasesTrend: string;
  activeCases: string;
  brazilCases24h: string;
  brazilActiveCases: string;
  vaccinesAdministered: string;
  historicalData: { date: string; cases: number }[];
  isOffline?: boolean;
}

const CACHE_KEY = 'disease_stats_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

function getCachedStats(): DiseaseStats | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.data;
  } catch { /* cache inválido */ }
  return null;
}

function setCachedStats(data: DiseaseStats): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

const FALLBACK_STATS: DiseaseStats = {
  globalCases24h: '—',
  globalCasesTrend: '—',
  activeCases: '—',
  brazilCases24h: '—',
  brazilActiveCases: '—',
  vaccinesAdministered: '—',
  historicalData: [],
  isOffline: true,
};

export async function getDiseaseStats(): Promise<DiseaseStats> {
  // Retorna cache se ainda válido (evita requests desnecessários)
  const cached = getCachedStats();
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const [globalRes, brazilRes, vaccineRes, historicalRes] = await Promise.all([
      fetch('https://disease.sh/v3/covid-19/all', { signal: controller.signal }),
      fetch('https://disease.sh/v3/covid-19/countries/brazil', { signal: controller.signal }),
      fetch('https://disease.sh/v3/covid-19/vaccine/coverage?lastdays=1&fullData=false', { signal: controller.signal }),
      fetch('https://disease.sh/v3/covid-19/historical/all?lastdays=30', { signal: controller.signal }),
    ]);
    clearTimeout(timeout);

    if (!globalRes.ok || !brazilRes.ok) throw new Error('API disease.sh indisponível');

    const globalData = await globalRes.json();
    const brazilData = await brazilRes.json();
    const vaccineData = await vaccineRes.json();
    const historicalDataRaw = await historicalRes.json();

    const historicalData = Object.entries(historicalDataRaw.cases || {}).map(([date, cases]) => {
      const [month, day] = date.split('/');
      return { date: `${day}/${month}`, cases: cases as number };
    });

    const vaccineValues = Object.values(vaccineData) as number[];
    const totalVaccines = vaccineValues.length > 0 ? vaccineValues[0] : 0;

    const formatNumber = (num: number) => {
      if (num >= 1e9) return (num / 1e9).toFixed(1).replace('.', ',') + 'B';
      if (num >= 1e6) return (num / 1e6).toFixed(1).replace('.', ',') + 'M';
      return num.toLocaleString('pt-BR');
    };

    const stats: DiseaseStats = {
      globalCases24h: formatNumber(globalData.cases),
      globalCasesTrend: globalData.todayCases > 0 ? `+${((globalData.todayCases / globalData.cases) * 100).toFixed(3)}%` : 'Estável',
      activeCases: formatNumber(globalData.active),
      brazilCases24h: formatNumber(brazilData.cases),
      brazilActiveCases: formatNumber(brazilData.active),
      vaccinesAdministered: totalVaccines > 0 ? formatNumber(totalVaccines) : '—',
      historicalData,
      isOffline: false,
    };

    setCachedStats(stats);
    return stats;
  } catch (error) {
    console.warn("[Tech86] API disease.sh indisponível, exibindo indicador offline:", error);
    return FALLBACK_STATS;
  }
}
