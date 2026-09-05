/**
 * Rendu des templates `{colonne}` a partir des donnees du CSV client
 * (`Contact.donnees_additionnelles_json`, cf. SPEC.md section 3.2 et
 * section 9.2). Jamais de donnee recherchee par le produit lui-meme :
 * seules les colonnes deja presentes dans `donnees` sont substituees.
 */
export function renderTemplate(contenu: string, donnees: Record<string, unknown>): string {
  return contenu.replace(/\{([a-z0-9_]+)\}/giu, (match, cle: string) => {
    const valeur = donnees[cle];
    return valeur === undefined || valeur === null ? "" : String(valeur);
  });
}

/** Colonnes `{xxx}` referencees dans un texte, dans leur ordre d'apparition, sans doublon. */
export function extraireChampsPersonnalisation(texte: string): string[] {
  const trouves = texte.match(/\{[a-z0-9_]+\}/giu) ?? [];
  const noms = trouves.map((token) => token.slice(1, -1).toLowerCase());
  return Array.from(new Set(noms));
}
