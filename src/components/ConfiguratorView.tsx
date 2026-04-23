import React, { useState } from 'react';
import { ModusOperandiStore, CategoriaConfig, ModusOperandi, MOType } from '../types';
import { Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';

interface ConfiguratorViewProps {
  config: ModusOperandiStore;
  setConfig: (config: ModusOperandiStore) => void;
  comandoName: string;
  setComandoName: (name: string) => void;
  canEdit?: boolean;
  onCascadeRename?: (type: 'CATEGORIA' | 'MODUS_OPERANDI' | 'TIPO_MO', oldValue: string, newValue: string) => void;
}

const ConfiguratorView: React.FC<ConfiguratorViewProps> = ({ config, setConfig, comandoName, setComandoName, canEdit = true, onCascadeRename }) => {
  const [editingType, setEditingType] = useState<{catId: string, moId: string, typeId: string} | null>(null);
  const [editingMO, setEditingMO] = useState<{catId: string, moId: string} | null>(null);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newCatName, setNewCatName] = useState('');
  
  const [addingMOForCat, setAddingMOForCat] = useState<string | null>(null);
  const [addingTypeForMO, setAddingTypeForMO] = useState<{catId: string, moId: string} | null>(null);
  const [newValue, setNewValue] = useState('');

  const confirmEditCat = (id: string, oldName: string) => {
    const finalVal = editValue.trim().toUpperCase();
    if (!finalVal) {
      setEditingCat(null);
      return;
    }
    setConfig({
      ...config,
      categorie: config.categorie.map(c => c.id === id ? { ...c, nome: finalVal } : c)
    });
    if (onCascadeRename && oldName !== finalVal) onCascadeRename('CATEGORIA', oldName, finalVal);
    setEditingCat(null);
  };

  const confirmEditMO = (catId: string, moId: string, oldName: string) => {
    const finalVal = editValue.trim().toUpperCase();
    if (!finalVal) {
      setEditingMO(null);
      return;
    }
    setConfig({
      ...config,
      categorie: config.categorie.map(c => c.id === catId ? {
        ...c,
        modusOperandi: c.modusOperandi.map(mo => mo.id === moId ? { ...mo, nome: finalVal } : mo)
      } : c)
    });
    if (onCascadeRename && oldName !== finalVal) onCascadeRename('MODUS_OPERANDI', oldName, finalVal);
    setEditingMO(null);
  };

  const confirmEditType = (catId: string, moId: string, typeId: string, oldName: string) => {
    const finalVal = editValue.trim().toUpperCase();
    if (!finalVal) {
      setEditingType(null);
      return;
    }
    setConfig({
      ...config,
      categorie: config.categorie.map(c => c.id === catId ? {
        ...c,
        modusOperandi: c.modusOperandi.map(mo => mo.id === moId ? {
          ...mo,
          tipi: mo.tipi.map(t => t.id === typeId ? { ...t, nome: finalVal } : t)
        } : mo)
      } : c)
    });
    if (onCascadeRename && oldName !== finalVal) onCascadeRename('TIPO_MO', oldName, finalVal);
    setEditingType(null);
  };

  const addCategory = () => {
    if (!canEdit) return;
    if (!newCatName.trim()) return;
    const newCat: CategoriaConfig = {
      id: Date.now().toString(),
      nome: newCatName.trim().toUpperCase(),
      modusOperandi: []
    };
    setConfig({ ...config, categorie: [...config.categorie, newCat] });
    setNewCatName('');
  };

  const removeCategory = (id: string) => {
    setConfig({ ...config, categorie: config.categorie.filter(c => c.id !== id) });
  };

  const confirmAddMO = (catId: string) => {
    const moName = newValue.trim().toUpperCase();
    if (!moName) {
      setAddingMOForCat(null);
      return;
    }
    const newMO: ModusOperandi = {
      id: Date.now().toString(),
      nome: moName,
      tipi: []
    };
    setConfig({
      ...config,
      categorie: config.categorie.map(c => 
        c.id === catId ? { ...c, modusOperandi: [...c.modusOperandi, newMO] } : c
      )
    });
    setAddingMOForCat(null);
    setNewValue('');
  };

  const confirmAddType = (catId: string, moId: string) => {
    const typeName = newValue.trim().toUpperCase();
    if (!typeName) {
      setAddingTypeForMO(null);
      return;
    }
    const newType: MOType = {
      id: Date.now().toString(),
      nome: typeName
    };
    setConfig({
      ...config,
      categorie: config.categorie.map(c => 
        c.id === catId ? {
          ...c,
          modusOperandi: c.modusOperandi.map(mo => 
            mo.id === moId ? { ...mo, tipi: [...mo.tipi, newType] } : mo
          )
        } : c
      )
    });
    setAddingTypeForMO(null);
    setNewValue('');
  };

  const removeType = (catId: string, moId: string, typeId: string) => {
    setConfig({
      ...config,
      categorie: config.categorie.map(c => 
        c.id === catId ? {
          ...c,
          modusOperandi: c.modusOperandi.map(mo => 
            mo.id === moId ? { ...mo, tipi: mo.tipi.filter(t => t.id !== typeId) } : mo
          )
        } : c
      )
    });
  };

  const removeMO = (catId: string, moId: string) => {
    setConfig({
      ...config,
      categorie: config.categorie.map(c => 
        c.id === catId ? { ...c, modusOperandi: c.modusOperandi.filter(mo => mo.id !== moId) } : c
      )
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Definizione Tassonomia MO</h2>
          <p className="text-slate-500">Configura le gerarchie categoriali per la normalizzazione AI.</p>
        </div>
        <div className="flex items-center space-x-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-sm font-medium">L'AI userà solo questi valori per la classificazione.</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
          <ShieldAlert className="text-indigo-600 w-5 h-5" /> Impostazioni Istituzionali
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome del Comando / Unità</label>
            <input 
              type="text" 
              placeholder="es. COMANDO PROVINCIALE CARABINIERI..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              value={comandoName}
              onChange={(e) => setComandoName(e.target.value.toUpperCase())}
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex space-x-3 mb-8">
          <input 
            type="text" 
            placeholder="Nuova Categoria (es. REATO)"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <button 
            onClick={addCategory}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Categoria</span>
          </button>
        </div>

        <div className="space-y-6">
          {config.categorie.map(cat => (
            <div key={cat.id} className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                {editingCat === cat.id ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={editValue} 
                      onChange={e => setEditValue(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-sm font-bold uppercase"
                      autoFocus
                    />
                    <button onClick={() => confirmEditCat(cat.id, cat.nome)} className="text-green-600 p-1 hover:bg-green-50 rounded"><Check size={16} /></button>
                    <button onClick={() => setEditingCat(null)} className="text-slate-400 p-1 hover:bg-slate-50 rounded"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 tracking-wide text-sm">{cat.nome}</span>
                    <button onClick={() => { setEditingCat(cat.id); setEditValue(cat.nome); }} className="text-slate-400 hover:text-indigo-600 transition-colors">
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <button onClick={() => { setAddingMOForCat(cat.id); setNewValue(''); }} className="text-indigo-600 hover:bg-white px-3 py-1 rounded text-xs font-semibold border border-indigo-200">
                    + MO
                  </button>
                  <button onClick={() => removeCategory(cat.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {addingMOForCat === cat.id && (
                  <div className="bg-slate-50/50 rounded-lg p-4 border border-dashed border-indigo-300">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-tight">Nuovo Modus Operandi</p>
                    <input 
                      type="text" 
                      placeholder="Nome MO..." 
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold uppercase mb-2"
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                       <button onClick={() => confirmAddMO(cat.id)} className="flex-1 bg-indigo-600 text-white py-1 rounded text-xs font-bold">Salva</button>
                       <button onClick={() => setAddingMOForCat(null)} className="flex-1 bg-slate-200 text-slate-600 py-1 rounded text-xs font-bold">Annulla</button>
                    </div>
                  </div>
                )}
                {cat.modusOperandi.map(mo => (
                  <div key={mo.id} className="bg-slate-50/50 rounded-lg p-4 border border-slate-200 relative group">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                      {editingMO?.moId === mo.id ? (
                        <div className="flex items-center gap-1">
                          <input 
                            type="text" 
                            value={editValue} 
                            onChange={e => setEditValue(e.target.value)}
                            className="bg-white border border-slate-300 rounded px-1 py-0.5 text-[10px] font-bold w-24"
                          />
                          <button onClick={() => confirmEditMO(cat.id, mo.id, mo.nome)} className="text-green-600"><Check size={14} /></button>
                          <button onClick={() => setEditingMO(null)} className="text-slate-400"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-xs">{mo.nome}</span>
                          <button onClick={() => { setEditingMO({catId: cat.id, moId: mo.id}); setEditValue(mo.nome); }} className="text-slate-400 hover:text-indigo-600">
                            <Edit2 size={10} />
                          </button>
                        </div>
                      )}
                      <button onClick={() => removeMO(cat.id, mo.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {mo.tipi.map(t => (
                        <div key={t.id} className="flex items-center justify-between bg-white px-2 py-2 rounded border border-slate-100 text-xs">
                          {editingType?.typeId === t.id ? (
                            <div className="flex items-center gap-2 w-full">
                              <input 
                                type="text" 
                                value={editValue} 
                                onChange={e => setEditValue(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs w-full font-bold uppercase"
                              />
                              <button onClick={() => confirmEditType(cat.id, mo.id, t.id, t.nome)} className="text-green-600"><Check size={14} /></button>
                              <button onClick={() => setEditingType(null)} className="text-slate-400"><X size={14} /></button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-700 font-medium uppercase">{t.nome}</span>
                                <button onClick={() => { setEditingType({catId: cat.id, moId: mo.id, typeId: t.id}); setEditValue(t.nome); }} className="text-slate-400 hover:text-indigo-500">
                                  <Edit2 size={12} />
                                </button>
                              </div>
                              <button onClick={() => removeType(cat.id, mo.id, t.id)} className="text-slate-300 hover:text-red-400">
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {addingTypeForMO?.moId === mo.id ? (
                      <div className="mt-2 bg-slate-100 p-2 rounded">
                        <input 
                          type="text" 
                          placeholder="Nuova Tipologia..." 
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold uppercase mb-2"
                          value={newValue}
                          onChange={e => setNewValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button onClick={() => confirmAddType(cat.id, mo.id)} className="flex-1 bg-indigo-600 text-white rounded text-[10px] font-bold py-1">Salva</button>
                          <button onClick={() => setAddingTypeForMO(null)} className="flex-1 bg-slate-200 text-slate-600 rounded text-[10px] font-bold py-1">Annulla</button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setAddingTypeForMO({catId: cat.id, moId: mo.id}); setNewValue(''); }}
                        className="w-full py-1.5 text-xs text-slate-400 hover:text-indigo-600 hover:bg-white border border-dashed border-slate-300 rounded transition-all uppercase font-bold mt-2"
                      >
                        + Tipologia Operativa
                      </button>
                    )}
                  </div>
                ))}

                {cat.modusOperandi.length === 0 && (
                  <div className="col-span-full py-4 text-center text-slate-400 text-xs italic">
                    Nessun Modus Operandi definito per questa categoria.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfiguratorView;
