export type StatutVerificationListe = "en_attente" | "en_cours" | "terminee";

export interface ListeImportee {
  id: string;
  clientId: string;
  nom: string;
  sourceDeclaree: string | null;
  nbContacts: number;
  statutVerification: StatutVerificationListe;
}

export interface Contact {
  id: string;
  clientId: string;
  listeId: string;
  email: string;
  donneesAdditionnelles: Record<string, unknown>;
}

export type ResultatSmtp = "valide" | "invalide" | "catch_all" | "inconnu";

export interface FacteurScore {
  facteur: string;
  poids: number;
  detail: string;
}

export interface VerificationResultat {
  id: string;
  contactId: string;
  resultatSmtp: ResultatSmtp;
  mxValide: boolean;
  ageDomaineJours: number | null;
  patternDomaineSuspect: boolean;
  scoreRisque: number;
  scoreExplication: FacteurScore[];
}
