import { NextResponse } from "next/server";
import { listAuditLog } from "@/modules/conformite/integration/audit-log-repository";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(listAuditLog());
}
