import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Segnalazione } from '../types';

// Helper to update map view when markers change
const ChangeView: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [coords, map]);
  return null;
};

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
  BarChart2, 
  PieChart as PieIcon, 
  TrendingUp, 
  Target, 
  BrainCircuit, 
  ShieldCheck,
  Zap,
  Info,
  ExternalLink,
  Map as MapIcon,
  MapPin,
  Loader2
} from 'lucide-react';
import { generateInvestigativeIntelligence } from '../lib/geminiService';
import { getDayOfWeek, getTimeSlot } from '../lib/utils';

interface AnalysisProps {
  reports: Segnalazione[];
  apiKey?: string;
  onViewDetails?: (report: Segnalazione) => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analysis: React.FC<AnalysisProps> = ({ reports, apiKey, onViewDetails }) => {
  const [intelText, setIntelText] = useState<string>('');
  const [isGeneratingIntel, setIsGeneratingIntel] = useState(false);
  const [dynamicCoords, setDynamicCoords] = useState<Record<string, [number, number]>>({});

  // Group reports by coordinate (preferring specific ones)
  const mapData = useMemo(() => {
    const groups: Record<string, { reports: Segnalazione[], lat: number, lng: number, city: string }> = {};
    const cityCoords: Record<string, [number, number]> = {
      'ROMA': [41.9028, 12.4964], 'MILANO': [45.4642, 9.1900], 'NAPOLI': [40.8518, 14.2681],
      'TORINO': [45.0703, 7.6869], 'FIRENZE': [43.7696, 11.2558], 'PALERMO': [38.1157, 13.3615],
      'BARI': [41.1171, 16.8719], 'CATANIA': [37.5079, 15.0830], 'BOLOGNA': [44.4949, 11.3426],
      'GENOVA': [44.4056, 8.9463], 'VENEZIA': [45.4408, 12.3155], 'VERONA': [45.4384, 10.9916],
      'MESSINA': [38.1938, 15.5540], 'PADOVA': [45.4064, 11.8768], 'TRIESTE': [45.6495, 13.7768],
      'BRESCIA': [45.5416, 10.2118], 'PARMA': [44.8015, 10.3279], 'PRATO': [43.8777, 11.1022],
      'MODENA': [44.6471, 10.9252], 'REGGIO CALABRIA': [38.1144, 15.6500], 'REGGIO EMILIA': [44.6982, 10.6312],
      'PERUGIA': [43.1107, 12.3908], 'RAVENNA': [44.4184, 12.2035], 'LIVORNO': [43.5485, 10.3106],
      'CAGLIARI': [39.2238, 9.1217], 'FOGGIA': [41.4622, 15.5446], 'RIMINI': [44.0575, 12.5653],
      'SALERNO': [40.6779, 14.7659], 'FERRARA': [44.8381, 11.6198], 'SASSARI': [40.7259, 8.5556],
      'LATINA': [41.4676, 12.9036], 'MONZA': [45.5845, 9.2744], 'SIRACUSA': [37.0755, 15.2866],
      'PESCARA': [42.4618, 14.2142], 'BERGAMO': [45.6983, 9.6773], 'FORLI': [44.2227, 12.0409],
      'VICENZA': [45.5479, 11.5499], 'TRENTO': [46.0679, 11.1211], 'TERRACINA': [41.2847, 13.2446],
      'GAETA': [41.2091, 13.5786], 'FORMIA': [41.2583, 13.6067], 'FROSINONE': [41.6416, 13.3441]
    };
    
    reports.forEach(r => {
      const city = r.comune?.toUpperCase() || 'N/D';
      let lat = 0;
      let lng = 0;

      if (r.coordinate) {
        lat = r.coordinate.lat;
        lng = r.coordinate.lng;
      } else {
        const base = cityCoords[city] || dynamicCoords[city] || [41.9, 12.5];
        lat = base[0];
        lng = base[1];
      }

      // Key for grouping (round to 4 decimals to catch nearly identical spots)
      const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
      
      if (!groups[key]) {
        groups[key] = { reports: [], lat, lng, city };
      }
      groups[key].reports.push(r);
    });
    return Object.values(groups);
  }, [reports, dynamicCoords]);

  // Geocoding Effect with rate limiting
  useEffect(() => {
     let isMounted = true;
     const fetchMissingCoords = async () => {
        const uniqueCitiesMap = new Map<string, string>();
        reports.forEach(r => uniqueCitiesMap.set(r.comune.toUpperCase(), r.provincia || ''));
        const uniqueCities = Array.from(uniqueCitiesMap.keys());
        
        const knownCities = [
          'ROMA', 'MILANO', 'NAPOLI', 'TORINO', 'FIRENZE', 'PALERMO', 'BARI', 'CATANIA', 
          'BOLOGNA', 'GENOVA', 'VENEZIA', 'VERONA', 'MESSINA', 'PADOVA', 'TRIESTE', 
          'BRESCIA', 'PARMA', 'PRATO', 'MODENA', 'REGGIO CALABRIA', 'REGGIO EMILIA', 
          'PERUGIA', 'RAVENNA', 'LIVORNO', 'CAGLIARI', 'FOGGIA', 'RIMINI', 'SALERNO', 
          'FERRARA', 'SASSARI', 'LATINA', 'MONZA', 'SIRACUSA', 'PESCARA', 'BERGAMO', 
          'FORLI', 'VICENZA', 'TRENTO', 'TERRACINA', 'GAETA', 'FORMIA', 'FROSINONE'
        ];

        for (const city of uniqueCities) {
           if (!isMounted) break;
           if (!knownCities.includes(city) && !dynamicCoords[city]) {
              try {
                // Avoid hammering Nominatim, wait 1 second between requests
                await new Promise(r => setTimeout(r, 1000));
                if (!isMounted) break;

                const prov = uniqueCitiesMap.get(city) || '';
                const query = prov ? `${city}, ${prov}, Italy` : `${city}, Italy`;
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`);
                const data = await response.json();
                if (data && data.length > 0) {
                   const lat = parseFloat(data[0].lat);
                   const lon = parseFloat(data[0].lon);
                   setDynamicCoords(prev => ({ ...prev, [city]: [lat, lon] }));
                }
              } catch (e) {
                console.warn("Geocoding failed for:", city, e);
              }
           }
        }
     };

     fetchMissingCoords();
     return () => { isMounted = false; };
  }, [reports]);

  // Data aggregations
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      const cat = r.categoria.toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [reports]);

  const comuniMaggiormenteInteressati = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      const c = r.comune.toUpperCase();
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [reports]);

  const moData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      if (r.modus_operandi_dettaglio) {
        const mo = r.modus_operandi_dettaglio.toUpperCase();
        counts[mo] = (counts[mo] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [reports]);

  const tipoMoData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      if (r.tipo_modus_operandi) {
        const t = r.tipo_modus_operandi.toUpperCase();
        counts[t] = (counts[t] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [reports]);

  const timeData = useMemo(() => {
    // Trend temporale riferito all'anno
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      let year: string = '';
      if (!r.dataOra) return;

      // Try to extract year from DD/MM/YYYY or YYYY-MM-DD
      const datePart = (r.dataOra || '').split(/[ T]/)[0];
      
      if (datePart.includes('/')) {
        const parts = datePart.split('/');
        if (parts.length === 3) {
          // Check if the last part is the year (4 digits)
          if (parts[2].length === 4) year = parts[2];
          else if (parts[0].length === 4) year = parts[0];
        }
      } else if (datePart.includes('-')) {
        const parts = datePart.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            year = parts[0];
          } else {
            year = parts[2];
          }
        }
      }
      
      // Fallback: try native Date
      if (!year || isNaN(Number(year))) {
        try {
          const d = new Date(r.dataOra);
          if (!isNaN(d.getTime())) {
            year = d.getFullYear().toString();
          }
        } catch (e) {}
      }
      
      if (year && !isNaN(Number(year))) {
        counts[year] = (counts[year] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => Number(a.name) - Number(b.name));
  }, [reports]);

  const recurrentIndagatiData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      r.indagati.forEach(p => {
        if (p.cognome && p.nome && p.cognome.trim() !== '' && p.nome.trim() !== '') {
          const fullName = `${p.cognome.toUpperCase().trim()} ${p.nome.toUpperCase().trim()}`;
          if (fullName.length > 3) {
             counts[fullName] = (counts[fullName] || 0) + 1;
          }
        }
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [reports]);

  const recurrentVittimeData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      r.vittime.forEach(p => {
        if (p.cognome && p.nome && p.cognome.trim() !== '' && p.nome.trim() !== '') {
          const fullName = `${p.cognome.toUpperCase().trim()} ${p.nome.toUpperCase().trim()}`;
          if (fullName.length > 3) {
             counts[fullName] = (counts[fullName] || 0) + 1;
          }
        }
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [reports]);

  const generateIntel = async () => {
    if (reports.length === 0) return;
    setIsGeneratingIntel(true);
    try {
      // Prepare stats summary for Gemini
      const summary = `
        Segnalazioni totali: ${reports.length}
        Categorie prevalenti: ${categoryData.map(d => `${d.name} (${d.value})`).join(', ')}
        MO ricorrenti: ${moData.map(d => `${d.name} (${d.value})`).join(', ')}
        Tipi MO ricorrenti: ${tipoMoData.map(d => `${d.name} (${d.value})`).join(', ')}
        Soggetti Totali: ${reports.reduce((acc, r) => acc + r.vittime.length + r.indagati.length, 0)}
      `;
      const result = await generateInvestigativeIntelligence(summary, apiKey);
      setIntelText(result);
    } catch (err) {
      console.error(err);
      setIntelText("Impossibile generare l'analisi di intelligence in questo momento.");
    } finally {
      setIsGeneratingIntel(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart2 className="text-indigo-600" />
            Analisi Fenomenologica
          </h2>
          <p className="text-sm text-slate-500">Decodifica statistica e quantitativa degli eventi di polizia.</p>
        </div>
        <button 
          onClick={generateIntel}
          disabled={isGeneratingIntel || reports.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGeneratingIntel ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
          <span>Intelligence Avanzata</span>
        </button>
      </div>

      {/* Map Section */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors h-[500px]">
        <div className="absolute top-0 right-0 p-8 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors">
            <MapIcon size={160} />
        </div>
        <div className="relative z-10 h-full flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <MapIcon className="text-indigo-500 w-5 h-5" /> Distribuzione Geografica degli Eventi
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">Visualizzazione territoriale dei cluster di segnalazioni.</p>
            
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-100 shadow-inner z-0">
               <MapContainer center={[41.9, 12.5]} zoom={6} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                 <ChangeView coords={mapData.map(d => [d.lat, d.lng])} />
                 <TileLayer
                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                 />
                 {mapData.map((data, idx) => (
                   <Marker key={idx} position={[data.lat, data.lng]}>
                     <Popup>
                       <div className="p-2 max-w-xs">
                          <h4 className="font-bold text-indigo-600 uppercase mb-2 border-b border-slate-100">{data.city} ({data.reports.length})</h4>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                             {data.reports.map((r, rIdx) => (
                               <div key={rIdx} className="text-[10px] bg-slate-50 p-2 rounded border border-slate-100">
                                 <p className="font-black text-slate-800 truncate mb-1">{r.oggetto}</p>
                                 <p className="text-[9px] text-slate-500 mb-2 line-clamp-2 italic">{r.sunto}</p>
                                 <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-200">
                                    <span className="text-slate-400 font-mono text-[8px]">{r.protocollo}</span>
                                    <button 
                                      onClick={() => onViewDetails && onViewDetails(r)}
                                      className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase"
                                    >
                                      dettagli
                                    </button>
                                 </div>
                               </div>
                             ))}
                          </div>
                       </div>
                     </Popup>
                   </Marker>
                 ))}
               </MapContainer>
            </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Charts: Categories and Trends */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
          <div className="absolute top-0 right-0 p-8 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors">
            <PieIcon size={160} />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <Zap className="text-amber-500 w-5 h-5" /> Distribuzione Fenomenologica
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">Suddivisione degli eventi per categoria principale.</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
           <div className="absolute top-0 right-0 p-8 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors">
            <TrendingUp size={160} />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <TrendingUp className="text-emerald-500 w-5 h-5" /> Trend Temporale
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-medium">Evoluzione annuale del volume delle segnalazioni.</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RECORENZE INVESTIGATIVE - Nomi Indagati */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
           <h3 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2">
              <Target className="text-orange-500 w-5 h-5" /> Ricorrenze Nomi Indagati
           </h3>
           <p className="text-xs text-slate-400 mb-8 font-medium">I 10 indagati ricorrenti con maggiore frequenza.</p>
           
           <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recurrentIndagatiData} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={150} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              {recurrentIndagatiData.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-400 -mt-20 text-[10px] uppercase font-bold">Nessun indagato ricorrente.</div>
              )}
           </div>
        </div>

        {/* RECORENZE INVESTIGATIVE - Nomi Vittime */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
           <h3 className="text-lg font-black text-slate-800 mb-1 flex items-center gap-2">
              <Target className="text-green-500 w-5 h-5" /> Ricorrenze Nomi Vittime
           </h3>
           <p className="text-xs text-slate-400 mb-8 font-medium">Le 10 vittime ricorrenti con maggiore frequenza.</p>
           
           <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recurrentVittimeData} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={150} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              {recurrentVittimeData.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-400 -mt-20 text-[10px] uppercase font-bold">Nessuna vittima ricorrente.</div>
              )}
           </div>
        </div>

        {/* Categories, MO, Tipologie Bars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 col-span-1 lg:col-span-2">
          
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Target className="text-indigo-500 w-4 h-4" /> Top Categorie
            </h3>
            <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.slice(0, 8)} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Target className="text-indigo-500 w-4 h-4" /> Top Modus Operandi (Frequenza)
            </h3>
            <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500 w-4 h-4" /> Top Tipologie Operative
            </h3>
            <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tipoMoData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Comuni maggiormente interessati Widget */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
            <MapPin className="text-rose-500 w-5 h-5" /> Comuni maggiormente interessati
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
             {comuniMaggiormenteInteressati.map((c, idx) => (
               <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase mb-2">{c.name}</span>
                  <span className="text-3xl font-black text-slate-800">{c.value}</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1">SEGNALAZIONI</span>
               </div>
             ))}
             {comuniMaggiormenteInteressati.length === 0 && <p className="text-xs text-slate-400 col-span-5 text-center">Dati non sufficienti per la classifica comuni.</p>}
          </div>
        </div>
      </div>

      {/* Intelligence Section */}
      <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors">
            <BrainCircuit size={300} />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start">
             <div className="md:w-1/3">
                <div className="bg-indigo-500/10 p-4 rounded-3xl border border-indigo-500/20 inline-block mb-6">
                   <BrainCircuit className="text-indigo-400 w-12 h-12" />
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-4 leading-tight">Intelligence Investigativa Avanzata</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Questa analisi è prodotta dinamicamente dal motore AI H.E.R.M.E.S. correlando i metadati estratti con i trend territoriali e di modus operandi attuali.
                </p>
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                   <Info size={16} className="text-blue-400 shrink-0" />
                   <p className="text-[10px] text-slate-400 font-medium">Relazione basata su campionamento di {reports.length} eventi filtrati.</p>
                </div>
             </div>

             <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-10 min-h-[500px]">
                {isGeneratingIntel ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Relazione di Correlazione in corso...</p>
                  </div>
                ) : intelText ? (
                  <div className="prose prose-invert max-w-none prose-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Rapporto di Intelligence Automatizzato</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-slate-200 leading-[1.8] text-[15px] selection:bg-indigo-500/30">
                      {intelText}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                      <Zap size={24} className="text-slate-600" />
                    </div>
                    <h4 className="font-bold text-slate-300">Nessuna Analisi Generata</h4>
                    <p className="text-xs text-slate-500 mt-2">Clicca il pulsante in alto a destra per avviare il motore di Intelligence sui dati attuali.</p>
                  </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default Analysis;
