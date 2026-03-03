import { useState } from "react";
import { Database, Search, Activity, ShieldAlert } from "lucide-react";

export function PathogensView() {
  const [searchTerm, setSearchTerm] = useState('');

  const PATHOGENS = [
    { name: 'Dengue (DENV)', type: 'Vírus', family: 'Flaviviridae', risk: 'Alto', vector: 'Aedes aegypti' },
    { name: 'Influenza A (H5N1)', type: 'Vírus', family: 'Orthomyxoviridae', risk: 'Crítico', vector: 'Aves' },
    { name: 'Influenza A (H1N1)', type: 'Vírus', family: 'Orthomyxoviridae', risk: 'Moderado', vector: 'Gotículas respiratórias' },
    { name: 'Influenza A (H3N2)', type: 'Vírus', family: 'Orthomyxoviridae', risk: 'Alto', vector: 'Gotículas respiratórias' },
    { name: 'Vibrio cholerae', type: 'Bactéria', family: 'Vibrionaceae', risk: 'Alto', vector: 'Água/Alimento Contaminado' },
    { name: 'Mpox (Clado I e II)', type: 'Vírus', family: 'Poxviridae', risk: 'Alto', vector: 'Contato Direto' },
    { name: 'Ebola', type: 'Vírus', family: 'Filoviridae', risk: 'Crítico', vector: 'Morcegos / Fluidos Corporais' },
    { name: 'Zika', type: 'Vírus', family: 'Flaviviridae', risk: 'Moderado', vector: 'Aedes aegypti' },
    { name: 'Chikungunya', type: 'Vírus', family: 'Togaviridae', risk: 'Alto', vector: 'Aedes aegypti / Aedes albopictus' },
    { name: 'Vírus de Marburg', type: 'Vírus', family: 'Filoviridae', risk: 'Crítico', vector: 'Morcegos / Fluidos Corporais' },
    { name: 'Vírus de Lassa', type: 'Vírus', family: 'Arenaviridae', risk: 'Alto', vector: 'Roedores' },
    { name: 'Coronavirus da Síndrome Respiratória do Oriente Médio (MERS-CoV)', type: 'Vírus', family: 'Coronaviridae', risk: 'Crítico', vector: 'Camelos' },
    { name: 'SARS-CoV-1', type: 'Vírus', family: 'Coronaviridae', risk: 'Crítico', vector: 'Gotículas respiratórias' },
    { name: 'SARS-CoV-2 (Variantes de Preocupação)', type: 'Vírus', family: 'Coronaviridae', risk: 'Alto', vector: 'Gotículas respiratórias/Aerossóis' },
    { name: 'Vírus Nipah', type: 'Vírus', family: 'Paramyxoviridae', risk: 'Crítico', vector: 'Morcegos / Suínos' },
    { name: 'Vírus Hendra', type: 'Vírus', family: 'Paramyxoviridae', risk: 'Alto', vector: 'Cavalos' },
    { name: 'Febre do Vale do Rift (RVF)', type: 'Vírus', family: 'Phenuiviridae', risk: 'Alto', vector: 'Mosquitos / Contato direto com animais' },
    { name: 'Crimeia-Congo (CCHF)', type: 'Vírus', family: 'Nairoviridae', risk: 'Crítico', vector: 'Carrapatos' },
    { name: 'Febre Amarela', type: 'Vírus', family: 'Flaviviridae', risk: 'Alto', vector: 'Mosquitos (Sabethes, Haemagogus, Aedes)' },
    { name: 'Polivírus Selvagem (WPV)', type: 'Vírus', family: 'Picornaviridae', risk: 'Crítico', vector: 'Fecal-Oral' },
    { name: 'Mycobacterium tuberculosis', type: 'Bactéria', family: 'Mycobacteriaceae', risk: 'Alto', vector: 'Gotículas respiratórias' },
    { name: 'Yersinia pestis', type: 'Bactéria', family: 'Yersiniaceae', risk: 'Alto', vector: 'Pulgas' },
    { name: 'Salmonella Typhi', type: 'Bactéria', family: 'Enterobacteriaceae', risk: 'Moderado', vector: 'Água/Alimento Contaminado' },
    { name: 'Bacillus anthracis', type: 'Bactéria', family: 'Bacillaceae', risk: 'Crítico', vector: 'Esporos' },
    { name: 'Oropouche (OROV)', type: 'Vírus', family: 'Peribunyaviridae', risk: 'Moderado', vector: 'Maruins (Culicoides paraensis)' },
    { name: 'Vírus Sincicial Respiratório (VSR)', type: 'Vírus', family: 'Pneumoviridae', risk: 'Alto', vector: 'Gotículas respiratórias' },
    { name: 'Difteria (Corynebacterium diphtheriae)', type: 'Bactéria', family: 'Corynebacteriaceae', risk: 'Moderado', vector: 'Gotículas respiratórias' },
    { name: 'Neisseria meningitidis', type: 'Bactéria', family: 'Neisseriaceae', risk: 'Alto', vector: 'Gotículas respiratórias' },
    { name: 'Legionella pneumophila', type: 'Bactéria', family: 'Legionellaceae', risk: 'Moderado', vector: 'Sistemas de Água/Aerossóis' },
    { name: 'Candida auris', type: 'Fungo', family: 'Saccharomycetaceae', risk: 'Crítico', vector: 'Contato Direto (Ambiente Hospitalar)' },
    { name: 'Clostridium botulinum', type: 'Bactéria', family: 'Clostridiaceae', risk: 'Alto', vector: 'Toxinas Alimentaress' },
    { name: 'Plasmodium falciparum (Malária)', type: 'Parasita', family: 'Plasmodiidae', risk: 'Crítico', vector: 'Mosquito Anopheles' }
  ];

  const filteredPathogens = PATHOGENS.filter(pathogen =>
    pathogen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pathogen.family.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-[600px] h-full flex flex-col bg-white/90 dark:bg-black/80 backdrop-blur-2xl border-l border-slate-200 dark:border-white/10 z-10 relative shadow-[-4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-[-4px_0_24px_rgba(0,0,0,0.5)] transition-colors duration-500">
      <div className="p-6 border-b border-slate-200 dark:border-white/10 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          Banco de Patógenos
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 transition-colors">Catálogo de ameaças biológicas monitoradas pela plataforma.</p>

        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar patógeno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="grid gap-4">
          {filteredPathogens.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-zinc-500 py-10 transition-colors">Nenhum patógeno encontrado com esse termo.</div>
          ) : (
            filteredPathogens.map((pathogen, i) => (
              <div key={i} className="p-5 rounded-xl bg-gradient-to-br from-slate-50 dark:from-white/5 to-transparent border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{pathogen.name}</h3>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-1 transition-colors">{pathogen.family}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-zinc-300 transition-colors">
                      {pathogen.type}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-white/10 transition-colors">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1 transition-colors">
                      <ShieldAlert className="w-3 h-3" /> Risco Global
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white transition-colors">{pathogen.risk}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1 transition-colors">
                      <Activity className="w-3 h-3" /> Transmissão
                    </div>
                    <div className="text-sm text-slate-600 dark:text-zinc-300 transition-colors">{pathogen.vector}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
