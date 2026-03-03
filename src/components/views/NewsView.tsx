import { Newspaper, FileText, Globe, ExternalLink } from "lucide-react";
import { GlobalIntelligence } from "../../services/healthIntelligence";
import { useEffect, useState } from "react";
import { cn, formatToBRDate } from "../../utils";

export function NewsView({ data, targetNewsId, onClearTarget }: { data: GlobalIntelligence; targetNewsId?: string | null; onClearTarget?: () => void }) {
  const [activeTab, setActiveTab] = useState<'ai' | 'external'>('ai');

  useEffect(() => {
    if (targetNewsId) {
      // Find which tab it belongs to to auto-switch if necessary
      const isAi = data.aiArticles?.some(a => (a.id || a.title) === targetNewsId);
      const isExt = data.externalNews?.some(n => (n.id || n.title) === targetNewsId);

      if (isAi && activeTab !== 'ai') setActiveTab('ai');
      else if (isExt && activeTab !== 'external') setActiveTab('external');

      // Scroll to element after a short render delay
      setTimeout(() => {
        const el = document.getElementById(`news-${targetNewsId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-4', 'dark:ring-offset-black', 'transition-all', 'duration-500', 'z-20');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-4', 'dark:ring-offset-black', 'z-20');
            if (onClearTarget) onClearTarget();
          }, 3000); // Remove highlight after 3 seconds
        }
      }, 50);
    }
  }, [targetNewsId, data]);

  return (
    <div className="w-[600px] h-full flex flex-col bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-l border-slate-200 dark:border-white/10 z-10 relative shadow-[-4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.5)] transition-colors duration-500">
      <div className="p-6 border-b border-slate-200 dark:border-white/10 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
          <Newspaper className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          Central de Notícias
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 transition-colors">Relatórios gerados pela IA e fontes externas de inteligência.</p>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setActiveTab('ai')}
            className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center justify-center", activeTab === 'ai' ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/20 dark:border-blue-500/50 dark:text-blue-400" : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-zinc-500 dark:hover:text-zinc-300")}
          >
            <FileText className="w-4 h-4 mr-2" /> Relatórios da IA
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all flex items-center justify-center", activeTab === 'external' ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/20 dark:border-blue-500/50 dark:text-blue-400" : "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-zinc-500 dark:hover:text-zinc-300")}
          >
            <Globe className="w-4 h-4 mr-2" /> Fontes Externas
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-6 relative">
            {[...(data.aiArticles || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((article, index) => (
              <div key={`${article.id || article.title}-${index}`} id={`news-${article.id || article.title}`} className="p-5 rounded-xl bg-gradient-to-br from-slate-50 to-transparent dark:from-white/5 border border-slate-200 dark:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/20 dark:border-blue-500/50 dark:text-blue-400 transition-colors">
                    {article.theme}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-zinc-500 transition-colors">{formatToBRDate(article.date)}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 transition-colors">{article.title}</h3>
                <div className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap transition-colors">
                  {article.content}
                </div>
              </div>
            ))}
            {(!data.aiArticles || data.aiArticles.length === 0) && (
              <div className="text-center text-slate-400 dark:text-zinc-500 py-10 transition-colors">Nenhum relatório gerado ainda.</div>
            )}
          </div>
        )}

        {activeTab === 'external' && (
          <div className="flex flex-col gap-4 relative">
            {[...(data.externalNews || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((news, index) => {
              // Se a IA devolver "#" ou url vazia, criamos um link de busca blindado no Google News para validar a matéria real:
              const safeUrl = !news.url || news.url === '#'
                ? `https://news.google.com/search?q=${encodeURIComponent(news.title + (news.source ? ' ' + news.source : ''))}`
                : news.url;

              return (
                <a key={`${news.id || news.title}-${index}`} id={`news-${news.id || news.title}`} href={safeUrl} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30 transition-all group block">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-slate-800 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pr-4">{news.title}</h3>
                    <ExternalLink className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400 transition-colors">{news.source}</span>
                    <span className="font-mono text-slate-500 dark:text-zinc-500 transition-colors">{formatToBRDate(news.date)}</span>
                  </div>
                </a>
              )
            })}
            {(!data.externalNews || data.externalNews.length === 0) && (
              <div className="text-center text-slate-400 dark:text-zinc-500 py-10 transition-colors">Nenhuma notícia externa encontrada.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
