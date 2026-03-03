import { GlobalIntelligence } from "./healthIntelligence";

const DB_KEY = 'global_health_intelligence_db';

export function getStoredIntelligence(): GlobalIntelligence | null {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function updateIntelligenceDB(newData: GlobalIntelligence): GlobalIntelligence {
  const current = getStoredIntelligence();
  if (!current) {
    localStorage.setItem(DB_KEY, JSON.stringify(newData));
    return newData;
  }

  // Helper to merge arrays and keep unique items based on a key (newest first)
  const mergeArray = (oldArr: any[] = [], newArr: any[] = [], key: string) => {
    const combined = [...newArr];
    const newKeys = new Set(newArr.map(item => item[key]));
    for (const item of oldArr) {
      if (!newKeys.has(item[key])) {
        combined.push(item);
      }
    }

    // Ensure all items have unique IDs after merge to prevent React key warnings
    const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const seenIds = new Set();
    combined.forEach(item => {
      if (!item.id || typeof item.id !== 'string' || item.id.length < 5 || seenIds.has(item.id)) {
        item.id = generateId();
      }
      seenIds.add(item.id);
    });

    return combined.slice(0, 50); // Keep max 50 items per category to avoid bloat
  };

  const merged: GlobalIntelligence = {
    stats: {
      globalThreatLevel: newData.stats.globalThreatLevel,
      // Base of 140 known pathogens + dynamically add the unique active ones we are tracking
      monitoredPathogens: 140 + new Set(mergeArray(current.outbreaks, newData.outbreaks, 'disease').map(o => o.disease)).size,
      // Accurately reflect the total active anomalies we have merged
      activeAnomalies: mergeArray(current.anomalies, newData.anomalies, 'description').length
    },
    tickerNews: newData.tickerNews, // Always keep latest ticker
    predictions: newData.predictions, // Always keep latest predictions
    outbreaks: mergeArray(current.outbreaks, newData.outbreaks, 'disease'),
    anomalies: mergeArray(current.anomalies, newData.anomalies, 'description'),
    aiArticles: mergeArray(current.aiArticles, newData.aiArticles, 'title'),
    externalNews: mergeArray(current.externalNews, newData.externalNews, 'title'),
    lastSync: newData.lastSync,
    provider: newData.provider,
  };

  localStorage.setItem(DB_KEY, JSON.stringify(merged));
  return merged;
}
