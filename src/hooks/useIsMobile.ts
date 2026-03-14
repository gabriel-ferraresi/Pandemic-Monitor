import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Hook responsivo que detecta se a viewport é mobile.
 * Usa matchMedia (API moderna e eficiente) em vez de resize event.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // API moderna
    mql.addEventListener('change', handleChange);

    // Sync inicial
    setIsMobile(mql.matches);

    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}
