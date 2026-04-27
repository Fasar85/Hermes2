import React, { useState } from 'react';
import { Segnalazione, AppDatabase, ModusOperandiStore } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  Loader2,
  Key
} from 'lucide-react';

const MapController = ({ center }: { center?: { lat: number, lng: number } }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
};
import { motion, AnimatePresence } from 'motion/react';

interface GestioneSegnalazioniProps {
  reports: Segnalazione[];
  onUpdateReport: (report: Segnalazione) => void;
  onDeleteReport: (id: string) => void;
  onViewReport: (report: Segnalazione) => void;
  onViewPersona: (persona: any) => void;
  config: ModusOperandiStore;
  setConfig: (config: ModusOperandiStore) => void;
  initialSearchId?: string | null;
  onClearInitialSearch?: () => void;
}

const GestioneSegnalazioni: React.FC<GestioneSegnalazioniProps> = ({ 
  reports, 
  onUpdateReport, 
  onDeleteReport, 
  onViewReport, 
  onViewPersona,
  config,
  setConfig,
  initialSearchId,
  onClearInitialSearch
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Segnalazione | null>(null);
  const [mapSearch, setMapSearch] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  const handleMapSearch = async () => {
    if (!mapSearch.trim()) return;
    setIsSearchingMap(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapSearch + ', Italy')}&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setEditForm(prev => prev ? { ...prev, coordinate: { lat, lng }, comune: mapSearch.toUpperCase() } : null);
      } else {
        alert("Comune non trovato sulla mappa.");
      }
    } catch (e) {
      console.error(e);
      alert("Errore durante la ricerca cartografica.");
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleBirthDateChange = (val: string, idx: number, isIndagato: boolean) => {
    // Remove non-numeric
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);
    
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 2);
      if (cleaned.length > 2) {
        formatted += '/' + cleaned.substring(2, 4);
        if (cleaned.length > 4) {
          formatted += '/' + cleaned.substring(4, 8);
        }
      }
    }

    setEditForm(prev => {
      if (!prev) return null;
      const key = isIndagato ? 'indagati' : 'vittime';
      const next = [...prev[key]];
      next[idx] = { ...next[idx], dataNascita: formatted };
      return { ...prev, [key]: next };
    });
  };

  const formatItalianDate = (dateStr: string) => {
    if (!dateStr) return '';
    // If it's already in DD/MM/YYYY HH:MM format, return as is
    if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(dateStr)) return dateStr;
    
    // If it's ISO format yyyy-mm-ddThh:mm:ss
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  };

  const startEdit = (report: Segnalazione) => {
    setEditingId(report.idUnivoco);
    setEditForm({ 
      ...report,
      dataOra: formatItalianDate(report.dataOra)
    });
  };

  // Draggable Marker Component for Edit Mode
  const DraggableMarker = ({ position, onPositionChange }: { position: { lat: number, lng: number }, onPositionChange: (pos: { lat: number, lng: number }) => void }) => {
    const markerRef = React.useRef<L.Marker>(null);
    const eventHandlers = React.useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const newPos = marker.getLatLng();
            onPositionChange({ lat: newPos.lat, lng: newPos.lng });
          }
        },
      }),
      [onPositionChange],
    );

    return (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={[position.lat, position.lng]}
        ref={markerRef}>
        <Popup minWidth={90}>
          <span>Trascina o clicca sulla mappa per spostare</span>
        </Popup>
      </Marker>
    );
  };

  const MapEvents = ({ onMapClick }: { onMapClick: (pos: { lat: number, lng: number }) => void }) => {
    useMapEvents({
      click(e) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });
    return null;
  };

  // Effect to handle initial search and direct edit from other tabs
  React.useEffect(() => {
    if (initialSearchId) {
      const report = reports.find(r => r.idUnivoco === initialSearchId);
      if (report) {
        startEdit(report);
        if (onClearInitialSearch) onClearInitialSearch();
      }
    }
  }, [initialSearchId, reports, onClearInitialSearch]);

  const sortedReports = React.useMemo(() => {
    return [...reports].sort((a, b) => {
      const parse = (dStr: string) => {
        if (!dStr) return 0;
        if (dStr.includes('T')) {
          const d = new Date(dStr);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        }
        const parts = dStr.split('/');
        if (parts.length < 3) return 0;
        const d = parts[0];
        const m = parts[1];
        const rest = parts[2].split(' ');
        const y = rest[0];
        const hM = rest[1] || '00:00';
        const [h, min] = hM.split(':');
        const date = new Date(Number(y), Number(m)-1, Number(d), Number(h) || 0, Number(min) || 0);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      };
      return parse(b.dataOra) - parse(a.dataOra);
    });
  }, [reports]);

  const validateAndSave = () => {
    if (!editForm) return;

    // Validation for Subjects
    const hasInvalidSubject = [...editForm.indagati, ...editForm.vittime].some(p => !p.cognome || !p.nome);
    if (hasInvalidSubject) {
      alert("ERRORE: Tutti i soggetti devono avere almeno Cognome e Nome compilati.");
      return;
    }

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
        {sortedReports.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-slate-300 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Nessuna segnalazione trovata</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2">
              Non ci sono segnalazioni che corrispondono ai termini di ricerca o ai filtri selezionati.
            </p>
          </div>
        ) : (
          sortedReports.map(report => (
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
                       <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Annulla</button>
                       <button onClick={validateAndSave} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                         <Save size={14} /> Salva Segnalazione
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Basic Data */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Protocollo</label>
                      <input 
                        value={editForm?.protocollo}
                        onChange={e => setEditForm(prev => prev ? {...prev, protocollo: e.target.value.toUpperCase()} : null)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Oggetto</label>
                      <input 
                        value={editForm?.oggetto}
                        onChange={e => setEditForm(prev => prev ? {...prev, oggetto: e.target.value.toUpperCase()} : null)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Comando</label>
                      <input 
                        value={editForm?.comando}
                        onChange={e => setEditForm(prev => prev ? {...prev, comando: e.target.value.toUpperCase()} : null)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Data Evento (GG/MM/AAAA)</label>
                       <input 
                         value={(editForm?.dataOra || '').split(' ')[0]}
                         onChange={e => {
                           const val = e.target.value;
                           const parts = (editForm?.dataOra || '').split(' ');
                           const time = parts[1] || '00:00';
                           setEditForm(prev => prev ? {...prev, dataOra: `${val} ${time}`} : null);
                         }}
                         placeholder="DD/MM/YYYY"
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Orario Evento (HH:MM)</label>
                       <input 
                         value={(editForm?.dataOra || '').split(' ')[1] || '00:00'}
                         onChange={e => {
                           const val = e.target.value;
                           const parts = (editForm?.dataOra || '').split(' ');
                           const date = parts[0] || '01/01/2000';
                           setEditForm(prev => prev ? {...prev, dataOra: `${date} ${val}`} : null);
                         }}
                         placeholder="HH:MM"
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Comune</label>
                      <input 
                        value={editForm?.comune}
                        onChange={e => setEditForm(prev => prev ? {...prev, comune: e.target.value.toUpperCase()} : null)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Provincia (Sigla)</label>
                      <input 
                        value={editForm?.provincia}
                        maxLength={2}
                        onChange={e => setEditForm(prev => prev ? {...prev, provincia: e.target.value.toUpperCase()} : null)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                      />
                    </div>

                    {/* Taxonomy */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Categoria</label>
                      <input 
                        list="cat-gest"
                        value={editForm?.categoria}
                        onChange={e => setEditForm(prev => prev ? {...prev, categoria: e.target.value.toUpperCase()} : null)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-white/0 border-indigo-200/50 outline-none bg-indigo-50/20"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-white/0 border-indigo-200/50 outline-none bg-indigo-50/20"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-white/0 border-indigo-200/50 outline-none bg-indigo-50/20"
                      />
                      <datalist id="tipo-gest">
                        {config.categorie.find(c => c.nome === editForm?.categoria)?.modusOperandi.find(mo => mo.nome === editForm?.modus_operandi_dettaglio)?.tipi.map(t => (
                          <option key={t.id} value={t.nome} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dinamica Integrale</label>
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm italic text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {editForm?.testoIntegrale || editForm?.dinamica}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sunto AI</label>
                    <textarea 
                      value={editForm?.sunto}
                      onChange={e => setEditForm(prev => prev ? {...prev, sunto: e.target.value} : null)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                    />
                  </div>

                  {/* Georeferencing Map in Edit Mode */}
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-3">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cerca Comune sulla Mappa</label>
                        <div className="relative">
                          <input 
                            placeholder="Es: ROMA, MILANO, FORMIA..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                            value={mapSearch}
                            onChange={e => setMapSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleMapSearch()}
                          />
                          <button 
                            type="button"
                            onClick={handleMapSearch}
                            disabled={isSearchingMap}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            {isSearchingMap ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                          </button>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium mb-3 italic">Trascina o CLICCA sulla mappa per la precisione massima.</p>
                    </div>

                    <div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
                      <MapContainer 
                        center={editForm?.coordinate ? [editForm.coordinate.lat, editForm.coordinate.lng] : [41.9, 12.5]} 
                        zoom={13} 
                        scrollWheelZoom={true} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapEvents onMapClick={(pos) => setEditForm(prev => prev ? {...prev, coordinate: pos} : null)} />
                        {editForm?.coordinate && (
                          <DraggableMarker 
                            position={editForm.coordinate} 
                            onPositionChange={(pos) => setEditForm(prev => prev ? {...prev, coordinate: pos} : null)} 
                          />
                        )}
                        {/* Auto center component */}
                        <MapController center={editForm?.coordinate} />
                      </MapContainer>
                    </div>
                    <div className="flex gap-4 px-1">
                       <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">LAT: {editForm?.coordinate?.lat.toFixed(6)}</span>
                       <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">LNG: {editForm?.coordinate?.lng.toFixed(6)}</span>
                    </div>
                  </div>

                  {/* Subjects Management */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest">Indagati ({editForm?.indagati.length})</h4>
                           <button 
                            type="button"
                            onClick={() => setEditForm(prev => prev ? {...prev, indagati: [...prev.indagati, {nome: '', cognome: '', ruolo: 'indagati'}]} : null)}
                            className="p-1 px-3 bg-orange-50 text-orange-600 text-[10px] font-black rounded-lg hover:bg-orange-600 hover:text-white transition-all uppercase"
                           >
                             + Aggiungi Indagato
                           </button>
                        </div>
                        <div className="space-y-3">
                           {editForm?.indagati.map((p, idx) => (
                             <div key={idx} className="bg-orange-50/30 p-4 rounded-2xl border border-orange-100 space-y-3 relative group/p">
                                <button 
                                  type="button"
                                  onClick={() => setEditForm(prev => prev ? {...prev, indagati: prev.indagati.filter((_, i) => i !== idx)} : null)}
                                  className="absolute top-2 right-2 p-1.5 text-orange-300 hover:text-orange-600 opacity-0 group-hover/p:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                   <input 
                                    placeholder="Cognome"
                                    value={p.cognome}
                                    onChange={e => setEditForm(prev => {
                                      if (!prev) return null;
                                      const next = [...prev.indagati];
                                      next[idx] = { ...next[idx], cognome: e.target.value.toUpperCase() };
                                      return {...prev, indagati: next};
                                    })}
                                    className="bg-white border border-orange-100 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:border-orange-400"
                                   />
                                   <input 
                                    placeholder="Nome"
                                    value={p.nome}
                                    onChange={e => setEditForm(prev => {
                                      if (!prev) return null;
                                      const next = [...prev.indagati];
                                      next[idx] = { ...next[idx], nome: e.target.value.toUpperCase() };
                                      return {...prev, indagati: next};
                                    })}
                                    className="bg-white border border-orange-100 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:border-orange-400"
                                   />
                                   <input 
                                    placeholder="Data Nascita (gg/mm/aaaa)"
                                    value={p.dataNascita || ''}
                                    maxLength={10}
                                    onChange={e => handleBirthDateChange(e.target.value, idx, true)}
                                    className="bg-white border border-orange-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:border-orange-400"
                                   />
                                   <input 
                                    placeholder="Luogo Nascita"
                                    value={p.luogoNascita || ''}
                                    onChange={e => setEditForm(prev => {
                                      if (!prev) return null;
                                      const next = [...prev.indagati];
                                      next[idx] = { ...next[idx], luogoNascita: e.target.value.toUpperCase() };
                                      return {...prev, indagati: next};
                                    })}
                                    className="bg-white border border-orange-100 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:border-orange-400"
                                   />
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <h4 className="text-xs font-black text-green-600 uppercase tracking-widest">Vittime ({editForm?.vittime.length})</h4>
                           <button 
                            type="button"
                            onClick={() => setEditForm(prev => prev ? {...prev, vittime: [...prev.vittime, {nome: '', cognome: '', ruolo: 'vittime'}]} : null)}
                            className="p-1 px-3 bg-green-50 text-green-600 text-[10px] font-black rounded-lg hover:bg-green-600 hover:text-white transition-all uppercase"
                           >
                             + Aggiungi Vittima
                           </button>
                        </div>
                        <div className="space-y-3">
                           {editForm?.vittime.map((p, idx) => (
                             <div key={idx} className="bg-green-50/30 p-4 rounded-2xl border border-green-100 space-y-3 relative group/p overflow-hidden">
                                <button 
                                  type="button"
                                  onClick={() => setEditForm(prev => prev ? {...prev, vittime: prev.vittime.filter((_, i) => i !== idx)} : null)}
                                  className="absolute top-2 right-2 p-1.5 text-green-300 hover:text-green-600 opacity-0 group-hover/p:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                   <input 
                                    placeholder="Cognome"
                                    value={p.cognome}
                                    onChange={e => setEditForm(prev => {
                                      if (!prev) return null;
                                      const next = [...prev.vittime];
                                      next[idx] = { ...next[idx], cognome: e.target.value.toUpperCase() };
                                      return {...prev, vittime: next};
                                    })}
                                    className="bg-white border border-green-100 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:border-green-400"
                                   />
                                   <input 
                                    placeholder="Nome"
                                    value={p.nome}
                                    onChange={e => setEditForm(prev => {
                                      if (!prev) return null;
                                      const next = [...prev.vittime];
                                      next[idx] = { ...next[idx], nome: e.target.value.toUpperCase() };
                                      return {...prev, vittime: next};
                                    })}
                                    className="bg-white border border-green-100 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:border-green-400"
                                   />
                                   <input 
                                    placeholder="Data Nascita (gg/mm/aaaa)"
                                    value={p.dataNascita || ''}
                                    maxLength={10}
                                    onChange={e => handleBirthDateChange(e.target.value, idx, false)}
                                    className="bg-white border border-green-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:border-green-400"
                                   />
                                   <input 
                                    placeholder="Luogo Nascita"
                                    value={p.luogoNascita || ''}
                                    onChange={e => setEditForm(prev => {
                                      if (!prev) return null;
                                      const next = [...prev.vittime];
                                      next[idx] = { ...next[idx], luogoNascita: e.target.value.toUpperCase() };
                                      return {...prev, vittime: next};
                                    })}
                                    className="bg-white border border-green-100 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase outline-none focus:border-green-400"
                                   />
                                </div>
                             </div>
                           ))}
                        </div>
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

                    <h3 className="text-lg font-bold text-slate-800 mb-1 truncate uppercase">{report.oggetto}</h3>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} className="text-indigo-400" />
                        <span className="text-xs font-medium uppercase">{formatItalianDate(report.dataOra)}</span>
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
