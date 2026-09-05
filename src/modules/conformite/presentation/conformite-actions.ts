"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/shared/integration/container";
import { CLIENT_ID_COURANT } from "@/shared/integration/current-client";

export async function ajouterSuppression(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  const { conformite } = getContainer();
  conformite.suppressions.ajouter({
    clientId: CLIENT_ID_COURANT,
    email,
    origine: "import_manuel",
    campagneOrigineId: null,
  });

  revalidatePath("/conformite");
}

export async function genererAuditExport(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  const { conformite } = getContainer();
  conformite.auditExportService.genererExport(CLIENT_ID_COURANT, email, "demo-client");

  revalidatePath("/conformite");
}
