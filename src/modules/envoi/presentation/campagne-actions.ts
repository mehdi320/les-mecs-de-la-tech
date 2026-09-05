"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";

export async function creerCampagne(formData: FormData): Promise<void> {
  const sequenceId = String(formData.get("sequenceId") ?? "");
  const listeId = String(formData.get("listeId") ?? "");
  const mailboxId = String(formData.get("mailboxId") ?? "");
  const fuseauHoraire = String(formData.get("fuseauHoraire") ?? "Europe/Paris");
  const seuilBrut = String(formData.get("seuilScoreRisqueMin") ?? "");
  const seuilScoreRisqueMin = seuilBrut ? Number(seuilBrut) : null;
  if (!sequenceId || !listeId || !mailboxId) return;

  const { clients, envoi, verification } = getContainer();
  const client = clients.findById(CLIENT_ID_COURANT);
  if (!client || !client.dpaSignedAt) {
    throw new Error("DPA non signe : envoi bloque (cf. SPEC.md section 4, etape 1).");
  }

  const campagne = envoi.campagnes.create({
    clientId: CLIENT_ID_COURANT,
    sequenceId,
    listeId,
    mailboxIds: [mailboxId],
    fuseauHoraire,
    fenetreEnvoiDebut: "09:00",
    fenetreEnvoiFin: "17:00",
    seuilScoreRisqueMin,
  });

  const contacts = verification.contacts.listByListe(listeId);
  for (const contact of contacts) {
    if (seuilScoreRisqueMin !== null) {
      const resultat = verification.verificationResultats.findByContact(contact.id);
      if (resultat && resultat.scoreRisque > seuilScoreRisqueMin) continue;
    }
    envoi.enrollments.create({ campagneId: campagne.id, contactId: contact.id });
  }

  revalidatePath("/campagnes");
}

/**
 * Fait avancer d'une etape tous les enrollments en attente d'une
 * campagne. Pas de planificateur temps reel dans ce MVP (cf.
 * PASSATION.md) : declenchement manuel depuis l'interface, mais la
 * logique de revalidation de suppression et d'envoi reel est celle
 * qui tournera derriere un futur planificateur.
 */
export async function traiterCampagne(formData: FormData): Promise<void> {
  const campagneId = String(formData.get("campagneId") ?? "");
  if (!campagneId) return;

  const { envoi } = getContainer();
  const campagne = envoi.campagnes.findById(campagneId);
  if (!campagne) return;

  const mailboxId = campagne.mailboxIds[0];
  if (!mailboxId) return;

  const enrollments = envoi.enrollments.listByCampagne(campagneId).filter((e) => e.statut === "en_attente");
  for (const enrollment of enrollments) {
    await envoi.enrollmentService.envoyerProchaineEtape(enrollment, campagne.sequenceId, campagne.clientId, mailboxId);
  }

  revalidatePath("/campagnes");
}
