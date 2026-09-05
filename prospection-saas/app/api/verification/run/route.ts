import { NextResponse } from "next/server";
import type { ContactId } from "@/kernel/ids";
import { getContact } from "@/modules/extraction/integration/contact-repository";
import { verifyContact } from "@/modules/verification/integration/verify-contact";
import { writeAuditLog } from "@/modules/conformite/integration/audit-log-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { contactId?: string };
  if (!body.contactId) {
    return NextResponse.json({ error: "contactId requis" }, { status: 400 });
  }

  const contact = getContact(body.contactId as ContactId);
  if (!contact) {
    return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });
  }
  if (!contact.emailGuessed) {
    return NextResponse.json({ error: "Ce contact n'a pas d'email deviné à vérifier" }, { status: 422 });
  }

  try {
    // Composition entre modules faite ici, à la couche route — ni Extraction ni
    // Vérification ne s'importent l'un l'autre directement (voir ARBORESCENCE.md).
    const result = await verifyContact({
      contactId: contact.id,
      email: contact.emailGuessed,
      fullName: contact.fullName,
    });

    writeAuditLog({
      entityType: "contact",
      entityId: contact.id,
      action: "verified",
      actor: "system",
      details: { verificationResultId: result.id },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vérification échouée.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
