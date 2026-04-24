import React, { useState, useMemo } from 'react';
import { Segnalazione, AppDatabase } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Wrench, 
  ArrowRight,
  Database,
  FileWarning,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VerificaDBProps {
  db: AppDatabase;
  setDb: (db: AppDatabase) => void;
  onEditReport: (report: Segnalazione) => void;
  onViewReport: (report: Segnalazione) => void;
  onAutoSave?: () => void;
}

interface Issue {
  id: string;
  reportId: string;
  field: string;
  severity: 'critical' | 'warning';
  message: string;
  suggestion: string;
  canAutoFix?: boolean;
}

const VerificaDB: React.FC<VerificaDBProps> = ({ db, setDb, onEditReport, onViewReport, onAutoSave }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [resolvingIssue, setResolvingIssue] = useState<{issue: Issue, report: Segnalazione} | null>(null);
  const [isResolvingAll, setIsResolvingAll] = useState(false);

  const performCheck = () => {
    setIsVerifying(true);
    setIssues([]);
    
    // Logic delay to simulate scan
    setTimeout(() => {
      const foundIssues: Issue[] = [];
      const now = new Date();

      db.segnalazioni.forEach(r => {
        // Detect if it SHOULD have subjects but doesn't
        const textToAnalyze = ((r.oggetto || '') + ' ' + (r.dinamica || '') + ' ' + (r.sunto || '')).toLowerCase();
        
        // Positive indicators that subjects SHOULD be present
        const criminalKeywords = ['arrestato', 'denunciato', 'identificato', 'ignoti', 'vittima', 'derubata', 'aggressione', 'responsabile', 'autore', 'autori'];
        const shouldHaveSubjects = criminalKeywords.some(kw => textToAnalyze.includes(kw));
        
        // Negative indicators that it's just an event/phenomenon
        const intentionalPhenomenonKeywords = ['solo evento', 'fenomeno puro', 'analisi fenomenologica', 'monitoraggio statistico', 'andamento dei delitti', 'comunicazione di evento'];
        const isExplicitlyPhenomenon = intentionalPhenomenonKeywords.some(kw => textToAnalyze.includes(kw)) || r.isSoloFenomeno;

        // 1. Missing Subjects Incongruence
        if ((!r.indagati || r.indagati.length === 0) && (!r.vittime || r.vittime.length === 0) && !isExplicitlyPhenomenon && shouldHaveSubjects) {
          foundIssues.push({
            id: Math.random().toString(36).substring(2, 9),
            reportId: r.idUnivoco,
            field: 'soggetti',
            severity: 'critical',
            message: 'Incongruenza soggetti: il testo suggerisce la presenza di persone non censite.',
            suggestion: 'Aggiungere indagati/vittime o confermare come "Evento senza Soggetti".'
          });
        }

        // 2. Critical: Missing core fields
        if (!r.oggetto || r.oggetto.trim() === '') {
          foundIssues.push({
            id: Math.random().toString(36).substring(2, 9),
            reportId: r.idUnivoco,
            field: 'oggetto',
            severity: 'critical',
            message: 'Oggetto mancante.',
            suggestion: 'Definire l\'oggetto dell\'evento.'
          });
        }

        if (!r.comune || r.comune.trim() === '') {
          foundIssues.push({
            id: Math.random().toString(36).substring(2, 9),
            reportId: r.idUnivoco,
            field: 'comune',
            severity: 'critical',
            message: 'Comune non specificato.',
            suggestion: 'Inserire il luogo dell\'evento.'
          });
        }

        // 3. Taxonomy checks
        if (!r.categoria || r.categoria === '' || r.categoria === 'NON CLASSIFICATA') {
          foundIssues.push({
            id: Math.random().toString(36).substring(2, 9),
            reportId: r.idUnivoco,
            field: 'categoria',
            severity: 'warning',
            message: 'Classificazione incompleta.',
            suggestion: 'Assegnare categoria e modus operandi.'
          });
        }

        // 4. Temporal Integrity
        const parts = (r.dataOra || '').split(' ');
        const datePart = parts[0] || '';
        const timePart = parts[1] || '00:00';
        
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const timeRegex = /^(\d{2}):(\d{2})$/;
        
        const isDateValid = dateRegex.test(datePart);
        const isTimeValid = timeRegex.test(timePart);
        
        let isValid = isDateValid && isTimeValid;
        
        if (isDateValid) {
          const [, d, m, y] = datePart.match(dateRegex)!;
          const day = parseInt(d);
          const month = parseInt(m);
          const year = parseInt(y);
          if (month < 1 || month > 12 || day < 1 || day > 31) isValid = false;
          // Basic leap year check can be omitted for brevity or added if really needed
        }

        if (!r.dataOra || !isValid) {
          foundIssues.push({
            id: Math.random().toString(36).substring(2, 9),
            reportId: r.idUnivoco,
            field: 'dataOra',
            severity: 'critical',
            message: 'Data o Orario non validi. Formato richiesto: GG/MM/AAAA e HH:MM.',
            suggestion: 'Correggere i campi temporali.'
          });
        }

        // 5. Subject Birth Dates integrity
        [...(r.indagati || []), ...(r.vittime || [])].forEach(p => {
          if (p.dataNascita && !dateRegex.test(p.dataNascita)) {
            foundIssues.push({
              id: Math.random().toString(36).substring(2, 9),
              reportId: r.idUnivoco,
              field: 'dataNascita_soggetti',
              severity: 'warning',
              message: `Data nascita non valida per ${p.cognome} ${p.nome}: ${p.dataNascita}`,
              suggestion: 'Normalizzare formato in GG/MM/AAAA.'
            });
          }
        });
      });

      setIssues(foundIssues);
      setIsVerifying(false);
      setLastCheck(new Date());
    }, 1200);
  };

  // Auto-scan on component mount
  React.useEffect(() => {
    performCheck();
  }, []);

  const getSuggestedReport = (report: Segnalazione, issue: Issue): Segnalazione => {
    const r = { ...report };
    const normalizeDateStr = (val?: string) => {
      if (!val) return '01/01/2000';
      const clean = val.replace(/[\.\-]/g, '/');
      const parts = clean.split('/');
      if (parts.length === 3) {
        let d = parts[0];
        let m = parts[1];
        let y = parts[2];
        if (d.length === 4) { // YYYY/MM/DD
          [d, y] = [y, d];
        }
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y.padStart(4, '0')}`;
      }
      return clean;
    };

    if (issue.field === 'soggetti') r.isSoloFenomeno = true;
    if (issue.field === 'categoria') r.categoria = r.categoria || 'ALTRO';
    if (issue.field === 'comune') r.comune = r.comune || (db.comandoName || 'ROMA').split(' ').pop() || 'ROMA';
    if (issue.field === 'oggetto') r.oggetto = r.oggetto || 'EVENTO DA DEFINIRE';
    
    if (issue.field === 'dataOra') {
      const parts = (r.dataOra || '').split(/[ T]/);
      const d = normalizeDateStr(parts[0]);
      let t = parts[1] || '00:00';
      const tParts = t.split(':');
      if (tParts.length >= 2) {
        t = `${tParts[0].padStart(2, '0')}:${tParts[1].padStart(2, '0')}`;
      } else if (tParts.length === 1 && tParts[0]) {
        t = `${tParts[0].padStart(2, '0')}:00`;
      }
      r.dataOra = `${d} ${t}`;
    }

    if (issue.field === 'dataNascita_soggetti') {
      r.indagati = r.indagati.map(p => ({ ...p, dataNascita: p.dataNascita ? normalizeDateStr(p.dataNascita) : p.dataNascita }));
      r.vittime = r.vittime.map(p => ({ ...p, dataNascita: p.dataNascita ? normalizeDateStr(p.dataNascita) : p.dataNascita }));
    }

    return r;
  };

  const resolveAll = () => {
    if (!confirm(`Vuoi tentare di risolvere automaticamente ${issues.length} incongruenze? Verranno applicate le soluzioni ottimali suggerite dal sistema.`)) return;
    
    setIsResolvingAll(true);
    setTimeout(() => {
      setDb(prev => {
        const newSegnalazioni = [...prev.segnalazioni];
        issues.forEach(issue => {
          const idx = newSegnalazioni.findIndex(s => s.idUnivoco === issue.reportId);
          if (idx !== -1) {
            newSegnalazioni[idx] = getSuggestedReport(newSegnalazioni[idx], issue);
          }
        });
        return { ...prev, segnalazioni: newSegnalazioni };
      });
      setIssues([]);
      setIsResolvingAll(false);
      if (onAutoSave) onAutoSave();
      alert("Tutte le incongruenze sono state sanate applicando i suggerimenti automatici.");
    }, 1000);
  };

  const saveResolution = (updatedReport: Segnalazione) => {
    // Normalizziamo la data prima di salvare se stiamo risolvendo un errore di dataOra o dataNascita
    let reportToSave = { ...updatedReport };
    
    const normalizeDateStr = (val: string) => {
      const clean = val.replace(/[\.\-]/g, '/');
      const parts = clean.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2].padStart(4, '0')}`;
      }
      return clean;
    };

    if (resolvingIssue?.issue.field === 'dataOra') {
      const parts = (reportToSave.dataOra || '').split(' ');
      let d = parts[0] ? normalizeDateStr(parts[0]) : '01/01/2000';
      let t = parts[1] || '00:00';
      
      const tParts = t.split(':');
      if (tParts.length >= 2) {
         t = `${tParts[0].padStart(2, '0')}:${tParts[1].padStart(2, '0')}`;
      }
      reportToSave.dataOra = `${d} ${t}`;
    }

    if (resolvingIssue?.issue.field === 'dataNascita_soggetti') {
      reportToSave.indagati = reportToSave.indagati.map(p => ({ ...p, dataNascita: p.dataNascita ? normalizeDateStr(p.dataNascita) : p.dataNascita }));
      reportToSave.vittime = reportToSave.vittime.map(p => ({ ...p, dataNascita: p.dataNascita ? normalizeDateStr(p.dataNascita) : p.dataNascita }));
    }

    setDb(prev => {
      const newSeg = prev.segnalazioni.map(s => s.idUnivoco === reportToSave.idUnivoco ? reportToSave : s);
      return { ...prev, segnalazioni: newSeg };
    });
    // Remove issues related to this report from the list
    setIssues(prev => prev.filter(i => i.reportId !== reportToSave.idUnivoco));
    setResolvingIssue(null);
    if (onAutoSave) {
      setTimeout(() => onAutoSave(), 200); // Small delay to let db state update
    }
  };

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const warningIssues = issues.filter(i => i.severity === 'warning');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 min-h-[600px] pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-rose-600" />
            Integrity Check & Sanificazione
          </h2>
          <p className="text-sm text-slate-500">Monitoraggio automatico delle incongruenze informative e risoluzione rapida.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={performCheck}
            disabled={isVerifying}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            Scansiona DB
          </button>
          {issues.length > 0 && (
            <button 
              onClick={resolveAll}
              disabled={isResolvingAll || isVerifying}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Wrench className="w-4 h-4" />
              Risolvi tutte ({issues.length})
            </button>
          )}
        </div>
      </div>

      {!lastCheck && !isVerifying && (
        <div className="bg-white p-20 text-center rounded-[3rem] border border-slate-200 border-dashed">
            <Database className="mx-auto text-slate-200 w-20 h-20 mb-6" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Database in attesa di scansione</h3>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">Il motore di controllo verificherà la presenza di anomalie strutturali o semantiche in tutte le segnalazioni archiviate.</p>
        </div>
      )}

      {isVerifying && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                <Database className="w-16 h-16 text-indigo-600 relative z-10 animate-bounce" />
            </div>
            <div className="text-center">
                <p className="font-black text-slate-800 uppercase tracking-widest text-sm">Analisi dei record in corso...</p>
                <p className="text-xs text-slate-400 mt-1">Verifica coerenza tassonomia e tracciabilità...</p>
            </div>
        </div>
      )}

      {lastCheck && !isVerifying && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Database size={20} /></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase">Totale Record</span>
                </div>
                <p className="text-3xl font-black text-slate-800">{db.segnalazioni.length}</p>
                <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-full" />
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="p-2 bg-red-50 text-red-600 rounded-xl"><ShieldAlert size={20} /></span>
                    <span className="text-[10px] font-black text-red-400 uppercase">Criticità</span>
                </div>
                <p className="text-3xl font-black text-red-600">{criticalIssues.length}</p>
                <p className="text-xs text-red-400 mt-1">Errori che inibiscono l'analisi avanzata.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={20} /></span>
                    <span className="text-[10px] font-black text-amber-400 uppercase">Avvisi</span>
                </div>
                <p className="text-3xl font-black text-amber-600">{warningIssues.length}</p>
                <p className="text-xs text-amber-400 mt-1">Incongruenze minori o dati parziali.</p>
            </div>
          </div>

          {issues.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-[2rem] text-center">
                <CheckCircle2 className="mx-auto text-emerald-500 w-12 h-12 mb-4" />
                <h3 className="text-lg font-black text-emerald-800">DATABASE INTEGRO</h3>
                <p className="text-sm text-emerald-600">Nessuna anomalia rilevata nei dati archiviati.</p>
            </div>
          ) : (
            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Elenco Anomalie Riscontrate</h3>
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {issues.map((issue) => {
                            const report = db.segnalazioni.find(s => s.idUnivoco === issue.reportId);
                            if (!report) return null;

                            return (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={issue.id}
                                    className={`bg-white p-6 rounded-3xl border ${issue.severity === 'critical' ? 'border-red-100' : 'border-amber-100'} shadow-sm flex items-center justify-between gap-6 group hover:shadow-md transition-all`}
                                >
                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                        <div className={`p-4 rounded-2xl shrink-0 ${issue.severity === 'critical' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                                            {issue.severity === 'critical' ? <FileWarning size={24} /> : <AlertTriangle size={24} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase font-mono">
                                                    PROT: {report.protocollo || 'N/D'}
                                                </span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${issue.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                                                    {issue.severity}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 truncate uppercase">{report.oggetto || 'Senza Oggetto'}</h4>
                                            <p className="text-xs text-slate-500 mt-1 font-medium">{issue.message}</p>
                                            <div className="flex items-center gap-2 mt-3 text-indigo-600">
                                                <Wrench size={12} />
                                                <span className="text-[10px] font-black uppercase italic tracking-tight">{issue.suggestion}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onViewReport(report)}
                                            className="bg-indigo-50 text-indigo-600 px-4 py-3 rounded-2xl font-bold text-xs hover:bg-indigo-100 transition-colors active:scale-95"
                                        >
                                            DETTAGLI
                                        </button>
                                        <button 
                                            onClick={() => setResolvingIssue({issue, report})}
                                            className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors whitespace-nowrap active:scale-95"
                                        >
                                            RISOLVI ORA
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                 </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
          )}
        </>
      )}

      {/* Resolution Modal */}
      <AnimatePresence>
        {resolvingIssue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResolvingIssue(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center gap-4 mb-6 shrink-0">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Wrench size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Risoluzione Proattiva</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase">{resolvingIssue.report.protocollo || 'Doc Corrente'}</p>
                </div>
              </div>

              <div className="overflow-y-auto pr-2 space-y-6 flex-1">
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 italic">Anomalia Rilevata:</p>
                  <p className="text-sm font-bold text-rose-800 leading-snug">{resolvingIssue.issue.message}</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-3 py-1 bg-white rounded-full border border-indigo-100">Soluzione Suggerita dal Sistema</p>
                    <span className="text-[9px] font-bold text-slate-400 uppercase italic">Modificabile</span>
                  </div>

                  <div className="space-y-4">
                    {/* Dynamic Field Editor based on Issue */}
                    {resolvingIssue.issue.field === 'comune' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Piazza / Comune di Intervento</label>
                        <input 
                          id="suggested-field"
                          defaultValue={getSuggestedReport(resolvingIssue.report, resolvingIssue.issue).comune}
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                        />
                      </div>
                    )}

                    {resolvingIssue.issue.field === 'oggetto' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Oggetto dell'Atto</label>
                        <input 
                          id="suggested-field"
                          defaultValue={getSuggestedReport(resolvingIssue.report, resolvingIssue.issue).oggetto}
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                        />
                      </div>
                    )}

                    {resolvingIssue.issue.field === 'categoria' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nuova Classificazione</label>
                        <select 
                          id="suggested-field"
                          defaultValue={getSuggestedReport(resolvingIssue.report, resolvingIssue.issue).categoria}
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase appearance-none"
                        >
                          {db.configuratore.categorie.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                        </select>
                      </div>
                    )}

                    {(resolvingIssue.issue.field === 'dataOra' || resolvingIssue.issue.field === 'dataNascita_soggetti') && (
                      <div className="space-y-3">
                        <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Nuovo Timestamp Normalizzato:</p>
                          <p className="text-lg font-black text-indigo-600 font-mono">
                            {resolvingIssue.issue.field === 'dataOra' 
                              ? getSuggestedReport(resolvingIssue.report, resolvingIssue.issue).dataOra
                              : "Tutte le date nascita caricate"}
                          </p>
                        </div>
                        <p className="text-[9px] text-slate-400 italic">Il sistema correggerà automaticamente i separatori e forzerà il formato GG/MM/AAAA.</p>
                      </div>
                    )}

                    {resolvingIssue.issue.field === 'soggetti' && (
                      <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-700">Azione suggerita:</p>
                        <p className="text-[10px] text-slate-500 font-medium">Marcatura come fenonemo puro (Solo Evento). Questa azione rimuove l'anomalia di mancanza soggetti.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                    <button 
                      onClick={() => {
                        const r = { ...resolvingIssue.report };
                        const issue = resolvingIssue.issue;
                        const suggested = getSuggestedReport(r, issue);
                        const input = document.getElementById('suggested-field') as (HTMLInputElement | HTMLSelectElement);

                        let finalReport = { ...suggested };
                        
                        // Overwrite with manual edits if any input exists
                        if (input) {
                          if (issue.field === 'comune') finalReport.comune = input.value.toUpperCase();
                          if (issue.field === 'oggetto') finalReport.oggetto = input.value.toUpperCase();
                          if (issue.field === 'categoria') finalReport.categoria = input.value;
                        }

                        saveResolution(finalReport);
                      }}
                      className="w-full bg-slate-900 text-white p-5 rounded-3xl font-black text-sm hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-xl shadow-slate-900/20"
                    >
                      <CheckCircle2 size={20} />
                      APPLICA E SALVA CORREZIONE
                    </button>
                    <p className="text-center text-[9px] font-black text-slate-400 uppercase mt-4 tracking-widest ">Autorizzazione Sanità Dati</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-center shrink-0">
                <button 
                  onClick={() => setResolvingIssue(null)}
                  className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                >
                  Abbandona Correzione
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerificaDB;
