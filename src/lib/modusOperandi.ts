
export const MODUS_OPERANDI_MAP: Record<string, string[]> = {
  "FURTO": ["IN ABITAZIONE", "DI AUTOVETTURA", "SU AUTOVETTURA", "CON STRAPPO", "CON DESTREZZA", "ALTRO"],
  "RAPINA": ["IN PUBBLICA VIA", "IN ESERCIZIO COMMERCIALE", "IN ABITAZIONE", "ALTRO"],
  "TRUFFA AGLI ANZIANI": ["TECNICA DEL FINTO CARABINIERE", "TECNICA DEL FINTO NIPOTE", "SPOOFFING", "ALLACCIO UTENZE", "ALTRO"],
  "TRUFFA ON-LINE": ["E-COMMERCE", "PHISHING", "SMISHING", "SOCIAL MEDIA", "ALTRO"],
  "ESTORSIONE": ["DIRETTA", "INDIRETTA", "MAZZETTA", "PIZZO"],
  "USURA": ["STROZZINAGGIO", "PRESTITO AD INTERESSI"],
  "STUPEFACENTI": ["DETENZIONE AI FINI DI SPACCIO", "TRAFFICO", "CESSIONE", "CONSUMO"],
  "VIOLAZIONE CDS": ["GUIDA SOTTO INFLUENZA ALCOOL", "GUIDA SOTTO EFFETTO STUPEFACENTI", "MANCATA ASSICURAZIONE"],
  "CONTRO PUBBLICO UFFICIALE": ["RESISTENZA", "OLTRAGGIO", "MINACCIA", "LESIONI"],
  "REATO CONTRO LA PERSONA": ["LESIONI PERSONALI", "PERCOSSE", "MINACCIA", "STALKING / ATTI PERSECUTORI", "MALTRATTAMENTI IN FAMIGLIA", "VIOLENZA SESSUALE"],
  "DANNEGGIAMENTO": ["DOLOSO", "ATTO VANDALICO", "INCENDIO DOLOSO"],
  "VARIE": ["RICETTAZIONE", "RICICLAGGIO", "EVASIONE", "FAVOREGGIAMENTO", "PORTO ABUSIVO DI ARMI"]
};

export const MODUS_OPERANDI_CATEGORIES = Object.keys(MODUS_OPERANDI_MAP);

export const CATEGORIES_NORMALIZED = [
  "REATO",
  "EVENTO",
  "FATTO NON COSTITUENTE REATO",
  "ILLECITO AMMINISTRATIVO",
  "SINISTRO STRADALE",
  "CONTROLLO DEL TERRITORIO",
  "NOTIZIA CRIMINIS"
];

/**
 * Normalizes a category string to one of the standard categories.
 */
export function normalizeCategory(input: string): string {
  if (!input) return "ALTRO";
  const upper = input.toUpperCase().trim();
  
  // Quick match for exact terms
  if (CATEGORIES_NORMALIZED.includes(upper)) return upper;

  // Keyword mapping for categories
  const mapping: Record<string, string[]> = {
    "REATO": ["REATO", "R CP", "DELITTO", "CONTRAVVENZIONE PENALE", "CP ", "C.P."],
    "EVENTO": ["EVENTO", "FATTO"],
    "FATTO NON COSTITUENTE REATO": ["F.N.C.R.", "FATTO NON COSTITUENTE", "FNCR"],
    "ILLECITO AMMINISTRATIVO": ["AMMINISTRATIVO", "C.D.S.", "CDS", "VIOLAZIONE AMM", "AMM"],
    "SINISTRO STRADALE": ["SINISTRO", "INCIDENTE", "STRADALE"]
  };

  for (const [category, keywords] of Object.entries(mapping)) {
    if (keywords.some(kw => upper === kw || upper.includes(kw) || upper.startsWith(kw) || (kw.trim() === upper))) {
      return category;
    }
  }

  // specific short cases
  if (upper === 'R' || upper.startsWith('R ')) return "REATO";
  if (upper === 'E' || upper.startsWith('E ')) return "EVENTO";
  if (upper === 'AMM' || upper.startsWith('AMM ')) return "ILLECITO AMMINISTRATIVO";
  if (upper === 'F.N.C.R.' || upper === 'FNCR') return "FATTO NON COSTITUENTE REATO";
  if (upper === 'C.D.S.' || upper === 'CDS') return "ILLECITO AMMINISTRATIVO";

  return upper;
}

/**
 * Normalizes a modus operandi string to two levels.
 */
