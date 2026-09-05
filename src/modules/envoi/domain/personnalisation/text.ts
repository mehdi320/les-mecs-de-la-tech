// Ported depuis outboundDM-max (src/utils/text.ts) : logique texte
// generique, independante du format DM/email.

// \b de JS ne traite pas les lettres accentuees comme des caracteres de mot :
// on utilise donc des limites Unicode-safe pour eviter de matcher "tes" a
// l'interieur de "etes", "votre" a l'interieur d'un mot accentue, etc.
export function wordBoundaryRegex(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "giu");
}

export function replacePreserveCase(text: string, phrase: string, replacement: string): string {
  return text.replace(wordBoundaryRegex(phrase), (match) => {
    const premiereLettre = match.charAt(0);
    const isCapitalized = premiereLettre === premiereLettre.toUpperCase() && premiereLettre !== premiereLettre.toLowerCase();
    return isCapitalized ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
  });
}

export function applyReplacements(text: string, replacements: [phrase: string, replacement: string][]): string {
  return replacements.reduce((acc, [phrase, replacement]) => replacePreserveCase(acc, phrase, replacement), text);
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function countMatches(text: string, phrases: string[]): number {
  return phrases.reduce((acc, phrase) => acc + (text.match(wordBoundaryRegex(phrase))?.length ?? 0), 0);
}
