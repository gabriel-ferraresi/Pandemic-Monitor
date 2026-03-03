import { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { GlobalIntelligence } from '../services/healthIntelligence';
import { cn } from '../utils';

// Mock data for global health events (background noise)
const generateMockData = () => {
  const N = 150; // Reduced noise
  return [...Array(N).keys()].map(() => ({
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: Math.random() * 0.1 + 0.02, // Smaller size
    color: 'rgba(59, 130, 246, 0.4)', // More transparent blue
    name: 'Monitoramento de Rotina',
    value: 'N/A',
    isAlert: false
  }));
};

export function GlobeComponent({ data, focusLocation, onEventClick, userLocation }: { data: GlobalIntelligence, focusLocation?: { lat: number, lng: number } | null, onEventClick?: (point: any) => void, userLocation?: { lat: number, lng: number, name?: string } | null }) {
  const globeEl = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth + 400, height: window.innerHeight });
  const [backgroundData, setBackgroundData] = useState<any[]>([]);
  const [arcs, setArcs] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Combine real alerts with background noise
  const allPoints = useMemo(() => {
    const outbreakPoints = data.outbreaks.map(a => ({
      ...a,
      lat: a.lat,
      lng: a.lng,
      size: a.severity === 'CRITICAL' ? 0.8 : a.severity === 'HIGH' ? 0.5 : 0.3,
      color: a.severity === 'CRITICAL' ? '#ef4444' : a.severity === 'HIGH' ? '#f59e0b' : '#eab308',
      name: a.disease,
      value: a.casesEstimate,
      isAlert: true,

      // For the panel
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
      color: '#a855f7', // purple for anomalies
      name: 'ANOMALIA DETECTADA',
      value: `Confiança: ${a.confidence}%`,
      isAlert: true,

      // For the panel
      type: 'anomaly',
      title: 'Padrão Anômalo',
      location: a.location,
      summary: a.description
    }));

    const points = [...outbreakPoints, ...anomalyPoints, ...backgroundData];

    if (userLocation) {
      points.push({
        lat: userLocation.lat,
        lng: userLocation.lng,
        size: 0.5,
        color: '#10b981', // emerald
        name: 'Sua Localização',
        value: userLocation.name || 'Local',
        isAlert: false,
        isUser: true
      });
    }

    return points;
  }, [data, backgroundData, userLocation]);

  useEffect(() => {
    setBackgroundData(generateMockData());

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth + 400,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    // Observer to watch for theme changes on html element
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
      // Auto-rotate disabled for better interaction
      globeEl.current.controls().autoRotate = false;

      // Set initial POV
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
        // Retorna o zoom panorâmico original ao cancelar seleção de um Card
        globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1500);
      }
    }
  }, [focusLocation]);

  const handlePointClick = (point: any) => {
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
  };

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
        htmlElementsData={allPoints.filter(d => Boolean(d.isUser) || Boolean(d.isAlert))}
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
        arcsData={arcs}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcAltitudeAutoScale={0.3}
        atmosphereColor="#0ea5e9"
        atmosphereAltitude={0.15}
        globeMaterial={globeMaterial}
      // Removes old point labels since we use hex labels now
      />

      {/* Overlay gradient to blend UI */}
      <div className={cn("absolute inset-0 pointer-events-none transition-all duration-1000", isDark ? "opacity-100 bg-gradient-to-r from-black/80 via-transparent to-black/80" : "opacity-0")} />
      <div className={cn("absolute inset-0 pointer-events-none transition-all duration-1000", isDark ? "opacity-100 bg-gradient-to-b from-black/50 via-transparent to-black/80" : "opacity-0")} />
    </div>
  );
}
