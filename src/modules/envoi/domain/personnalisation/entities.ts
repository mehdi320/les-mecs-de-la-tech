/**
 * Cf. SPEC.md section 9 : architecture adaptee du generateur A/B
 * d'outboundDM-max (skill `dm-prospecting`), format email (objet +
 * corps genere ensemble) au lieu du format DM (message unique).
 */

export type Longueur = "courte" | "developpee";

// 3 structures d'ouverture (reprises du skill dm-prospecting). Le ton
// (formel/familier) est un axe separe : ne jamais le faire varier seul
// entre deux variantes de meme longueur/structure — ce ne serait pas
// un vrai test A/B, juste du bruit.
export type Structure = "question_ouverte" | "affirmation_directe" | "reference_activite";

export const STRUCTURE_LABELS: Record<Structure, string> = {
  question_ouverte: "Question ouverte",
  affirmation_directe: "Affirmation directe",
  reference_activite: "Reference a l'activite (colonne CSV)",
};

export type Tone = "neutre" | "formel" | "familier";

export const TONE_LABELS: Record<Tone, string> = {
  neutre: "Ton d'origine",
  formel: "Vouvoiement",
  familier: "Tutoiement",
};

export type StatutVariante = "en_test" | "gagnante" | "perdante";

export interface SequenceEtapeVariante {
  id: string;
  sequenceEtapeId: string;
  nom: string;
  sujet: string;
  corps: string;
  structure: Structure;
  longueur: Longueur;
  tone: Tone;
  champsPersonnalisationRequis: string[];
  statut: StatutVariante;
}

export interface VarianteGeneree {
  sujet: string;
  corps: string;
  structure: Structure;
  longueur: Longueur;
  tone: Tone;
}
