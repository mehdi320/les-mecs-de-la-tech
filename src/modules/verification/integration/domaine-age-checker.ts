import type { DomaineAgeChecker } from "@/modules/verification/domain/ports";

/**
 * Aucun fournisseur whois/age-de-domaine n'est choisi (cf. SPEC.md
 * section 7, point 4 — decision ouverte). Cette implementation
 * renvoie systematiquement `null` : le score de risque (scoring.ts)
 * omet alors ce facteur plutot que d'inventer une valeur. A
 * remplacer par un appel a un fournisseur whois une fois choisi.
 */
export class AucunDomaineAgeChecker implements DomaineAgeChecker {
  async obtenirAgeJours(): Promise<number | null> {
    return null;
  }
}
