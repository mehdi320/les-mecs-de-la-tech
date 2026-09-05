/**
 * Certaines suppressions sont bloquees par une contrainte de cle
 * etrangere plutot que d'etre en cascade (ex: une mailbox ayant deja
 * des envois enregistres, cf. db/migrations/0001_init.sql). Plutot
 * que de laisser l'erreur remonter jusqu'au boundary d'erreur Next.js,
 * ce helper la convertit en `false` : la ligne reste en base, la
 * page affiche toujours l'element (pas de toast d'erreur pour
 * l'instant, cf. PASSATION.md).
 */
export function supprimerSiPossible(supprimer: () => void): boolean {
  try {
    supprimer();
    return true;
  } catch (erreur) {
    const code = (erreur as { code?: string }).code;
    if (code === "SQLITE_CONSTRAINT_FOREIGNKEY" || code === "SQLITE_CONSTRAINT") {
      return false;
    }
    throw erreur;
  }
}
