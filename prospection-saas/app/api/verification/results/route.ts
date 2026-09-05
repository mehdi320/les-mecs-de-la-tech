import { NextResponse } from "next/server";
import { listVerificationResults } from "@/modules/verification/integration/verification-result-repository";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(listVerificationResults());
}
