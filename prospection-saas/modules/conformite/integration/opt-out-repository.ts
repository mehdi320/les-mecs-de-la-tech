import { getDb, nowIso } from "@/kernel/db";
import { newOptOutRecordId } from "@/kernel/ids";
import type { ContactId, OptOutRecordId } from "@/kernel/ids";
import { normalizeEmailOrDomain } from "../domain/opt-out-record";
import type { OptOutRecord, OptOutScope, OptOutSource } from "../domain/opt-out-record";

interface OptOutRow {
  id: string;
  email_or_domain: string;
  contact_id: string | null;
  opted_out_at: string;
  opt_out_source: OptOutSource;
  scope: OptOutScope;
}

function toRecord(row: OptOutRow): OptOutRecord {
  return {
    id: row.id as OptOutRecordId,
    emailOrDomain: row.email_or_domain,
    contactId: row.contact_id as ContactId | null,
    optedOutAt: row.opted_out_at,
    optOutSource: row.opt_out_source,
    scope: row.scope,
  };
}

export function addOptOut(input: {
  emailOrDomain: string;
  contactId: ContactId | null;
  optOutSource: OptOutSource;
  scope: OptOutScope;
}): OptOutRecord {
  const db = getDb();
  const record: OptOutRecord = {
    id: newOptOutRecordId(),
    emailOrDomain: normalizeEmailOrDomain(input.emailOrDomain),
    contactId: input.contactId,
    optedOutAt: nowIso(),
    optOutSource: input.optOutSource,
    scope: input.scope,
  };

  db.prepare(
    `INSERT INTO opt_out_records (id, email_or_domain, contact_id, opted_out_at, opt_out_source, scope)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(record.id, record.emailOrDomain, record.contactId, record.optedOutAt, record.optOutSource, record.scope);

  return record;
}

/** Vérification bloquante avant tout envoi : email exact, ou domaine si un opt-out domain_wide existe. */
export function isOptedOut(email: string): boolean {
  const db = getDb();
  const normalized = normalizeEmailOrDomain(email);
  const domain = normalized.split("@")[1] ?? "";

  const row = db
    .prepare(
      `SELECT 1 FROM opt_out_records
       WHERE (email_or_domain = ? AND scope = 'contact_only')
          OR (email_or_domain = ? AND scope = 'domain_wide')
       LIMIT 1`,
    )
    .get(normalized, domain);

  return Boolean(row);
}

export function listOptOuts(limit = 200): OptOutRecord[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM opt_out_records ORDER BY opted_out_at DESC LIMIT ?")
    .all(limit) as unknown as OptOutRow[];
  return rows.map(toRecord);
}
