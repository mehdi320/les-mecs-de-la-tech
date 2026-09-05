import { NextResponse } from "next/server";
import { purgeExpiredContacts } from "@/modules/conformite/integration/purge-scheduler";

export const runtime = "nodejs";

/** Pas de cron au MVP : déclenché manuellement ou par un scheduler externe. */
export async function POST() {
  const result = purgeExpiredContacts();
  return NextResponse.json(result);
}
