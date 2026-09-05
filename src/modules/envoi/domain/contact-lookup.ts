/**
 * Frontiere vers le module Verification : le module Envoi n'a besoin
 * que de l'email d'un contact pour l'envoi, et de ses donnees CSV
 * additionnelles pour le rendu des templates `{colonne}` (cf.
 * SPEC.md section 9.2 — jamais de score de risque ni de liste
 * d'origine).
 */
export interface ContactLookup {
  getEmail(contactId: string): string | null;
  getDonneesAdditionnelles(contactId: string): Record<string, unknown>;
}
