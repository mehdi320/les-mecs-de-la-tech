"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/shared/integration/container";
import { genererVariantesEmail } from "@/modules/envoi/domain/personnalisation/generator";
import { extraireChampsPersonnalisation } from "@/shared/domain/template";
import type { StatutVariante } from "@/modules/envoi/domain/personnalisation/entities";

const NOMS = ["A", "B", "C", "D", "E"];

export async function genererVariantesPourEtape(formData: FormData): Promise<void> {
  const sequenceEtapeId = String(formData.get("sequenceEtapeId") ?? "");
  const sujetReference = String(formData.get("sujetReference") ?? "");
  const corpsReference = String(formData.get("corpsReference") ?? "");
  if (!sequenceEtapeId || !sujetReference.trim() || !corpsReference.trim()) return;

  const { envoi } = getContainer();
  const variantes = genererVariantesEmail(sujetReference, corpsReference);
  const existantes = envoi.sequenceEtapeVariantes.listBySequenceEtape(sequenceEtapeId).length;

  variantes.forEach((v, i) => {
    const nom = NOMS[(existantes + i) % NOMS.length] ?? `V${existantes + i + 1}`;
    envoi.sequenceEtapeVariantes.create({
      sequenceEtapeId,
      nom,
      sujet: v.sujet,
      corps: v.corps,
      structure: v.structure,
      longueur: v.longueur,
      tone: v.tone,
      champsPersonnalisationRequis: extraireChampsPersonnalisation(v.corps),
    });
  });

  revalidatePath("/sequences");
}

export async function changerStatutVariante(formData: FormData): Promise<void> {
  const varianteId = String(formData.get("varianteId") ?? "");
  const statut = String(formData.get("statut") ?? "") as StatutVariante;
  if (!varianteId || !["en_test", "gagnante", "perdante"].includes(statut)) return;

  const { envoi } = getContainer();
  envoi.sequenceEtapeVariantes.updateStatut(varianteId, statut);
  revalidatePath("/sequences");
}
