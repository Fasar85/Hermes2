import React, { useMemo } from 'react';
import { FilterState, Segnalazione, ModusOperandiStore } from '../types';
import { Search, Calendar, MapPin, Filter, User } from 'lucide-react';

interface SharedFilterBarProps {
  reports: Segnalazione[];
  config: ModusOperandiStore;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

const SharedFilterBar: React.FC<SharedFilterBarProps> = ({ reports, config, filters, setFilters }) => {
  
  // Calculate options based on CURRENTLY filtered reports (excluding the filter itself to allow re-selection)
  const getOptions = (key: keyof Segnalazione | 'soggetto' | 'fasciaEta') => {
    // To make it dynamic, we should look at reports filtered by ALL OTHER filters
    const otherFiltersActive = Object.entries(filters).filter(([k, v]) => v !== '' && k !== key);
    
    let filteredForOptions = reports;
    if (otherFiltersActive.length > 0) {
      filteredForOptions = reports.filter(r => {
        return otherFiltersActive.every(([k, v]) => {
          if (k === 'search') return true; 
          if (k === 'dataDa' || k === 'dataA') return true;
          if (k === 'fasciaEta') return true;
          if (k === 'soggetto') {
            const search = (v as string).toLowerCase();
            return [...r.vittime, ...r.indagati].some(p => 
              `${p.cognome} ${p.nome}`.toLowerCase().includes(search) ||
              `${p.nome} ${p.cognome}`.toLowerCase().includes(search)
            );
          }
          return (r as any)[k] === v;
        });
      });
    }

    const set = new Set<string>();
    filteredForOptions.forEach(r => {
      const val = (r as any)[key];
      if (val) set.add(val);
    });
    return Array.from(set).sort();
  };

  const provinceOptions = useMemo(() => getOptions('provincia'), [reports, filters]);
  const comuniOptions = useMemo(() => getOptions('comune'), [reports, filters]);
  
  // Cascading logic for Category -> MO -> Type
  const categorieOptions = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => { if (r.categoria) set.add(r.categoria.toUpperCase()); });
    return Array.from(set).sort();
  }, [reports]);

  const moOptions = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      const matchCat = !filters.categoria || r.categoria.toUpperCase() === filters.categoria.toUpperCase();
      if (matchCat && r.modus_operandi_dettaglio) {
        set.add(r.modus_operandi_dettaglio.toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [reports, filters.categoria]);

  const tipoMoOptions = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      const matchCat = !filters.categoria || r.categoria.toUpperCase() === filters.categoria.toUpperCase();
      const matchMO = !filters.modusOperandi || r.modus_operandi_dettaglio.toUpperCase() === filters.modusOperandi.toUpperCase();
      if (matchCat && matchMO && r.tipo_modus_operandi) {
        set.add(r.tipo_modus_operandi.toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [reports, filters.categoria, filters.modusOperandi]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoria: '',
      soggetto: '',
      provincia: '',
      comune: '',
      modusOperandi: '',
      tipoModusOperandi: '',
      dataDa: '',
      dataA: '',
      fasciaEta: '',
      presenzaIndagati: ''
    });
  };

  return (
    <div className="bg-white border-b border-slate-200 p-4 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Row 1: Search and Main Categories */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              name="search"
              placeholder="RICERCA LIBERA..."
              value={filters.search}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-bold"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select
              name="categoria"
              value={filters.categoria}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-bold appearance-none bg-white uppercase"
            >
              <option value="">TUTTE LE CATEGORIE</option>
              {categorieOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              name="soggetto"
              placeholder="COGNOME E NOME..."
              value={filters.soggetto}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-bold"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select
              name="provincia"
              value={filters.provincia}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-bold appearance-none bg-white uppercase"
            >
              <option value="">TUTTE LE PROVINCE</option>
              {provinceOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select
              name="comune"
              value={filters.comune}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-bold appearance-none bg-white uppercase"
            >
              <option value="">TUTTI I COMUNI</option>
              {comuniOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: MO and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-2 border-t border-slate-100 items-end">
          <div className="relative">
             <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Modus Operandi</label>
             <select
              name="modusOperandi"
              value={filters.modusOperandi}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-bold appearance-none bg-white uppercase"
            >
              <option value="">TUTTI I MODUS OPERANDI</option>
              {moOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="relative">
             <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Tipologia Operativa</label>
             <select
              name="tipoModusOperandi"
              value={filters.tipoModusOperandi}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-bold appearance-none bg-white uppercase"
            >
              <option value="">TUTTE LE TIPOLOGIE</option>
              {tipoMoOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="relative">
             <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Indagati</label>
             <select
              name="presenzaIndagati"
              value={filters.presenzaIndagati}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-[10px] font-bold appearance-none bg-white uppercase"
            >
              <option value="">PRESENZA (TUTTI)</option>
              <option value="si">CON INDAGATI</option>
              <option value="no">SENZA INDAGATI</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block text-center">Intervallo Temporale</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                name="dataDa"
                value={filters.dataDa}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-slate-200 rounded-md text-[10px] font-bold focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-slate-400 text-[8px] font-black shrink-0">AL</span>
              <input
                type="date"
                name="dataA"
                value={filters.dataA}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-slate-200 rounded-md text-[10px] font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="relative">
             <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Fasce Età</label>
             <select
              name="fasciaEta"
              value={filters.fasciaEta}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs font-bold appearance-none bg-white uppercase"
            >
              <option value="">FASCIA D'ETÀ</option>
              <option value="0-18">0-18 ANNI (MINORENNI)</option>
              <option value="19-30">19-30 ANNI</option>
              <option value="31-50">31-50 ANNI</option>
              <option value="51-65">51-65 ANNI</option>
              <option value="65+">OVER 65 ANNI</option>
            </select>
          </div>

          <button 
            onClick={clearFilters}
            className="px-4 py-2 text-xs text-indigo-600 hover:bg-indigo-50 font-black rounded-md transition-colors uppercase tracking-tight h-10 border border-transparent"
          >
            RESET
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedFilterBar;
