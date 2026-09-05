/**
 * Frontiere partagee vers le module Conformite (cf. SPEC.md section 2
 * et section 4, etapes 3b et 6). Utilisee par le module Verification
 * a l'import d'une liste, et par le module Envoi avant chaque envoi
 * d'etape — jamais implementee en dehors du module Conformite.
 */
export interface SuppressionChecker {
  estSupprime(clientId: string, email: string): boolean;
}
