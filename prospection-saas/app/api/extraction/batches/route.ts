import { NextResponse } from "next/server";
import { runExtraction } from "@/modules/extraction/integration/run-extraction";
import { listExtractionBatches } from "@/modules/extraction/integration/extraction-batch-repository";
import { recordProvenance } from "@/modules/conformite/integration/data-provenance-repository";
import { writeAuditLog } from "@/modules/conformite/integration/audit-log-repository";

export const runtime = "nodejs";

export async function GET() {
  const batches = listExtractionBatches();
  return NextResponse.json(batches);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    organizationDomains?: string[];
    personTitles?: string[];
  };

  try {
    // Composition entre modules faite ici, à la couche route (voir ARBORESCENCE.md) :
    // Extraction n'importe jamais Conformité, c'est la route qui branche le callback.
    const result = await runExtraction({
      queryParams: {
        organizationDomains: body.organizationDomains,
        personTitles: body.personTitles,
      },
      // MVP mono-utilisateur : pas d'authentification branchée, voir PASSATION.md.
      requestedByUserId: "operator",
      onContactInserted: (contact) => {
        recordProvenance(contact.id, contact.source);
        writeAuditLog({
          entityType: "contact",
          entityId: contact.id,
          action: "extracted",
          actor: "system",
          details: { source: contact.source },
        });
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction échouée.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
