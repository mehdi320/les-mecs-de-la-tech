import type { ProviderVerdict } from "./verification-result";

/**
 * Le second fournisseur n'est interrogé que si le premier signale un catch-all
 * ou un résultat incertain : c'est ce qui garde le coût du waterfall concentré
 * exactement sur les cas où le score nuancé apporte de la valeur (voir
 * DECISIONS-BLOQUANTES.md, décision 2).
 */
export function shouldTriggerSecondaryVerification(primaryVerdict: ProviderVerdict): boolean {
  return primaryVerdict === "catch_all" || primaryVerdict === "unknown";
}
