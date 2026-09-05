"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";

export async function creerSequence(formData: FormData): Promise<void> {
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return;
  const { envoi } = getContainer();
  envoi.sequences.create({ clientId: CLIENT_ID_COURANT, nom });
  revalidatePath("/sequences");
}

export async function supprimerSequence(formData: FormData): Promise<boolean> {
  const sequenceId = String(formData.get("sequenceId") ?? "");
  if (!sequenceId) return false;
  const { envoi } = getContainer();
  envoi.sequences.delete(sequenceId);
  revalidatePath("/sequences");
  return true;
}

export async function supprimerEtape(formData: FormData): Promise<boolean> {
  const etapeId = String(formData.get("etapeId") ?? "");
  if (!etapeId) return false;
  const { envoi } = getContainer();
  envoi.sequences.deleteEtape(etapeId);
  revalidatePath("/sequences");
  return true;
}

export async function ajouterEtape(formData: FormData): Promise<void> {
  const sequenceId = String(formData.get("sequenceId") ?? "");
  const sujet = String(formData.get("sujet") ?? "").trim();
  const corps = String(formData.get("corps") ?? "").trim();
  const delaiJours = Number(formData.get("delaiJours") ?? 0);
  if (!sequenceId || !sujet || !corps) return;

  const { envoi } = getContainer();
  const etapesExistantes = envoi.sequences.listEtapes(sequenceId);
  envoi.sequences.addEtape({
    sequenceId,
    ordre: etapesExistantes.length,
    delaiJours,
    sujet,
    corps,
  });
  revalidatePath("/sequences");
}
