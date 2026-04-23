import React from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Database,
  Users,
  Activity,
  History
} from 'lucide-react';
import { AppDatabase, User } from '../types';
import { HermesLogo } from './HermesLogo';
import { motion } from 'motion/react';

interface CruscottoViewProps {
  db: AppDatabase;
  currentUser: User;
}

const CruscottoView: React.FC<CruscottoViewProps> = ({ db, currentUser }) => {
  const stats = [
    { 
      label: 'Segnalazioni Totali', 
      value: db.segnalazioni.length, 
      icon: Database, 
      color: 'blue',
      detail: 'In archivio'
    },
    { 
      label: 'In Revisione', 
      value: db.segnalazioni.filter(s => s.requiresRevision).length, 
      icon: AlertTriangle, 
      color: 'amber',
      detail: 'Richiedono check'
    },
    { 
      label: 'Utenti Attivi', 
      value: db.utenti.length, 
      icon: Users, 
      color: 'indigo',
      detail: 'Profili censiti'
    },
    { 
      label: 'Status Motore AI', 
      value: currentUser.apiKey ? 'Operativo' : 'Non Configurato', 
      icon: Zap, 
      color: currentUser.apiKey ? 'emerald' : 'slate',
      detail: currentUser.apiKey ? 'Gemini 1.5 Act.' : 'Configura Key'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="bg-[#0a192f] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
            <HermesLogo size={120} className="text-white" showText={false} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                Cruscotto Operativo
              </span>
              <span className="px-3 py-1 bg-white/10 text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-white/5">
                v4.0 Enterprise
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none">
              SISTEMA <span className="text-indigo-400">H.E.R.M.E.S.</span>
            </h1>
            <p className="text-slate-400 max-w-xl text-lg leading-relaxed">
              Infrastruttura di analisi avanzata per il monitoraggio dei fenomeni criminali. 
              Benvenuto operatore, <span className="text-white font-bold">{currentUser.grado} {currentUser.cognome} {currentUser.nome}</span>.
            </p>
          </div>
        </div>
        
        {/* Background Decorative */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/10 to-transparent" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-medium">
               <span className="text-slate-400">{stat.detail}</span>
               <CheckCircle2 size={12} className="text-emerald-500" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary Insights & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-indigo-600" /> Integrità Informativa
            </h3>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <History className="text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Ultimo Salvataggio Database</p>
                      <p className="text-xs text-slate-500">{db.lastModified || 'Mai salvato'}</p>
                    </div>
                  </div>
                  <ShieldCheck className="text-emerald-500" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Qualità Classificazione AI</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div 
                        className="bg-indigo-500 h-full" 
                        style={{ width: db.segnalazioni.length > 0 ? `${(db.segnalazioni.filter(s => !s.requiresRevision).length / db.segnalazioni.length) * 100}%` : '0%' }}
                       />
                    </div>
                    <p className="text-[10px] text-slate-500 text-right">
                       {db.segnalazioni.length > 0 ? 
                        Math.round((db.segnalazioni.filter(s => !s.requiresRevision).length / db.segnalazioni.length) * 100) : 0}% Dati Standardizzati
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Copertura Geografica</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                       <div 
                        className="bg-emerald-500 h-full" 
                        style={{ width: db.segnalazioni.length > 0 ? `${(new Set(db.segnalazioni.map(s => s.provincia)).size / 107) * 100}%` : '0%' }}
                       />
                    </div>
                    <p className="text-[10px] text-slate-500 text-right">
                      {new Set(db.segnalazioni.map(s => s.provincia)).size} Province Interessate
                    </p>
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Alert di Sistema</h3>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
               {db.segnalazioni.filter(s => s.requiresRevision).length > 0 && (
                 <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Revisioni Pendenti</p>
                      <p className="text-[10px] text-amber-700 mt-1">
                        Sono presenti {db.segnalazioni.filter(s => s.requiresRevision).length} record caricati tramite AI che richiedono una validazione manuale della classificazione.
                      </p>
                    </div>
                 </div>
               )}
               {!currentUser.apiKey && (
                 <div className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <Zap className="text-red-500 shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-bold text-red-900">Motore AI Disattivato</p>
                      <p className="text-[10px] text-red-700 mt-1">
                        La chiave API Gemini non è configurata per il tuo profilo. Le funzionalità di analisi e sintesi automatica non saranno disponibili.
                      </p>
                    </div>
                 </div>
               )}
               {db.segnalazioni.length === 0 && (
                 <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <BarChart3 className="text-blue-500 shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-bold text-blue-900">Analisi Indisponibile</p>
                      <p className="text-[10px] text-blue-700 mt-1">
                        Il database risulta vuoto. Importa un dataset JSON nello Schedario per generare mappe e analisi fenomenologiche.
                      </p>
                    </div>
                 </div>
               )}
               {db.segnalazioni.length > 0 && currentUser.apiKey && db.segnalazioni.filter(s => s.requiresRevision).length === 0 && (
                 <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <ShieldCheck size={48} className="mb-4 opacity-20" />
                    <p className="text-xs font-medium">Tutti i sistemi sono nominali. Nessuna criticità rilevata nella gestione dati.</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default CruscottoView;