export function normalizeModusOperandiTwoLevel(input: string, detailInput?: string): { generale: string, dettaglio: string } {
  if (!input) return { generale: "VARIE", dettaglio: "ALTRO" };
  const upper = input.toUpperCase().trim();
  const detailUpper = (detailInput || "").toUpperCase().trim();
  
  // Logic to find generale
  let foundGenerale = "VARIE";
  let foundDettaglio = detailUpper || "ALTRO";

  // Reverse map keywords to MO categories
  const moKeywords: Record<string, string[]> = {
    "FURTO": ["FURTO", "RUBATO", "SOTTRATTO", "PRELEVATO"],
    "RAPINA": ["RAPINA", "SOTTRATTO CON VIOLENZA"],
    "TRUFFA AGLI ANZIANI": ["TRUFFA ANZIANI", "NONNI", "FINTO CARABINIERE", "FINTO NIPOTE"],
    "TRUFFA ON-LINE": ["ONLINE", "INTERNET", "WEB", "E-COMMERCE", "SITO", "SOCIAL", "VENDING"],
    "STUPEFACENTI": ["DROGA", "STUPEFACENTI", "HASHISH", "COCAINA", "MARIJUANA", "SPACCIO", "ERBA"],
    "REATO CONTRO LA PERSONA": ["LESIONI", "PERCOSSE", "MALTRATTAMENTI", "STALKING", "VIOLENZA SESSUALE", "MINACCIA", "AGGRESSIONE", "INGIURIA"],
    "VIOLAZIONE CDS": ["ALCOOL", "ETILOMETRO", "CDS", "STRADALE", "PATENTE", "ASSICURAZIONE"],
    "DANNEGGIAMENTO": ["DANNEGGIAMENTO", "INCENDIO", "VANDALISMO", "BRUCIATA", "VETRO ROTTO"],
    "CONTRO IL PATRIMONIO": ["ESTORSIONE", "RICETTAZIONE", "USURA", "TRUFFA", "APPROPRIAZIONE"]
  };

  for (const [gen, keywords] of Object.entries(moKeywords)) {
    if (keywords.some(kw => upper.includes(kw) || detailUpper.includes(kw))) {
      foundGenerale = gen;
      break;
    }
  }

  // If input matches exactly a Generale
  if (MODUS_OPERANDI_MAP[upper]) {
    foundGenerale = upper;
  }

  // Find detail if not explicitly detailed or to improve it
  if (MODUS_OPERANDI_MAP[foundGenerale]) {
    const details = MODUS_OPERANDI_MAP[foundGenerale];
    for (const d of details) {
      if (upper.includes(d) || detailUpper.includes(d)) {
        foundDettaglio = d;
      }
    }
  }

  return { generale: foundGenerale, dettaglio: foundDettaglio };
}

/**
 * Normalizes a modus operandi string to one of the standard categories.
 * Uses simple keyword matching.
 */
export function normalizeModusOperandi(input: string): string {
  if (!input) return "ALTRO REATO";
  const upper = input.toUpperCase().trim();
  
  // Check for exact match first
  if (MODUS_OPERANDI_CATEGORIES.includes(upper)) return upper;

  // Keyword mapping
  const mapping: Record<string, string[]> = {
    "FURTO IN ABITAZIONE": ["ABITAZIONE", "CASA", "APPARTAMENTO", "DOMICILIO", "VILLA", "ALLOGGIO"],
    "FURTO DI AUTOVETTURA": ["FURTO AUTO", "FURTO MACCHINA", "FURTO VEICOLO", "RUBATA AUTO", "AUTOVETTURA"],
    "FURTO SU AUTOVETTURA": ["SU AUTO", "INTERNO AUTO", "ROTTURA CRISTALLO", "DEFLETTORE", "CATALIZZATORE", "RUOTA DI SCORTA"],
    "FURTO CON STRAPPO": ["STRAPPO", "SCIPPO", "SCIPPATA"],
    "FURTO CON DESTREZZA": ["DESTREZZA", "BORSEGGIATORE", "BORSEGGIO", "ABILE MANOVRA"],
    "RAPINA IN PUBBLICA VIA": ["RAPINA STRADA", "RAPINA VIA", "SOTTO MINACCIA DI ARMA", "PISTOLA ALLA TEMPIA", "RAPINA"],
    "TRUFFA AGLI ANZIANI": ["ANZIANI", "NONNI", "MINORATA DIFESA", "FALSO CARABINIERE", "FALSO AVVOCATO", "TRUFFA AGGLI ANZIANI"],
    "TRUFFA ON-LINE": ["ONLINE", "INTERNET", "SITO", "WEB", "E-COMMERCE", "FACEBOOK", "SUBITO.IT", "WHATSAPP"],
    "DETENZIONE AI FINI DI SPACCIO DI STUPEFACENTI": ["SPACCIO", "STUPEFACENTI", "DROGA", "HASHISH", "COCAINA", "MARIJUANA", "DETENZIONE AI FINI"],
    "GUIDA SOTTO L'INFLUENZA DELL'ALCOOL": ["EBBREZZA", "ALCOOL", "ALCOL", "ETILOMETRO", "UBRIACO"],
    "GUIDA SOTTO L'EFFETTO DI STUPEFACENTI": ["EFFETTO STUPEFACENTI", "DROGATO", "ALTERAZIONE PSICOFISICA", "ASSUNZIONE DROGA"],
    "LESIONI PERSONALI": ["LESIONI", "FERIMENTO", "AGGRESSIONE", "BOTTE", "PUGNO", "SCHIAFFO"],
    "STALKING / ATTI PERSECUTORI": ["STALKING", "PERSECUTORI", "AMMONIMENTO", "MOLESTIE"],
    "MALTRATTAMENTI IN FAMIGLIA": ["MALTRATTAMENTI", "FAMIGLIA", "MOGLIE", "FIGLI", "DOMESTICA", "CONVIVENTE"],
    "PORTO ABUSIVO DI ARMI": ["ARMI", "COLTELLO", "PISTOLA", "OGGETTO ATTO AD OFFENDERE", "PUGNALE"],
    "RESISTENZA A PUBBLICO UFFICIALE": ["RESISTENZA", "FUGA", "POSTO DI BLOCCO", "SPINTONAMENTO"],
    "DANNEGGIAMENTO": ["DANNEGGIAMENTO", "ATTO VANDALICO", "VANDALISMO", "IMBRATTAMENTO"],
    "RICETTAZIONE": ["RICETTAZIONE", "PROVENIENZA FURTO"],
    "USURA": ["USURA", "STROZZINAGGIO", "INTERESSI"],
    "ESTORSIONE": ["ESTORSIONE", "RICATTO", "MAZZETTA", "PIZZO"]
  };

  for (const [category, keywords] of Object.entries(mapping)) {
    if (keywords.some(kw => upper.includes(kw))) {
      return category;
    }
  }

  return upper; // Fallback to uppercase input if no keyword matches
}
