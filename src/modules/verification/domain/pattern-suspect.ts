const DOMAINES_JETABLES_CONNUS = new Set([
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "trashmail.com",
]);

/**
 * Heuristique de pattern suspect (cf. SPEC.md section 3.2). Pas une
 * verification whois : signal faible et rapide, combine aux autres
 * facteurs du score (scoring.ts), jamais utilise seul comme verdict.
 */
export function detecterPatternDomaineSuspect(domaine: string): boolean {
  const nom = domaine.toLowerCase().trim();
  if (DOMAINES_JETABLES_CONNUS.has(nom)) return true;

  const label = nom.split(".")[0] ?? "";
  if (label.length >= 16) return true;

  const chiffres = label.replace(/[^0-9]/g, "").length;
  if (label.length > 0 && chiffres / label.length > 0.4) return true;

  return false;
}
