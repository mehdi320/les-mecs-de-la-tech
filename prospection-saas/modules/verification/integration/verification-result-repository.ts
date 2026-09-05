import { getDb } from "@/kernel/db";
import { newVerificationResultId } from "@/kernel/ids";
import type { ContactId, VerificationResultId } from "@/kernel/ids";
import type { VerdictLabel, VerificationResult, VerificationSignals } from "../domain/verification-result";

interface VerificationResultRow {
  id: string;
  contact_id: string;
  email_checked: string;
  risk_score: number;
  verdict_label: VerdictLabel;
  signals: string;
  primary_provider: VerificationResult["primaryProvider"];
  secondary_provider: VerificationResult["secondaryProvider"];
  explanation_text: string;
  verified_at: string;
  verification_cost: number;
}

function toResult(row: VerificationResultRow): VerificationResult {
  return {
    id: row.id as VerificationResultId,
    contactId: row.contact_id as ContactId,
    emailChecked: row.email_checked,
    riskScore: row.risk_score,
    verdictLabel: row.verdict_label,
    signals: JSON.parse(row.signals) as VerificationSignals,
    primaryProvider: row.primary_provider,
    secondaryProvider: row.secondary_provider,
    explanationText: row.explanation_text,
    verifiedAt: row.verified_at,
    verificationCost: row.verification_cost,
  };
}

export function insertVerificationResult(input: Omit<VerificationResult, "id">): VerificationResult {
  const db = getDb();
  const result: VerificationResult = { ...input, id: newVerificationResultId() };

  db.prepare(
    `INSERT INTO verification_results
       (id, contact_id, email_checked, risk_score, verdict_label, signals, primary_provider, secondary_provider, explanation_text, verified_at, verification_cost)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    result.id,
    result.contactId,
    result.emailChecked,
    result.riskScore,
    result.verdictLabel,
    JSON.stringify(result.signals),
    result.primaryProvider,
    result.secondaryProvider,
    result.explanationText,
    result.verifiedAt,
    result.verificationCost,
  );

  return result;
}

export function getLatestVerificationForContact(contactId: ContactId): VerificationResult | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM verification_results WHERE contact_id = ? ORDER BY verified_at DESC LIMIT 1")
    .get(contactId) as VerificationResultRow | undefined;
  return row ? toResult(row) : null;
}

export function listVerificationResults(limit = 100): VerificationResult[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM verification_results ORDER BY verified_at DESC LIMIT ?")
    .all(limit) as unknown as VerificationResultRow[];
  return rows.map(toResult);
}
