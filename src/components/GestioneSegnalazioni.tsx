import React, { useState } from 'react';
import { Segnalazione, AppDatabase, ModusOperandiStore } from '../types';
import { 
  Search, 
  Edit3, 
  Save, 
  X, 
  MapPin, 
  Clock, 
  FileText,
  AlertCircle,
  Eye,
  Trash2,
  Check,
  User as UserIcon,
  ChevronRight,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GestioneSegnalazioniProps {
  reports: Segnalazione[];
  onUpdateReport: (report: Segnalazione) => void;
  onDeleteReport: (id: string) => void;
  onViewReport: (report: Segnalazione) => void;
  onViewPersona: (persona: any) => void;
  config: ModusOperandiStore;
  setConfig: (config: ModusOperandiStore) => void;
}

const GestioneSegnalazioni: React.FC<GestioneSegnalazioniProps> = ({ 
  reports, 
  onUpdateReport, 
  onDeleteReport, 
  onViewReport, 
  onViewPersona,
  config,
  setConfig
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Segnalazione | null>(null);

  const startEdit = (report: Segnalazione) => {
    setEditingId(report.idUnivoco);
    setEditForm({ ...report });
  };

  const validateAndSave = () => {
    if (!editForm) return;

    const cat = editForm.categoria.toUpperCase();
    const mo = editForm.modus_operandi_dettaglio.toUpperCase();
    const tipo = editForm.tipo_modus_operandi.toUpperCase();

    const allExistingCats = config.categorie.map(c => c.nome.toUpperCase());
    const allExistingMOs = config.categorie.flatMap(c => c.modusOperandi.map(m => m.nome.toUpperCase()));
    const allExistingTypes = config.categorie.flatMap(c => c.modusOperandi.flatMap(m => m.tipi.map(t => t.nome.toUpperCase())));

    const newEntries: { type: string, value: string, similar: string[] }[] = [];
    if (cat && !allExistingCats.includes(cat)) {
      const similar = allExistingCats.filter(c => c.includes(cat) || cat.includes(c));
      newEntries.push({ type: 'CATEGORIA', value: cat, similar });
    }
    if (mo && !allExistingMOs.includes(mo)) {
      const similar = allExistingMOs.filter(m => m.includes(mo) || mo.includes(m));
      newEntries.push({ type: 'MODUS OPERANDI', value: mo, similar });
    }
    if (tipo && !allExistingTypes.includes(tipo)) {
      const similar = allExistingTypes.filter(t => t.includes(tipo) || tipo.includes(t));
      newEntries.push({ type: 'TIPOLOGIA OPERATIVA', value: tipo, similar });
    }

    if (newEntries.length > 0) {
      let msg = "Attenzione! Sono stati inseriti nuovi valori per la tassonomia:\n\n";
      newEntries.forEach(v => {
        msg += `- ${v.type}: "${v.value}"\n`;
        if (v.similar.length > 0) msg += `  (Valori simili presenti: ${v.similar.join(', ')})\n`;
      });
      msg += "\nVuoi salvare questi nuovi valori nel configuratore?";
      if (!confirm(msg)) return;
    }

    // Actual update of taxonomy
    const newConfig = { ...config };
    let catObj = newConfig.categorie.find(c => c.nome === cat);
    if (!catObj) {
      catObj = { id: crypto.randomUUID(), nome: cat, modusOperandi: [] };
      newConfig.categorie.push(catObj);
    }
    let moObj = catObj.modusOperandi.find(m => m.nome === mo);
    if (!moObj) {
      moObj = { id: crypto.randomUUID(), nome: mo, tipi: [] };
      catObj.modusOperandi.push(moObj);
    }
    if (!moObj.tipi.some(t => t.nome === tipo)) {
      moObj.tipi.push({ id: crypto.randomUUID(), nome: tipo });
    }

    setConfig(newConfig);
    onUpdateReport(editForm);
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id: string, protocollo: string) => {
    if (confirm(`Sei sicuro di voler eliminare definitivamente la segnalazione ${protocollo}? L'operazione non è reversibile.`)) {
      onDeleteReport(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Key className="text-indigo-600" />
            Gestione Segnalazioni
          </h2>
          <p className="text-sm text-slate-500">Amministrazione totale dell'archivio e rettifica classificazioni.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-slate-300 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Nessuna segnalazione trovata</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2">
              Non ci sono segnalazioni che corrispondono ai filtri selezionati.
            </p>
          </div>
        ) : (
          reports.map(report => (
            <motion.div 
              layout
              key={report.idUnivoco}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              {editingId === report.idUnivoco ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Edit3 size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Rettifica Categorizzazione</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{report.protocollo}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Annulla</button>
                       <button onClick={validateAndSave} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-100">
                         <Save size={14} /> Salva Modifiche
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Categoria</label>
                      <input 
                        list="cat-gest"
                        value={editForm?.categoria}
                        onChange={e => setEditForm(prev => prev ? {...prev, categoria: e.target.value.toUpperCase()} : null)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <datalist id="cat-gest">
                        {config.categorie.map(c => <option key={c.id} value={c.nome} />)}
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Modus Operandi</label>
                      <input 
                        list="mo-gest"
                        value={editForm?.modus_operandi_dettaglio}
                        onChange={e => setEditForm(prev => prev ? {...prev, modus_operandi_dettaglio: e.target.value.toUpperCase()} : null)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <datalist id="mo-gest">
                        {config.categorie.find(c => c.nome === editForm?.categoria)?.modusOperandi.map(mo => (
                          <option key={mo.id} value={mo.nome} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipologia Operativa</label>
                      <input 
                        list="tipo-gest"
                        value={editForm?.tipo_modus_operandi}
                        onChange={e => setEditForm(prev => prev ? {...prev, tipo_modus_operandi: e.target.value.toUpperCase()} : null)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <datalist id="tipo-gest">
                        {config.categorie.find(c => c.nome === editForm?.categoria)?.modusOperandi.find(mo => mo.nome === editForm?.modus_operandi_dettaglio)?.tipi.map(t => (
                          <option key={t.id} value={t.nome} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                        {report.categoria}
                      </span>
                      <ChevronRight size={12} className="text-slate-300" />
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                        {report.modus_operandi_dettaglio}
                      </span>
                      <ChevronRight size={12} className="text-slate-300" />
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                        {report.tipo_modus_operandi}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-400 font-mono">
                        PROT: {report.protocollo || 'N/D'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{report.oggetto}</h3>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} className="text-indigo-400" />
                        <span className="text-xs font-medium uppercase">{report.dataOra}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin size={14} className="text-indigo-400" />
                        <span className="text-xs font-medium uppercase">{report.comune} ({report.provincia})</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-3">
                         <div className="flex items-center gap-2 overflow-hidden flex-wrap max-w-sm">
                            {[...report.indagati.map(p => ({...p, isIndagato: true})), ...report.vittime.map(p => ({...p, isIndagato: false}))].slice(0, 3).map((p, idx) => (
                              <div 
                                key={idx}
                                onClick={() => onViewPersona(p)}
                                className={`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer uppercase ${
                                  p.isIndagato ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                                }`}
                              >
                                <span className="truncate max-w-[120px]">{p.cognome} {p.nome}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mt-4 italic bg-slate-50/50 px-3 py-2 rounded border-l-2 border-slate-100 whitespace-pre-wrap leading-relaxed">
                      {report.sunto}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col justify-end gap-2 md:w-36">
                    <button 
                      onClick={() => onViewReport(report)}
                      className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Eye size={14} /> Dettagli
                    </button>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => startEdit(report)}
                        className="flex-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white p-2 rounded-xl transition-all flex items-center justify-center"
                        title="Modifica MO"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(report.idUnivoco, report.protocollo)}
                        className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white p-2 rounded-xl transition-all flex items-center justify-center"
                        title="Elimina"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default GestioneSegnalazioni;
