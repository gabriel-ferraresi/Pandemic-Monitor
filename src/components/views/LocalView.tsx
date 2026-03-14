import { MapPin, AlertTriangle, ShieldAlert, Activity, Radar, Crosshair } from "lucide-react";
import { GlobalIntelligence } from "../../services/healthIntelligence";
import { cn, translateSeverity } from "../../utils";

// Haversine formula to calculate distance in KM
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

export function LocalView({
  data,
  userLocation,
  onAlertClick,
  isMobile = false
}: {
  data: GlobalIntelligence,
  userLocation: { lat: number, lng: number, name?: string } | null,
  onAlertClick: (item: any, type: 'outbreak' | 'anomaly') => void,
  isMobile?: boolean
}) {
  if (!userLocation) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-10 text-center transition-colors duration-500", isMobile ? "w-full" : "w-[600px] h-full bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-l border-slate-200 dark:border-white/10 z-10 relative shadow-[-4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.5)]")}>
        <MapPin className="w-16 h-16 text-slate-400 dark:text-zinc-600 mb-6 transition-colors" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 transition-colors">Localização Não Definida</h2>
        <p className="text-slate-500 dark:text-zinc-400 mb-8 transition-colors">
          Ative sua localização nas Configurações para ver as ameaças e surtos mais próximos de você.
        </p>
      </div>
    );
  }

  // Combine and sort all events by distance
  const nearbyEvents = [
    ...data.outbreaks.map(o => ({ ...o, type: 'outbreak' as const, distance: getDistance(userLocation.lat, userLocation.lng, o.lat, o.lng) })),
    ...data.anomalies.map(a => ({ ...a, type: 'anomaly' as const, distance: getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) }))
  ].sort((a, b) => a.distance - b.distance).slice(0, 10); // Top 10 closest

  return (
    <div className={cn("flex flex-col transition-colors duration-500", isMobile ? "w-full p-4" : "w-[600px] h-full bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-l border-slate-200 dark:border-white/10 z-10 relative shadow-[-4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.5)]")}>
      <div className="p-6 border-b border-slate-200 dark:border-white/10 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
          <Crosshair className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          Minha Região
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-500 transition-colors" />
          <span className="text-sm text-emerald-700 dark:text-emerald-400 font-bold transition-colors">{userLocation.name || "Sua Localização"}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono mt-1 transition-colors">
          {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4 transition-colors">Ameaças Mais Próximas</h3>

        <div className="grid gap-4">
          {nearbyEvents.map((event, i) => (
            <div
              key={i}
              onClick={() => onAlertClick(event, event.type)}
              className={cn(
                "p-5 rounded-xl border transition-all cursor-pointer hover:translate-x-1",
                event.type === 'outbreak'
                  ? (event.severity === 'CRITICAL' ? "bg-gradient-to-r from-red-50 dark:from-red-500/10 to-transparent border-red-200 dark:border-red-500/30 hover:border-red-300 dark:hover:border-red-500/50" :
                    event.severity === 'HIGH' ? "bg-gradient-to-r from-orange-50 dark:from-orange-500/10 to-transparent border-orange-200 dark:border-orange-500/30 hover:border-orange-300 dark:hover:border-orange-500/50" :
                      "bg-gradient-to-r from-blue-50 dark:from-blue-500/10 to-transparent border-blue-200 dark:border-blue-500/30 hover:border-blue-300 dark:hover:border-blue-500/50")
                  : "bg-gradient-to-r from-purple-50 dark:from-purple-500/10 to-transparent border-purple-200 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-500/50"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    event.type === 'outbreak'
                      ? (event.severity === 'CRITICAL' ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500" :
                        event.severity === 'HIGH' ? "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-500" :
                          "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-500")
                      : "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-500"
                  )}>
                    {event.type === 'outbreak' ? (
                      event.severity === 'CRITICAL' ? <AlertTriangle className="w-5 h-5" /> : <Activity className="w-5 h-5" />
                    ) : (
                      <Radar className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg transition-colors">
                      {event.type === 'outbreak' ? event.disease : 'Anomalia Detectada'}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-zinc-400 transition-colors">
                      <MapPin className="w-3 h-3" />
                      {event.type === 'outbreak' ? event.country : event.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold px-2 py-1 rounded border uppercase tracking-wider bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-600 dark:text-white flex items-center gap-1 transition-colors">
                    <Crosshair className="w-3 h-3" />
                    {event.distance < 100 ? "< 100 km" : `${Math.round(event.distance)} km`}
                  </div>
                </div>
              </div>

              <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed transition-colors">
                {event.type === 'outbreak' ? event.summary : event.description}
              </p>
            </div>
          ))}

          {nearbyEvents.length === 0 && (
            <div className="text-center text-slate-400 dark:text-zinc-500 py-10 transition-colors">Nenhuma ameaça detectada próxima à sua localização.</div>
          )}
        </div>
      </div>
    </div>
  );
}
