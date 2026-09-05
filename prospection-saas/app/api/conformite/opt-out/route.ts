import { NextResponse } from "next/server";
import { addOptOut, listOptOuts } from "@/modules/conformite/integration/opt-out-repository";
import { writeAuditLog } from "@/modules/conformite/integration/audit-log-repository";
import type { OptOutScope, OptOutSource } from "@/modules/conformite/domain/opt-out-record";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(listOptOuts());
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    emailOrDomain?: string;
    scope?: OptOutScope;
    optOutSource?: OptOutSource;
  };

  if (!body.emailOrDomain) {
    return NextResponse.json({ error: "emailOrDomain requis" }, { status: 400 });
  }

  const record = addOptOut({
    emailOrDomain: body.emailOrDomain,
    contactId: null,
    scope: body.scope ?? "contact_only",
    optOutSource: body.optOutSource ?? "manual_entry",
  });

  writeAuditLog({
    entityType: "opt_out",
    entityId: record.emailOrDomain,
    action: "opted_out",
    actor: "system",
    details: {},
  });

  return NextResponse.json(record, { status: 201 });
}
