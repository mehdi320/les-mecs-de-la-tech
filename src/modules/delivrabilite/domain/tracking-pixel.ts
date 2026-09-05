/**
 * Suivi d'ouverture par pixel de tracking (cf. SPEC.md section 9.7).
 * Pratique standard du cold email (Instantly/Lemlist/Smartlead font
 * de meme) : sous-estime toujours le taux reel (clients mail qui
 * bloquent les images par defaut), jamais une mesure exacte — a
 * traiter comme un signal relatif entre variantes/campagnes, pas un
 * chiffre absolu.
 */
export function construireUrlPixel(baseUrl: string, envoiEvenementId: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/tracking/pixel/${envoiEvenementId}`;
}

/** Injecte le pixel en fin de corps HTML — jamais visible, jamais dans un texte relu par lint (ajoute apres coup). */
export function injecterPixelSuivi(corps: string, urlPixel: string): string {
  return `${corps}\n<img src="${urlPixel}" width="1" height="1" alt="" style="display:none" />`;
}
