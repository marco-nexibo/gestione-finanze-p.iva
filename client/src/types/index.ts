export interface Entrata {
  id: number;
  mese: number;
  anno: number;
  importo: number;
  descrizione?: string;
  data_inserimento: string;
}

export interface Spesa {
  id: number;
  mese: number;
  anno: number;
  importo: number;
  categoria?: string;
  descrizione?: string;
  data_inserimento: string;
}

export interface Prelievo {
  id: number;
  mese: number;
  anno: number;
  importo: number;
  descrizione?: string;
  data_inserimento: string;
}

export interface DatiMensili {
  mese: number;
  anno: number;
  entrate: {
    lista: Entrata[];
    totale: number;
  };
  spese: {
    lista: Spesa[];
    totale: number;
  };
  prelievi: {
    lista: Prelievo[];
    totale: number;
  };
  calcoli: {
    entrateNette: number;
    percentualeTasse: number;
    tasseDaPagare: number;
    disponibileDopoTasse: number;
    disponibileDopSpese: number;
    stipendioDisponibile: number;
    dettaglioTasse?: {
      irpef: number;
      inps: number;
      coefficiente: number;
      redditoImponibile: number;
    };
  };
}

export interface RiepilogoMensile {
  mese: number;
  entrate: number;
  spese: number;
  prelievi: number;
  tasse: number;
  stipendioDisponibile: number;
}

export interface RiepilogoAnnuale {
  anno: number;
  riepilogo: RiepilogoMensile[];
  totali: {
    entrate: number;
    spese: number;
    prelievi: number;
    tasse: number;
    stipendioDisponibile: number;
  };
}

// Tipi per il profilo fiscale semplificato
export type GestioneInps = 'gestione_separata' | 'artigiani_commercianti';

export interface ProfiloFiscale {
  aliquotaIrpef: number; // 5 o 15
  coefficienteRedditivita: number; // es. 67
  gestioneInps: GestioneInps;
}
