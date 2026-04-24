import React, { useState } from 'react';
import { Segnalazione, AppDatabase } from '../types';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Trash2, 
  User, 
  Calendar, 
  MapPin,
  Clock,
  ExternalLink,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RevisionViewProps {
  reports: Segnalazione[];
  db: AppDatabase;
  setDb: React.Dispatch<React.SetStateAction<AppDatabase | null>>;
  onUpdateTaxonomy?: (newData: Partial<import('../types').ModusOperandiStore>) => void;
}

const RevisionView: React.FC<RevisionViewProps> = ({ reports, db, setDb, onUpdateTaxonomy }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Segnalazione | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const filteredReports = reports.filter(r => {
    if (!r.requiresRevision) return false;
    
    const matchesSearch = searchQuery === '' || 
      r.oggetto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.modus_operandi_dettaglio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tipo_modus_operandi.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCat = catFilter === '' || r.categoria === catFilter;
    
    return matchesSearch && matchesCat;
  });

  const startEdit = (report: Segnalazione) => {
    setEditingId(report.idUnivoco);
    setEditForm({ ...report });
  };

  const saveEdit = () => {
    if (!editForm) return;
    
    const preparedForm = {
      ...editForm,
      categoria: editForm.categoria.toUpperCase(),
      modus_operandi_dettaglio: editForm.modus_operandi_dettaglio.toUpperCase(),
      tipo_modus_operandi: editForm.tipo_modus_operandi.toUpperCase()
    };

    // Check for new taxonomy values
    const cat = preparedForm.categoria;
    const mo = preparedForm.modus_operandi_dettaglio;
    const tipo = preparedForm.tipo_modus_operandi;

    const allExistingCats = db.configuratore.categorie.map(c => c.nome.toUpperCase());
    const allExistingMOs = db.configuratore.categorie.flatMap(c => c.modusOperandi.map(m => m.nome.toUpperCase()));
    const allExistingTypes = db.configuratore.categorie.flatMap(c => c.modusOperandi.flatMap(m => m.tipi.map(t => t.nome.toUpperCase())));

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
    const newTaxonomy: import('../types').ModusOperandiStore = { categorie: [] };
    if (cat && !allExistingCats.includes(cat)) {
      const newCat = { 
        id: crypto.randomUUID(), 
        nome: cat, 
        modusOperandi: [{
          id: crypto.randomUUID(),
          nome: mo || 'DEFAULT',
          tipi: [{ id: crypto.randomUUID(), nome: tipo || 'DEFAULT' }]
        }] 
      };
      newTaxonomy.categorie.push(newCat);
    }

    if (newTaxonomy.categorie.length > 0 && onUpdateTaxonomy) {
      onUpdateTaxonomy(newTaxonomy);
    }

    setDb(prev => prev ? ({
      ...prev,
      segnalazioni: prev.segnalazioni.map(r => 
        r.idUnivoco === preparedForm.idUnivoco ? { ...preparedForm, requiresRevision: false } : r
      )
    }) : null);
    setEditingId(null);
    setEditForm(null);
  };

  const markFixed = (id: string) => {
    setDb(prev => ({
      ...prev,
      segnalazioni: prev.segnalazioni.map(r => 
        r.idUnivoco === id ? { ...r, requiresRevision: false } : r
      )
    }));
  };

  const deleteReport = (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa segnalazione?")) return;
    setDb(prev => ({
      ...prev,
      segnalazioni: prev.segnalazioni.filter(r => r.idUnivoco !== id)
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Database className="text-amber-500" />
            Riclassifica Segnalazioni
          </h2>
          <p className="text-sm text-slate-500">Ricerca e modifica manuale delle classificazioni (Categoria, MO, Tipo).</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="Cerca per oggetto o MO..."
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold w-64"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select 
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold uppercase"
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
          >
            <option value="">Tutte le Categorie</option>
            {db.configuratore.categorie.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Database className="text-slate-300 w-10 h-10" />
           </div>
           <h3 className="text-xl font-bold text-slate-800">Nessuna Segnalazione Trovata</h3>
           <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
             Modifica i filtri di ricerca per visualizzare le segnalazioni da riclassificare.
           </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <div 
              key={report.idUnivoco} 
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
            >
              {editingId === report.idUnivoco ? (
                // EDIT MODE
                <div className="p-8 space-y-6">
                   <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                      <h4 className="font-black text-slate-800 flex items-center gap-2">
                        <Edit2 size={16} className="text-indigo-500" /> MODALITÀ REVISIONE MANUALE
                      </h4>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingId(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                          <X size={18} />
                        </button>
                        <button onClick={saveEdit} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700">
                          <Check size={16} /> Salva e Valida
                        </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Oggetto</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                            value={editForm?.oggetto}
                            onChange={e => setEditForm(prev => prev ? {...prev, oggetto: e.target.value} : null)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Sunto Intelligence</label>
                          <textarea 
                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                            value={editForm?.sunto}
                            onChange={e => setEditForm(prev => prev ? {...prev, sunto: e.target.value} : null)}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Categoria</label>
                              <input 
                                list="cat-list-rev"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold uppercase"
                                value={editForm?.categoria}
                                onChange={e => {
                                  const val = e.target.value.toUpperCase();
                                  setEditForm(prev => prev ? {
                                    ...prev, 
                                    categoria: val,
                                    modus_operandi_dettaglio: '',
                                    tipo_modus_operandi: ''
                                  } : null);
                                }}
                              />
                              <datalist id="cat-list-rev">
                                {db.configuratore.categorie.map(c => <option key={c.id} value={c.nome} />)}
                              </datalist>
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Protocollo</label>
                              <input 
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
                                value={editForm?.protocollo}
                                onChange={e => setEditForm(prev => prev ? {...prev, protocollo: e.target.value} : null)}
                              />
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Modus Operandi</label>
                           <input 
                              list="mo-list-rev"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold uppercase"
                              value={editForm?.modus_operandi_dettaglio}
                              onChange={e => {
                                const val = e.target.value.toUpperCase();
                                setEditForm(prev => prev ? {
                                  ...prev, 
                                  modus_operandi_dettaglio: val,
                                  tipo_modus_operandi: ''
                                } : null);
                              }}
                           />
                           <datalist id="mo-list-rev">
                             {db.configuratore.categorie.find(c => c.nome.toUpperCase() === editForm?.categoria.toUpperCase())?.modusOperandi.map(mo => (
                               <option key={mo.id} value={mo.nome} />
                             ))}
                           </datalist>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tipologia Operativa</label>
                           <input 
                              list="type-list-rev"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-indigo-600 uppercase"
                              value={editForm?.tipo_modus_operandi}
                              onChange={e => setEditForm(prev => prev ? {...prev, tipo_modus_operandi: e.target.value.toUpperCase()} : null)}
                           />
                           <datalist id="type-list-rev">
                             {db.configuratore.categorie.find(c => c.nome.toUpperCase() === editForm?.categoria.toUpperCase())?.modusOperandi.find(mo => mo.nome.toUpperCase() === editForm?.modus_operandi_dettaglio.toUpperCase())?.tipi.map(t => (
                               <option key={t.id} value={t.nome} />
                             ))}
                           </datalist>
                        </div>
                      </div>
                   </div>
                </div>
              ) : (
                // LIST MODE
                <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100">
                    <AlertTriangle className="text-amber-500 w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-widest">
                        Check Richiesto
                      </span>
                      <span className="text-xs text-slate-400 font-mono tracking-tighter">ID: {report.idUnivoco}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-800 truncate mb-2">{report.oggetto}</h3>
                    
                    <div className="flex flex-wrap gap-4 items-center">
                       <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{report.comune}</span>
                       </div>
                       <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Clock size={12} className="text-slate-400" />
                          <span>{formatDate(report.dataOra)}</span>
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => startEdit(report)}
                      className="p-3 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                       onClick={() => markFixed(report.idUnivoco)}
                       className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"
                       title="Valida così com'è"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button 
                      onClick={() => deleteReport(report.idUnivoco)}
                      className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RevisionView;
