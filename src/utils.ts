import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function translateSeverity(severity: string): string {
  const map: Record<string, string> = {
    'CRITICAL': 'CRÍTICO',
    'HIGH': 'ALTO',
    'MODERATE': 'MODERADO',
    'LOW': 'BAIXO'
  };
  return map[severity?.toUpperCase()] || severity;
}
export function formatToBRDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
