import React, { useState, useRef } from 'react';
import { AppDatabase, User } from '../types';
import { 
  FileJson, 
  PlusCircle, 
  Upload, 
  Lock, 
  ShieldAlert, 
  ArrowRight,
  Database,
  UserCheck,
  Key,
  Download
} from 'lucide-react';
import { HermesLogo } from './HermesLogo';
import { motion, AnimatePresence } from 'motion/react';

interface LoginFlowProps {
  initialDb: AppDatabase | null;
  onSuccess: (db: AppDatabase, currentUser: User, handle?: any) => void;
}

const LoginFlow: React.FC<LoginFlowProps> = ({ initialDb, onSuccess }) => {
  const [step, setStep] = useState<'landing' | 'auth' | 'bootstrap'>(() => {
    if (initialDb) {
      const hasAdmin = initialDb.utenti?.some(u => u.ruolo === 'admin');
      return hasAdmin ? 'auth' : 'bootstrap';
    }
    return 'landing';
  });
  const [db, setDb] = useState<AppDatabase | null>(initialDb);
  const [dbHandle, setDbHandle] = useState<any>(null);
  const [cip, setCip] = useState('');
  const [error, setError] = useState('');
  
  const [bootstrapForm, setBootstrapForm] = useState({
    grado: '',
    cognome: '',
    nome: '',
    cip: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePickerObj = async () => {
    try {
        if ('showOpenFilePicker' in window) {
            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [{
                    description: 'JSON Database',
                    accept: { 'application/json': ['.json'] }
                }],
                multiple: false
            });
            const file = await fileHandle.getFile();
            setDbHandle(fileHandle);
            handleLoadJson(file);
        } else {
            fileInputRef.current?.click();
        }
    } catch (e: any) {
        if (e.name !== 'AbortError') {
          setError("Errore durante l'apertura del file.");
        }
    }
  };

  const handleLoadJson = async (file: File) => {
    try {
      const text = await file.text();
      const loadedDb = JSON.parse(text) as AppDatabase;
      
      if (!loadedDb.configuratore || !loadedDb.segnalazioni) {
        throw new Error("Formato Database non valido.");
      }

      setDb(loadedDb);
      
      // Check if admin exists
      const hasAdmin = loadedDb.utenti?.some(u => u.ruolo === 'admin');
      if (!hasAdmin) {
        setStep('bootstrap');
      } else {
        setStep('auth');
      }
    } catch (err) {
      setError("Errore nel caricamento del file JSON.");
    }
  };

  const handleCreateNew = () => {
    const emptyDb: AppDatabase = {
      segnalazioni: [],
      configuratore: { categorie: [] },
      utenti: [],
      lastModified: new Date().toLocaleString()
    };
    
    // Download empty JSON
    const blob = new Blob([JSON.stringify(emptyDb, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hermes_new_database.json';
    a.click();
    
    setError("Per proseguire, carica il file JSON appena scaricato.");
  };

  const handleAuth = () => {
    if (!db) return;
    const user = db.utenti.find(u => u.cip.toUpperCase() === cip.toUpperCase());
    if (user) {
      onSuccess(db, user, dbHandle);
    } else {
      setError("CIP non riconosciuto nel database caricato.");
    }
  };

  const handleBootstrap = () => {
    if (!db) return;
    if (!bootstrapForm.cip || !bootstrapForm.cognome || !bootstrapForm.nome) {
      setError("Compilare tutti i campi obbligatori.");
      return;
    }

    const adminUser: User = {
      cip: bootstrapForm.cip.toUpperCase(),
      grado: bootstrapForm.grado.toUpperCase(),
      cognome: bootstrapForm.cognome.toUpperCase(),
      nome: bootstrapForm.nome.toUpperCase(),
      ruolo: 'admin',
      permessi: 'write',
      apiKey: ''
    };

    const newDb = { ...db, utenti: [adminUser] };
    setDb(newDb);
    onSuccess(newDb, adminUser, dbHandle);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[600px]"
      >
        {/* Left Side: Brand */}
        <div className="w-full md:w-5/12 bg-[#0a192f] p-10 text-white flex flex-col items-center justify-center text-center relative overflow-hidden">
          <HermesLogo size={120} className="mb-8" showText={false} />
          <h1 className="text-3xl font-black tracking-tighter mb-2">H.E.R.M.E.S.</h1>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-12">Investigative Suite</p>
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3 text-left">
               <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Lock size={14} className="text-indigo-400" />
               </div>
               <p className="text-[10px] text-slate-400 font-medium leading-tight">Accesso crittografato e autenticazione tramite CIP locale.</p>
            </div>
            <div className="flex items-center gap-3 text-left">
               <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Database size={14} className="text-indigo-400" />
               </div>
               <p className="text-[10px] text-slate-400 font-medium leading-tight">I dati risiedono esclusivamente nel file JSON di tua proprietà.</p>
            </div>
          </div>

          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 p-12 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 'landing' && (
              <motion.div 
                key="landing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Benvenuto</h2>
                  <p className="text-sm text-slate-500">Inizializza la piattaforma H.E.R.M.E.S. per iniziare l'analisi.</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={openFilePickerObj}
                    className="w-full group bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-3xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex items-center gap-6"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileJson className="text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">Apri Database Esistente</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Seleziona file .json</p>
                    </div>
                  </button>

                  <button 
                    onClick={handleCreateNew}
                    className="w-full group bg-white border border-slate-200 p-6 rounded-3xl hover:shadow-lg transition-all flex items-center gap-6"
                  >
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlusCircle size={24} className="text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">Crea Nuovo Database</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Scarica modello vuoto</p>
                    </div>
                  </button>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".json" 
                  onChange={(e) => e.target.files?.[0] && handleLoadJson(e.target.files[0])} 
                />
              </motion.div>
            )}

            {step === 'auth' && (
              <motion.div 
                key="auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                   <button onClick={() => setStep('landing')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 hover:underline">
                     Indietro
                   </button>
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Autenticazione</h2>
                   <p className="text-sm text-slate-500">Inserisci il tuo Codice Identificativo Personale.</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Codice CIP..."
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 font-black tracking-widest uppercase text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:font-normal placeholder:tracking-normal"
                      value={cip}
                      onChange={(e) => setCip(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    />
                  </div>
                  <button 
                    onClick={handleAuth}
                    className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    <span>Accedi al Sistema</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'bootstrap' && (
              <motion.div 
                key="bootstrap"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-4 mb-2">
                   <ShieldAlert className="text-amber-600 shrink-0" size={20} />
                   <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                     ATTENZIONE: Nessun Amministratore rilevato nel database. Devi impostare il CIP per l'utenza Master per proseguire.
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CIP Amministratore *</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold uppercase"
                        value={bootstrapForm.cip}
                        onChange={e => setBootstrapForm({...bootstrapForm, cip: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Grado</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold uppercase"
                        value={bootstrapForm.grado}
                        onChange={e => setBootstrapForm({...bootstrapForm, grado: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Cognome *</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold uppercase"
                        value={bootstrapForm.cognome}
                        onChange={e => setBootstrapForm({...bootstrapForm, cognome: e.target.value})}
                      />
                   </div>
                   <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome *</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold uppercase"
                        value={bootstrapForm.nome}
                        onChange={e => setBootstrapForm({...bootstrapForm, nome: e.target.value})}
                      />
                   </div>
                </div>

                <button 
                  onClick={handleBootstrap}
                  className="w-full h-12 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all mt-4"
                >
                  Configura e Accedi
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 border border-red-100"
            >
              <ShieldAlert size={14} />
              {error}
            </motion.div>
          )}

          {step === 'landing' && (
            <p className="mt-12 text-center text-[10px] text-slate-400 uppercase font-bold tracking-widest">
              HUB ELABORATIVO RICERCA METADATI E EVENTI SEGNALATI
            </p>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default LoginFlow;
