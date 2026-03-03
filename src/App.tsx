/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { GlobeComponent } from "./components/GlobeComponent";
import { BottomTicker, TickerItem } from "./components/BottomTicker";
import { getLiveHealthIntelligence, GlobalIntelligence, FALLBACK_DATA } from "./services/healthIntelligence";
import { OutbreaksView } from "./components/views/OutbreaksView";
import { ThreatsView } from "./components/views/ThreatsView";
import { VaccinesView } from "./components/views/VaccinesView";
import { PathogensView } from "./components/views/PathogensView";
import { SelectedEventPanel } from "./components/views/SelectedEventPanel";
import { NewsView } from "./components/views/NewsView";
import { LocalView } from "./components/views/LocalView";
import { SettingsModal } from "./components/views/SettingsModal";
import { getStoredIntelligence, updateIntelligenceDB } from "./services/database";
import { TimelineFilter } from "./components/TimelineFilter";

export default function App() {
  const [healthData, setHealthData] = useState<GlobalIntelligence>(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [activeView, setActiveView] = useState('global');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState('live');
  const [targetNewsId, setTargetNewsId] = useState<string | null>(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number, name?: string } | null>(() => {
    const saved = localStorage.getItem('user_location');
    return saved ? JSON.parse(saved) : null;
  });

  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save location
  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('user_location', JSON.stringify(userLocation));
    } else {
      localStorage.removeItem('user_location');
    }
  }, [userLocation]);

  const fetchIntelligence = async (range: string) => {
    setLoading(true);
    const aiData = await getLiveHealthIntelligence(range);
    const mergedData = updateIntelligenceDB(aiData);
    setHealthData(mergedData);
    if (mergedData.lastSync) {
      setLastUpdated(new Date(mergedData.lastSync));
    } else {
      setLastUpdated(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    const stored = getStoredIntelligence();
    if (stored && timeRange === 'live') { // Only use cache for live view
      setHealthData(stored);
      if (stored.lastSync) setLastUpdated(new Date(stored.lastSync));
      setLoading(false);
      fetchIntelligence(timeRange); // Fetch in background
    } else {
      fetchIntelligence(timeRange);
    }
    // Hard reload is handled internally by Header.tsx 15-minute countdown
  }, [timeRange]);

  const handleEventSelect = (item: any, type: 'outbreak' | 'anomaly' | 'globe') => {
    let eventPoint;

    if (type === 'globe') {
      // Data is already formatted by GlobeComponent
      eventPoint = item;
    } else if (type === 'outbreak') {
      eventPoint = {
        ...item,
        type: 'outbreak',
        title: item.disease,
        location: item.country,
        cases: item.casesEstimate,
        color: item.severity === 'CRITICAL' ? '#ef4444' : item.severity === 'HIGH' ? '#f59e0b' : '#eab308'
      };
    } else {
      eventPoint = {
        ...item,
        type: 'anomaly',
        title: 'Padrão Anômalo',
        summary: item.description,
        color: '#a855f7'
      };
    }

    setSelectedLocation({ lat: item.lat, lng: item.lng });
    setSelectedEvent(eventPoint);
  };

  const getTickerItems = (): TickerItem[] => {
    const items: (TickerItem & { date: string })[] = [];
    if (healthData.aiArticles) {
      healthData.aiArticles.forEach(a => items.push({ id: a.id || a.title, title: `IA RELATÓRIO: ${a.title}`, type: 'ai', date: a.date || '' }));
    }
    if (healthData.externalNews) {
      healthData.externalNews.forEach(n => items.push({ id: n.id || n.title, title: `MUNDO: ${n.title}`, type: 'external', date: n.date || '' }));
    }
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 11);
  };

  return (
    <div className="flex flex-col h-screen w-screen transition-colors duration-500 bg-slate-50 dark:bg-[#050505] overflow-hidden font-sans text-slate-700 dark:text-zinc-400 selection:bg-emerald-500/30 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-10 dark:opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500 dark:from-blue-900 via-transparent to-transparent z-0" />

      <Header
        loading={loading}
        lastUpdated={lastUpdated}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main className="flex-1 flex relative overflow-hidden">
        <NavigationSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <GlobeComponent data={healthData} focusLocation={selectedLocation} onEventClick={(point) => handleEventSelect(point, 'globe')} />

        {/* Selected Event Floating Panel */}
        <SelectedEventPanel event={selectedEvent} onClose={() => {
          setSelectedEvent(null);
          setSelectedLocation(null);
        }} />

        <div className="flex-1" />

        {/* Dynamic View Rendering */}
        {activeView === 'global' && <Sidebar data={healthData} onAlertClick={(item, type) => handleEventSelect(item, type)} />}
        {activeView === 'local' && <LocalView data={healthData} userLocation={userLocation} onAlertClick={(item, type) => handleEventSelect(item, type)} />}
        {activeView === 'outbreaks' && <OutbreaksView data={healthData} onAlertClick={(item) => handleEventSelect(item, 'outbreak')} />}
        {activeView === 'threats' && <ThreatsView data={healthData} onAlertClick={(item) => handleEventSelect(item, 'anomaly')} />}
        {activeView === 'news' && <NewsView data={healthData} targetNewsId={targetNewsId} onClearTarget={() => setTargetNewsId(null)} />}
        {activeView === 'vaccines' && <VaccinesView />}
        {activeView === 'pathogens' && <PathogensView />}

        <TimelineFilter activeRange={timeRange} onChangeRange={setTimeRange} isEventSelected={!!selectedEvent} />

      </main>
      <BottomTicker
        news={getTickerItems()}
        onNewsClick={(item) => {
          setActiveView('news');
          setTargetNewsId(item.id);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        userLocation={userLocation}
        onLocationChange={setUserLocation}
      />
    </div>
  );
}



