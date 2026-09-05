const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Estime si l'email deviné suit un pattern professionnel courant par rapport
 * au nom complet (prenom.nom@, p.nom@, prenomnom@, prenom_nom@...). Ne dépend
 * d'aucune autre donnée que le contact lui-même : ça évite au module
 * Vérification d'aller lire d'autres contacts dans le module Extraction.
 */
export function estimatePatternMatchConfidence(email: string, fullName: string): number {
  const localPart = email.split("@")[0]?.toLowerCase() ?? "";
  const nameParts = fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length < 2 || !localPart) return 0.3; // pas assez d'info pour juger, confiance neutre-basse

  const first = nameParts[0]!;
  const last = nameParts[nameParts.length - 1]!;

  const commonPatterns = [
    `${first}.${last}`,
    `${first}${last}`,
    `${first}_${last}`,
    `${first[0]}${last}`,
    `${first[0]}.${last}`,
    `${last}.${first}`,
    `${first}`,
  ];

  if (commonPatterns.includes(localPart)) return 0.9;

  const looksLikeInitialsPlusWord = new RegExp(`^${first[0]}\\.?[a-z]+$`).test(localPart);
  if (looksLikeInitialsPlusWord) return 0.5;

  return 0.15;
}
