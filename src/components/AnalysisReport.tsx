import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Segnalazione } from '../types';

const COLORS = ['#1e293b', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];
import { 
  Printer, 
  FileCheck, 
  Shield, 
  Clock, 
  FileText, 
  Map as MapIcon, 
  MapPin,
  TrendingUp, 
  AlertTriangle,
  BrainCircuit,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { generateInvestigativeIntelligence } from '../lib/geminiService';

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

// Helper to update map view when markers change
const ChangeView: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      setTimeout(() => map.invalidateSize(), 500); // Important for printing & dynamic container
    }
  }, [coords, map]);
  return null;
};

interface AnalysisReportProps {
  reports: Segnalazione[];
  apiKey?: string;
  comandoName?: string;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ reports, apiKey, comandoName }) => {
  const [intelText, setIntelText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [dynamicCoords, setDynamicCoords] = useState<Record<string, [number, number]>>({});

  // Group reports by comune for map
  const mapData = useMemo(() => {
    const groups: Record<string, { reports: Segnalazione[], lat: number, lng: number }> = {};
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
      const city = r.comune.toUpperCase();
      if (!groups[city]) {
        let base = cityCoords[city] || dynamicCoords[city];
        if (!base) {
           base = [41.9, 12.5];
        }
        groups[city] = { reports: [], lat: base[0], lng: base[1] };
      }
      groups[city].reports.push(r);
    });
    return Object.entries(groups).map(([city, data]) => ({ city, ...data }));
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

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => counts[r.categoria] = (counts[r.categoria] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const generateReport = async () => {
    if (reports.length === 0) return;
    setIsGenerating(true);
    try {
       const counts: Record<string, number> = {};
       reports.forEach(r => counts[r.categoria] = (counts[r.categoria] || 0) + 1);
       
       const summary = `
        REPORT PER P.G. - ANALISI QUANTITATIVA
        Eventi totali: ${reports.length}
        Ripartizione Categorie: ${Object.entries(counts).map(([k,v]) => `${k}: ${v}`).join(', ')}
        Periodo: Dal ${reports[reports.length-1]?.dataOra.split(' ')[0]} al ${reports[0]?.dataOra.split(' ')[0]}
       `;
       const result = await generateInvestigativeIntelligence(summary, apiKey);
       setIntelText(result);
    } catch (err) {
      console.error(err);
      setIntelText("Errore nella generazione dell'analisi esperta.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Configuration Header for UI */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl">
            <FileText className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Generatore Report Professionale</h2>
            <p className="text-xs text-slate-500">Produce un documento A4 investigativo per la Polizia Giudiziaria.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generateReport}
            disabled={isGenerating || reports.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
            Analisi Esperta
          </button>
          <button 
            onClick={handlePrint}
            disabled={reports.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Printer size={16} />
            Stampa Report
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-slate-100/50 p-12 text-center rounded-[3rem] border border-slate-200 border-dashed">
            <AlertTriangle className="mx-auto text-slate-300 w-12 h-12 mb-4" />
            <h3 className="text-lg font-bold text-slate-600">Nessun dato filtrato disponibile</h3>
            <p className="text-sm text-slate-400 mt-1">Usa i filtri superiori per selezionare gli eventi da includere nel report.</p>
        </div>
      ) : (
        /* Report Preview Container */
        <div className="flex justify-center">
            <div className="report-paper bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[20mm] relative text-slate-900 font-serif">
                {/* Logo and Header */}
                <div className="flex justify-between items-start mb-12">
                       <div className="flex flex-col items-center">
                          <Shield className="w-12 h-12 text-slate-800 mb-1" />
                          <div className="h-0.5 w-16 bg-slate-800" />
                          <p className="text-[10px] uppercase font-bold tracking-widest mt-2">{comandoName || 'ANALISI H.E.R.M.E.S.'}</p>
                       </div>
                   <div className="text-right">
                      <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Appunto Investigativo</h1>
                      <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                         <Clock size={10} />
                         <span>ESTRATTO IL: {new Date().toLocaleDateString('it-IT')} {new Date().toLocaleTimeString('it-IT')}</span>
                      </div>
                   </div>
                </div>

                <div className="mb-10 text-xs border-y border-slate-200 py-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-bold uppercase tracking-widest text-slate-400">Riferimento Fenomenologico:</span>
                    <p className="font-black text-slate-800 mt-1 uppercase text-sm">Analisi Integrata H.E.R.M.E.S.</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold uppercase tracking-widest text-slate-400">Eventi Analizzati:</span>
                    <p className="font-black text-slate-800 mt-1 text-sm">{reports.length} Segnalazioni</p>
                  </div>
                </div>

                {/* Section 1: Intro */}
                <section className="mb-10">
                   <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2 border-l-4 border-slate-800 pl-4">
                      1. Inquadramento Fenomenologico e Sintesi Esecutiva
                   </h2>
                   <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap pl-5 italic border-l border-slate-100">
                      {intelText || (
                        <p className="text-slate-400">In attesa di generazione dell'analisi di intelligence...</p>
                      )}
                   </div>
                </section>

                {/* Section 2: Distribution Table */}
                <section className="mb-10">
                   <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2 border-l-4 border-slate-800 pl-4">
                      2. Analisi Quantitativa e Distribuzione
                   </h2>
                   <div className="pl-5">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border border-slate-200 px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">M.O. Recurrente</th>
                            <th className="border border-slate-200 px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Percentuale</th>
                            <th className="border border-slate-200 px-4 py-2 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Frequenza</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Top 5 MO for table */}
                          {Object.entries(reports.reduce((acc, r) => {
                            acc[r.modus_operandi_dettaglio] = (acc[r.modus_operandi_dettaglio] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>))
                          .sort((a,b) => (b[1] as number) - (a[1] as number))
                          .slice(0, 8)
                          .map(([name, count]) => (
                            <tr key={name}>
                              <td className="border border-slate-200 px-4 py-2 text-xs font-bold text-slate-800">{name}</td>
                              <td className="border border-slate-200 px-4 py-2 text-center text-xs text-slate-500">
                                {Math.round(((count as number) / reports.length) * 100)}%
                              </td>
                              <td className="border border-slate-200 px-4 py-2 text-right text-xs font-black text-slate-900">{count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </section>

                {/* Section 3: Subject Analysis - Recurring Subjects */}
                <section className="mb-10">
                   <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2 border-l-4 border-slate-800 pl-4">
                      3. Prospetto Soggetti e Reti Relazionali
                   </h2>
                   <div className="pl-5 space-y-4">
                      {useMemo(() => {
                        const personaMap: Record<string, { role: string; dates: string[]; summaries: string[]; count: number }> = {};
                        
                        reports.forEach(r => {
                          const allSoggetti = [
                            ...r.indagati.map(p => ({ ...p, role: 'INDAGATO' })),
                            ...r.vittime.map(p => ({ ...p, role: 'VITTIMA' }))
                          ];
                          allSoggetti.forEach(p => {
                            const key = `${p.cognome} ${p.nome} (${p.dataNascita || 'N/D'})`.toUpperCase();
                            if (!personaMap[key]) {
                              personaMap[key] = { role: p.role, dates: [], summaries: [], count: 0 };
                            }
                            personaMap[key].dates.push(r.dataOra.split(' ')[0]);
                            personaMap[key].summaries.push(r.sunto);
                            personaMap[key].count++;
                          });
                        });

                        const recurring = Object.entries(personaMap)
                          .filter(([_, data]) => data.count > 1)
                          .map(([name, data]) => ({ name, ...data }));

                        if (recurring.length === 0) {
                          return <p className="text-xs text-slate-400 italic">Valore negativo: nessuna identità ricorrente rilevata nel campione analizzato.</p>;
                        }

                        return recurring.map((p, i) => (
                          <div key={i} className="text-xs border-b border-slate-100 pb-4 last:border-b-0">
                            <div className="flex items-center justify-between mb-2">
                               <span className="font-black uppercase text-indigo-900">{p.name}</span>
                               <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-black">{p.role}</span>
                            </div>
                            <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                               {p.dates.map((date, idx) => (
                                 <div key={idx} className="bg-slate-50/50 p-2 rounded">
                                   <p className="text-[9px] font-black text-slate-400 mb-1">EVENTO DEL {date}</p>
                                   <p className="text-[10px] text-slate-600 leading-relaxed italic">"{p.summaries[idx]}"</p>
                                 </div>
                               ))}
                            </div>
                          </div>
                        ));
                      }, [reports])}
                   </div>
                </section>

                {/* Section 4: Territorial Mapping */}
                <section className="mb-10 page-break-inside-avoid">
                   <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2 border-l-4 border-slate-800 pl-4">
                      4. Mappatura Territoriale ed Estrazione Geografica
                   </h2>
                   <div className="pl-5">
                      <div className="h-[250px] w-full rounded-xl overflow-hidden border border-slate-200">
                        {reports.length > 0 && mapData.length > 0 ? (
                           <MapContainer center={[41.9, 12.5]} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 10 }}>
                             <ChangeView coords={mapData.map((d: any) => [d.lat, d.lng])} />
                             <TileLayer
                               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                             />
                             {mapData.map((data: any, idx: number) => (
                               <Marker key={idx} position={[data.lat, data.lng]} />
                             ))}
                           </MapContainer>
                        ) : (
                           <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-400 text-xs">Caricamento mappa...</div>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 text-right italic">Elaborazione generata da dati grezzi. Coordinate standardizzate su macro-aree comunali.</p>
                   </div>
                </section>

                <div className="flex justify-between items-end border-t border-slate-200 pt-6 mt-16 print:mt-10">
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">H.E.R.M.E.S. Intelligence System</p>
                      <p className="text-[8px] text-slate-300">Generato con motore Gemini IA - Uso Riservato</p>
                   </div>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print, .no-print * {
             display: none !important;
          }
          .report-paper {
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-break-inside-avoid {
             page-break-inside: avoid;
             break-inside: avoid;
          }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>
    </div>
  );
};

export default AnalysisReport;
