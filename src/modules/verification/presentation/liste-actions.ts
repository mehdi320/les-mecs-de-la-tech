"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import type { ContactBrut } from "@/modules/verification/domain/import-liste-service";

function parserContacts(texte: string): ContactBrut[] {
  return texte
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter(Boolean)
    .map((ligne) => {
      const [email, ...reste] = ligne.split(",").map((valeur) => valeur.trim());
      return { email: email ?? "", donneesAdditionnelles: reste.length ? { extra: reste } : {} };
    })
    .filter((contact) => contact.email.includes("@"));
}

export async function importerListe(formData: FormData): Promise<void> {
  const nom = String(formData.get("nom") ?? "").trim();
  const sourceDeclaree = String(formData.get("sourceDeclaree") ?? "").trim() || null;
  const texte = String(formData.get("contacts") ?? "");
  if (!nom || !texte) return;

  const { verification } = getContainer();
  verification.importerListeService.importer(CLIENT_ID_COURANT, nom, sourceDeclaree, parserContacts(texte));

  revalidatePath("/listes");
}

export async function lancerVerification(formData: FormData): Promise<void> {
  const listeId = String(formData.get("listeId") ?? "");
  if (!listeId) return;

  const { verification } = getContainer();
  await verification.verificationService.verifierListe(listeId);

  revalidatePath("/listes");
}
