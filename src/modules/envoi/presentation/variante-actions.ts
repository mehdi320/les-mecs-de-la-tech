"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/shared/integration/container";
import { genererVariantesEmail, genererVariantesRelance } from "@/modules/envoi/domain/personnalisation/generator";
import { extraireChampsPersonnalisation } from "@/shared/domain/template";
import type { StatutVariante } from "@/modules/envoi/domain/personnalisation/entities";

const NOMS = ["A", "B", "C", "D", "E"];

export async function genererVariantesPourEtape(formData: FormData): Promise<void> {
  const sequenceEtapeId = String(formData.get("sequenceEtapeId") ?? "");
  const sujetReference = String(formData.get("sujetReference") ?? "");
  const corpsReference = String(formData.get("corpsReference") ?? "");
  const inclureOffre = formData.get("inclureOffre") === "on";
  if (!sequenceEtapeId || !corpsReference.trim()) return;

  const { envoi } = getContainer();
  const etape = envoi.sequences.findEtapeById(sequenceEtapeId);
  if (!etape) return;

  // Etape de rang 0 = premier contact (objet libre) ; toute etape
  // suivante = relance, dont l'objet reprend toujours celui du
  // premier contact ("Re : ...") — cf. SPEC.md section 9.6.
  let variantes;
  if (etape.ordre === 0) {
    if (!sujetReference.trim()) return;
    variantes = genererVariantesEmail(sujetReference, corpsReference);
  } else {
    const premiereEtape = envoi.sequences.listEtapes(etape.sequenceId).find((e) => e.ordre === 0);
    const sujetPremierContact = premiereEtape?.sujet ?? sujetReference;
    if (!sujetPremierContact.trim()) return;
    variantes = genererVariantesRelance(sujetPremierContact, corpsReference, { inclureOffre });
  }

  const existantes = envoi.sequenceEtapeVariantes.listBySequenceEtape(sequenceEtapeId).length;

  // Un second cycle de generation (ex: nouveau message de reference)
  // ajoute des variantes plutot que d'en ecraser : les noms
  // continuent la sequence A-E puis V6, V7... — jamais de retour a
  // "A" via un modulo, qui entrerait en collision avec la variante A
  // deja existante (contrainte d'unicite sequence_etape_id + nom).
  variantes.forEach((v, i) => {
    const index = existantes + i;
    const nom = NOMS[index] ?? `V${index + 1}`;
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

export async function supprimerVariante(formData: FormData): Promise<boolean> {
  const varianteId = String(formData.get("varianteId") ?? "");
  if (!varianteId) return false;
  const { envoi } = getContainer();
  envoi.sequenceEtapeVariantes.delete(varianteId);
  revalidatePath("/sequences");
  return true;
}
