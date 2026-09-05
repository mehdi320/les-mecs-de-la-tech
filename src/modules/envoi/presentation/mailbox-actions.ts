"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";
import { chiffrer } from "@/shared/integration/secrets";
import { verifierConnexionSmtp } from "@/modules/envoi/integration/connectors/smtp-generic-connector";

export async function connecterMailboxSmtp(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const host = String(formData.get("host") ?? "");
  const port = Number(formData.get("port") ?? 587);
  const secure = formData.get("secure") === "on";
  const user = String(formData.get("user") ?? "");
  const pass = String(formData.get("pass") ?? "");

  const { envoi } = getContainer();
  const mailbox = envoi.mailboxes.create({
    clientId: CLIENT_ID_COURANT,
    provider: "smtp_generique",
    email,
    quotaJour: 100,
  });

  const verification = await verifierConnexionSmtp({ host, port, secure, user, pass });
  const ref = chiffrer(JSON.stringify({ host, port, secure, user, pass }));
  envoi.mailboxes.setSmtpConfigRef(mailbox.id, ref, verification.ok ? "connecte" : "erreur");

  revalidatePath("/mailboxes");
}

export async function supprimerMailbox(formData: FormData): Promise<boolean> {
  const mailboxId = String(formData.get("mailboxId") ?? "");
  if (!mailboxId) return false;

  const { envoi } = getContainer();
  const ok = envoi.mailboxes.delete(mailboxId);
  revalidatePath("/mailboxes");
  return ok;
}
