/**
 * Module de scoring des variantes A/B (cf. SPEC.md sections 9.4 et 7
 * point 7). outboundDM-max ne fait aucun test de significativite : il
 * declare "meilleur script" le taux de reponse brut le plus eleve
 * parmi les scripts ayant depasse un minimum d'envois fixe
 * (`MIN_DM_FOR_ELIGIBILITY = 10`, src/utils/metrics.ts). Adopter ce
 * seuil tel quel pour l'email declarerait des variantes "gagnantes"
 * par bruit statistique plutot que par effet reel — le taux de
 * reponse email etant structurellement plus faible que le DM, il
 * faut un test de significativite explicite plutot qu'un simple
 * comptage minimal.
 *
 * **Les constantes ci-dessous sont des valeurs provisoires, pas la
 * decision bloquante #7 de SPEC.md section 7** (a trancher avant
 * mise en prod du scoring). Le test statistique lui-meme (z-test de
 * comparaison de deux proportions) est correct des maintenant ; seuls
 * `SEUIL_SIGNIFICATIVITE_PROVISOIRE` et `ENVOIS_MIN_PROVISOIRE`
 * restent a valider.
 */
export const SEUIL_SIGNIFICATIVITE_PROVISOIRE = 0.01; // alpha — provisoire, cf. SPEC.md section 7 point 7
export const ENVOIS_MIN_PROVISOIRE = 200; // par variante — provisoire, largement > MIN_DM_FOR_ELIGIBILITY (10) d'outboundDM-max

export interface ResultatComparaison {
  pValue: number;
  significatif: boolean;
  varianteGagnante: "a" | "b" | null;
}

// Approximation d'Abramowitz-Stegun de la fonction d'erreur — pas de
// dependance a une librairie de stats pour un calcul de p-value.
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * Test bilateral de comparaison de deux proportions (z-test avec
 * proportion poolee). `reponses`/`envois` d'une meme variante, jamais
 * de contact compte deux fois (cf. `EnvoiEvenement.variante_id`,
 * SPEC.md section 3.1).
 */
export function comparerVariantes(
  a: { envois: number; reponses: number },
  b: { envois: number; reponses: number },
  seuilSignificativite: number = SEUIL_SIGNIFICATIVITE_PROVISOIRE,
  envoisMin: number = ENVOIS_MIN_PROVISOIRE,
): ResultatComparaison {
  if (a.envois < envoisMin || b.envois < envoisMin) {
    return { pValue: 1, significatif: false, varianteGagnante: null };
  }

  const p1 = a.reponses / a.envois;
  const p2 = b.reponses / b.envois;
  const pPoolee = (a.reponses + b.reponses) / (a.envois + b.envois);
  const erreurStandard = Math.sqrt(pPoolee * (1 - pPoolee) * (1 / a.envois + 1 / b.envois));

  if (erreurStandard === 0) {
    return { pValue: 1, significatif: false, varianteGagnante: null };
  }

  const z = (p1 - p2) / erreurStandard;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));
  const significatif = pValue < seuilSignificativite;

  return {
    pValue,
    significatif,
    varianteGagnante: significatif ? (p1 > p2 ? "a" : "b") : null,
  };
}
