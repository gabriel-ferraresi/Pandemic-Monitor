import { X, Moon, Sun, MapPin, Crosshair, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "../../utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  userLocation: { lat: number, lng: number, name?: string } | null;
  onLocationChange: (loc: { lat: number, lng: number, name?: string } | null) => void;
}

export function SettingsModal({ isOpen, onClose, theme, onThemeChange, userLocation, onLocationChange }: SettingsModalProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleManualSearch = async () => {
    if (!manualLocation.trim()) return;
    setIsSearching(true);
    setLocationError("");

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        onLocationChange({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: data[0].display_name.split(',')[0]
        });
        setManualLocation("");
      } else {
        setLocationError("Localização não encontrada. Tente ser mais específico.");
      }
    } catch (e) {
      setLocationError("Erro ao buscar localização.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError("");

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocoding to get city name (using free Nominatim API)
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || "Sua Localização";

            onLocationChange({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              name: city
            });
          } catch (e) {
            // Fallback if geocoding fails
            onLocationChange({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              name: "Localização Atual"
            });
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          setLocationError("Não foi possível obter a localização. Verifique as permissões do navegador.");
          setIsLocating(false);
        }
      );
    } else {
      setLocationError("Geolocalização não suportada pelo seu navegador.");
      setIsLocating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-500">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Configurações</h2>
          <button onClick={onClose} className="p-2 text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8">
          {/* Theme Settings */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Aparência</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onThemeChange('dark')}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  theme === 'dark' ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/20 dark:border-blue-500/50 dark:text-blue-400" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/10"
                )}
              >
                <Moon className="w-6 h-6" />
                <span className="text-sm font-medium">Modo Escuro</span>
              </button>
              <button
                onClick={() => onThemeChange('light')}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  theme === 'light' ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/20 dark:border-blue-500/50 dark:text-blue-400" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/10"
                )}
              >
                <Sun className="w-6 h-6" />
                <span className="text-sm font-medium">Modo Claro</span>
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">* O modo claro será aplicado gradualmente na interface.</p>
          </div>

          {/* Location Settings */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Sua Localização</h3>

            {userLocation ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-slate-800 dark:text-white font-bold">{userLocation.name}</div>
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onLocationChange(null)}
                  className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white underline"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleGetLocation}
                  disabled={isLocating || isSearching}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-all font-bold"
                >
                  {isLocating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Detectando...</>
                  ) : (
                    <><Crosshair className="w-5 h-5" /> Usar Localização do Navegador</>
                  )}
                </button>

                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
                  <span className="text-xs text-slate-400 dark:text-zinc-500 uppercase font-bold">OU</span>
                  <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite sua cidade..."
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                    className="flex-1 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500/50"
                  />
                  <button
                    onClick={handleManualSearch}
                    disabled={isSearching || !manualLocation.trim()}
                    className="px-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>

                {locationError && <p className="text-xs text-red-500 dark:text-red-400 text-center">{locationError}</p>}
                <p className="text-xs text-slate-500 dark:text-zinc-500 text-center mt-2">
                  Ative sua localização para ver alertas e ameaças próximas a você na aba "Minha Região".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
