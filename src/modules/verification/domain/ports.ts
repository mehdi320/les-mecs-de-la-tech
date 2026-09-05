import type { ResultatSmtp } from "@/modules/verification/domain/entities";

export interface MxChecker {
  verifierMx(domaine: string): Promise<boolean>;
}

export interface SmtpChecker {
  verifier(email: string): Promise<ResultatSmtp>;
}

/**
 * L'age d'un domaine (whois) n'est pas implementable sans fournisseur
 * tiers choisi (cf. SPEC.md section 7, point 4 — non tranche). Cette
 * interface renvoie `null` quand l'information n'est pas disponible ;
 * le score de risque (scoring.ts) le gere explicitement et n'ajoute
 * simplement pas ce facteur, plutot que d'inventer une valeur.
 */
export interface DomaineAgeChecker {
  obtenirAgeJours(domaine: string): Promise<number | null>;
}
