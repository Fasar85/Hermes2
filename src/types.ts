export interface Persona {
  nome: string;
  cognome: string;
  dataNascita?: string;
  luogoNascita?: string;
  ruolo: 'indagati' | 'vittime' | 'testimone';
}

export interface User {
  cip: string;
  grado: string;
  cognome: string;
  nome: string;
  ruolo: 'admin' | 'user';
  permessi: 'read' | 'write';
  apiKey?: string;
}

export interface MOType {
  id: string;
  nome: string;
}

export interface ModusOperandi {
  id: string;
  nome: string;
  tipi: MOType[];
}

export interface CategoriaConfig {
  id: string;
  nome: string;
  modusOperandi: ModusOperandi[];
}

export interface ModusOperandiStore {
  categorie: CategoriaConfig[];
}

export interface Segnalazione {
  idUnivoco: string;
  protocollo: string;
  comando: string;
  dataOra: string;
  provincia: string;
  comune: string;
  coordinate?: { lat: number; lng: number };
  oggetto: string;
  dinamica: string;
  sunto: string;
  testoIntegrale?: string;
  categoria: string;
  modus_operandi_dettaglio: string;
  tipo_modus_operandi: string;
  vittime: Persona[];
  indagati: Persona[];
  requiresRevision?: boolean;
  isSoloFenomeno?: boolean;
}

export interface AppDatabase {
  segnalazioni: Segnalazione[];
  configuratore: ModusOperandiStore;
  utenti: User[];
  comandoName?: string;
  lastModified?: string;
  version?: string;
}

export interface FilterState {
  search: string;
  categoria: string;
  soggetto: string;
  provincia: string;
  comune: string;
  modusOperandi: string;
  tipoModusOperandi: string;
  dataDa: string;
  dataA: string;
  fasciaEta: string;
  presenzaIndagati: string;
}
