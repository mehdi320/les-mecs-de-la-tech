import { NextResponse } from "next/server";
import { listContacts } from "@/modules/extraction/integration/contact-repository";

export const runtime = "nodejs";

export async function GET() {
  const contacts = listContacts();
  return NextResponse.json(contacts);
}
