import type { Contact } from "./contact";

/**
 * Deux contacts sont considérés comme le même enregistrement si l'email deviné
 * correspond, ou à défaut si le nom complet et l'entreprise correspondent.
 * Le score de risque (module Vérification) est ce qui départage ensuite la
 * qualité de la donnée — le dédoublonnage ne juge pas la qualité, seulement l'identité.
 */
export function isSameContact(a: Pick<Contact, "emailGuessed" | "fullName" | "companyId">, b: Pick<Contact, "emailGuessed" | "fullName" | "companyId">): boolean {
  if (a.emailGuessed && b.emailGuessed) {
    return a.emailGuessed.toLowerCase() === b.emailGuessed.toLowerCase();
  }
  return (
    a.companyId === b.companyId &&
    a.fullName.trim().toLowerCase() === b.fullName.trim().toLowerCase()
  );
}

type ContactIdentity = Pick<Contact, "emailGuessed" | "fullName" | "companyId">;

export function deduplicateContacts<T extends ContactIdentity>(
  candidates: T[],
  existing: ContactIdentity[],
): T[] {
  return candidates.filter(
    (candidate) => !existing.some((existingContact) => isSameContact(candidate, existingContact)),
  );
}
