import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { GlobalIntelligence } from '../services/healthIntelligence';
import { cn } from '../utils';
import type { GlobeFilter } from './Sidebar';

// Severidade para ordenação de prioridade (maior = mais prioridade)
const SEVERITY_PRIORITY: Record<string, number> = {
  'CRITICAL': 4,
  'HIGH': 3,
  'MODERATE': 2,
  'LOW': 1,
};

// Limites de labels por nível de zoom (altitude da câmera)
const LABEL_LIMITS = {
  far: { altitude: 2.0, maxLabels: 12 },
  mid: { altitude: 1.2, maxLabels: 22 },
  close: { altitude: 0, maxLabels: 40 },
};

export function GlobeComponent({ data, focusLocation, onEventClick, userLocation, globeFilter = 'all' }: { data: GlobalIntelligence, focusLocation?: { lat: number, lng: number } | null, onEventClick?: (point: any) => void, userLocation?: { lat: number, lng: number, name?: string } | null, globeFilter?: GlobeFilter }) {
  const globeEl = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth + 400, height: window.innerHeight });
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [cameraAltitude, setCameraAltitude] = useState(2.5);
  const altitudeRef = useRef(2.5);

  // Combinar alertas reais (sem mock data)
  const allAlertPoints = useMemo(() => {
    const outbreakPoints = data.outbreaks.map(a => ({
      ...a,
      lat: a.lat,
      lng: a.lng,
      size: a.severity === 'CRITICAL' ? 0.8 : a.severity === 'HIGH' ? 0.5 : 0.3,
      color: a.severity === 'CRITICAL' ? '#ef4444' : a.severity === 'HIGH' ? '#f59e0b' : '#eab308',
      name: a.disease,
      value: a.casesEstimate,
      isAlert: true,
      priority: SEVERITY_PRIORITY[a.severity] || 1,

      // Para o painel
      type: 'outbreak',
      title: a.disease,
      location: a.country,
      cases: a.casesEstimate,
      trend: a.trend,
      summary: a.summary
    }));

    const anomalyPoints = data.anomalies.map(a => ({
      ...a,
      lat: a.lat,
      lng: a.lng,
      size: 0.6,
      color: '#a855f7', // roxo para anomalias
      name: 'ANOMALIA DETECTADA',
      value: `Confiança: ${a.confidence}%`,
      isAlert: true,
      priority: 2.5, // Entre HIGH e MODERATE

      // Para o painel
      type: 'anomaly',
      title: 'Padrão Anômalo',
      location: a.location,
      summary: a.description
    }));

    // Aplicar filtro de categoria do globo
    if (globeFilter === 'outbreaks') return outbreakPoints;
    if (globeFilter === 'anomalies') return anomalyPoints;
    return [...outbreakPoints, ...anomalyPoints];
  }, [data, globeFilter]);

  // Todos os pontos para renderização WebGL (barato)
  const allPoints = useMemo(() => {
    const points = [...allAlertPoints];

    if (userLocation) {
      points.push({
        lat: userLocation.lat,
        lng: userLocation.lng,
        size: 0.5,
        color: '#10b981', // emerald
        name: 'Sua Localização',
        value: userLocation.name || 'Local',
        isAlert: false,
        isUser: true,
        priority: 5,
      } as any);
    }

    return points;
  }, [allAlertPoints, userLocation]);

  // Labels HTML limitados por altitude — principal otimização de performance
  const visibleLabels = useMemo(() => {
    let maxLabels: number;
    if (cameraAltitude > LABEL_LIMITS.far.altitude) {
      maxLabels = LABEL_LIMITS.far.maxLabels;
    } else if (cameraAltitude > LABEL_LIMITS.close.altitude && cameraAltitude <= LABEL_LIMITS.mid.altitude) {
      maxLabels = LABEL_LIMITS.mid.maxLabels;
    } else {
      maxLabels = LABEL_LIMITS.close.maxLabels;
    }

    // Ponto do usuário sempre visível
    const userPoints = allPoints.filter((d: any) => Boolean(d.isUser));

    // Alertas ordenados por prioridade (CRITICAL primeiro)
    const alertPoints = allAlertPoints
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, maxLabels);

    return [...userPoints, ...alertPoints];
  }, [allPoints, allAlertPoints, cameraAltitude]);

  // Monitorar altitude da câmera com polling leve (sem re-render excessivo)
  useEffect(() => {
    if (!globeEl.current) return;

    const intervalId = setInterval(() => {
      if (!globeEl.current) return;
      const pov = globeEl.current.pointOfView();
      if (pov && typeof pov.altitude === 'number') {
        const alt = pov.altitude;
        // Só atualiza state se houve mudança significativa (evita re-renders desnecessários)
        if (Math.abs(alt - altitudeRef.current) > 0.15) {
          altitudeRef.current = alt;
          setCameraAltitude(alt);
        }
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth + 400,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    // Observer para mudanças de tema no html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      if (focusLocation) {
        globeEl.current.pointOfView({
          lat: focusLocation.lat,
          lng: focusLocation.lng,
          altitude: 1.2
        }, 1500);
      } else {
        globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1500);
      }
    }
  }, [focusLocation]);

  const handlePointClick = useCallback((point: any) => {
    if (globeEl.current) {
      globeEl.current.pointOfView({
        lat: point.lat,
        lng: point.lng,
        altitude: 1.2
      }, 1500);
    }
    if (point.isAlert && onEventClick) {
      onEventClick(point);
    }
  }, [onEventClick]);

  const globeMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: isDark ? '#0a0a0a' : '#ffffff',
      emissive: isDark ? '#111111' : '#222222',
      emissiveIntensity: isDark ? 0.1 : 0.05,
      shininess: isDark ? 0.7 : 0.9,
    });
  }, [isDark]);

  return (
    <div className={cn("absolute inset-0 z-0 transition-colors duration-1000", isDark ? "bg-black" : "bg-slate-950")} style={{ transform: 'translateX(-400px)', width: 'calc(100% + 400px)' }}>
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl={isDark ? "//unpkg.com/three-globe/example/img/earth-dark.jpg" : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"}
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl={isDark ? "//unpkg.com/three-globe/example/img/night-sky.png" : ""}
        pointsData={allPoints}
        pointColor="color"
        pointAltitude={0.01}
        pointRadius={(d: any) => d.isAlert ? 0.4 : d.isUser ? 0.3 : 0.05}
        pointsMerge={true}
        onPointClick={handlePointClick}
        htmlElementsData={visibleLabels}
        htmlAltitude={0.1}
        htmlElement={(d: any) => {
          const el = document.createElement('div');

          if (d.isUser) {
            el.innerHTML = `
              <div style="
                background: ${d.color}40;
                backdrop-filter: blur(4px);
                border: 1px solid ${d.color}80;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-family: monospace;
                font-weight: bold;
                transform: translate(-50%, -50%);
                white-space: nowrap;
                box-shadow: 0 0 15px ${d.color}40;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              ">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 6px; height: 6px; border-radius: 50%; background: ${d.color}; box-shadow: 0 0 8px ${d.color};"></div>
                  ${d.name}
                </div>
              </div>
            `;
            return el;
          }

          el.innerHTML = `
            <div style="
              background: ${d.color}40;
              backdrop-filter: blur(4px);
              border: 1px solid ${d.color}80;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-family: monospace;
              font-weight: bold;
              cursor: pointer;
              transform: translate(-50%, -50%);
              pointer-events: auto;
              white-space: nowrap;
              box-shadow: 0 0 15px ${d.color}40;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              transition: all 0.2s ease;
            " onmouseover="this.style.background='${d.color}80'; this.style.transform='translate(-50%, -50%) scale(1.1)';" onmouseout="this.style.background='${d.color}40'; this.style.transform='translate(-50%, -50%) scale(1)';">
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background: ${d.color}; box-shadow: 0 0 8px ${d.color};"></div>
                ${d.name}
              </div>
            </div>
          `;
          el.onclick = () => handlePointClick(d);
          return el;
        }}
        atmosphereColor="#0ea5e9"
        atmosphereAltitude={0.15}
        globeMaterial={globeMaterial}
      />

      {/* Overlay gradient to blend UI */}
      <div className={cn("absolute inset-0 pointer-events-none transition-all duration-1000", isDark ? "opacity-100 bg-gradient-to-r from-black/80 via-transparent to-black/80" : "opacity-0")} />
      <div className={cn("absolute inset-0 pointer-events-none transition-all duration-1000", isDark ? "opacity-100 bg-gradient-to-b from-black/50 via-transparent to-black/80" : "opacity-0")} />
    </div>
  );
}
