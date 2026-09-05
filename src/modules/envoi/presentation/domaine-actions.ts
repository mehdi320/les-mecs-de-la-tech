"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { verifierAuthDomaine } from "@/modules/envoi/integration/domaine-auth-checker";

export async function ajouterDomaine(formData: FormData): Promise<void> {
  const nomDomaine = String(formData.get("nomDomaine") ?? "").trim().toLowerCase();
  if (!nomDomaine) return;

  const { envoi } = getContainer();
  const existant = envoi.domaines.listByClient(CLIENT_ID_COURANT).find((d) => d.nomDomaine === nomDomaine);
  const domaine = existant ?? envoi.domaines.create({ clientId: CLIENT_ID_COURANT, nomDomaine });
  const statuts = await verifierAuthDomaine(nomDomaine);
  envoi.domaines.setAuthStatuts(domaine.id, statuts);

  revalidatePath("/domaines");
}

export async function reverifierDomaine(formData: FormData): Promise<void> {
  const domaineId = String(formData.get("domaineId") ?? "");
  const nomDomaine = String(formData.get("nomDomaine") ?? "");
  if (!domaineId || !nomDomaine) return;

  const { envoi } = getContainer();
  const statuts = await verifierAuthDomaine(nomDomaine);
  envoi.domaines.setAuthStatuts(domaineId, statuts);
  revalidatePath("/domaines");
}
