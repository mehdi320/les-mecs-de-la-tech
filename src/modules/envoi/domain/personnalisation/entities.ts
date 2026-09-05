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

/**
 * Une etape de rang 0 est le premier contact ; toute etape suivante
 * est une relance (follow-up) — cf. SPEC.md section 9.6. Derive de
 * `SequenceEtape.ordre`, jamais stocke separement : une seule source
 * de verite pour la position dans la sequence.
 */
export type TypeEtape = "premier_contact" | "relance";

export function typeEtape(ordre: number): TypeEtape {
  return ordre === 0 ? "premier_contact" : "relance";
}

export const TYPE_ETAPE_LABELS: Record<TypeEtape, string> = {
  premier_contact: "Premier contact",
  relance: "Relance",
};

/**
 * Convention cold email B2B (a l'inverse du DM, plafonne a 1-2
 * relances par le skill dm-prospecting) : au-dela de ~5 touches au
 * total, le taux de reponse marginal decroit fortement. Seuil
 * indicatif affiche a l'utilisateur, jamais bloquant.
 */
export const TOUCHES_RECOMMANDEES_MAX = 5;

/**
 * Cadence indicative en jours depuis le premier contact (touche 1 =
 * J+0), pour une sequence de cold email B2B classique : espacement
 * croissant, jamais moins de quelques jours entre deux relances pour
 * ne pas paraitre insistant. Purement indicatif (pre-remplit le champ
 * delai, jamais impose) — chaque produit/audience peut justifier un
 * rythme different.
 */
export const CADENCE_SUGGEREE_JOURS = [0, 3, 7, 12, 18];
