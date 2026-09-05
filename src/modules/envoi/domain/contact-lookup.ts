/**
 * Frontiere vers le module Verification : le module Envoi n'a besoin
 * que de l'email d'un contact pour l'envoi, jamais de son score de
 * risque ni de sa liste d'origine.
 */
export interface ContactLookup {
  getEmail(contactId: string): string | null;
}
