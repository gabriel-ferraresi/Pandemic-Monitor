import { GlobalIntelligence } from "./healthIntelligence";

/**
 * Fonte Única de Verdade: O backend já faz toda a acumulação e merge na tabela
 * `merged_intelligence`. O frontend apenas CONSOME os dados sem modificá-los.
 * O localStorage é usado apenas como cache offline do último estado conhecido.
 */

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

/**
 * Salva os dados recebidos do backend diretamente no localStorage.
 * NÃO faz merge, NÃO recalcula stats — a Fonte Única de Verdade é o backend.
 */
export function updateIntelligenceDB(newData: GlobalIntelligence): GlobalIntelligence {
  localStorage.setItem(DB_KEY, JSON.stringify(newData));
  return newData;
}
