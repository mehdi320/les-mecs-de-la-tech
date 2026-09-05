import { getDb, nowIso } from "@/kernel/db";
import { newContactId } from "@/kernel/ids";
import type { CompanyId, ContactId, ExtractionBatchId } from "@/kernel/ids";
import type { Contact } from "../domain/contact";

interface ContactRow {
  id: string;
  full_name: string;
  company_id: string;
  job_title: string | null;
  email_guessed: string | null;
  phone: string | null;
  source: Contact["source"];
  source_url: string | null;
  extraction_batch_id: string;
  extracted_at: string;
  raw_payload: string;
}

function toContact(row: ContactRow): Contact {
  return {
    id: row.id as ContactId,
    fullName: row.full_name,
    companyId: row.company_id as CompanyId,
    jobTitle: row.job_title,
    emailGuessed: row.email_guessed,
    phone: row.phone,
    source: row.source,
    sourceUrl: row.source_url,
    extractionBatchId: row.extraction_batch_id as ExtractionBatchId,
    extractedAt: row.extracted_at,
    rawPayload: JSON.parse(row.raw_payload),
  };
}

export function insertContact(input: Omit<Contact, "id" | "extractedAt">): Contact {
  const db = getDb();
  const contact: Contact = { ...input, id: newContactId(), extractedAt: nowIso() };

  db.prepare(
    `INSERT INTO contacts
       (id, full_name, company_id, job_title, email_guessed, phone, source, source_url, extraction_batch_id, extracted_at, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    contact.id,
    contact.fullName,
    contact.companyId,
    contact.jobTitle,
    contact.emailGuessed,
    contact.phone,
    contact.source,
    contact.sourceUrl,
    contact.extractionBatchId,
    contact.extractedAt,
    JSON.stringify(contact.rawPayload),
  );

  return contact;
}

export function listContactsByCompany(companyId: CompanyId): Contact[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM contacts WHERE company_id = ?").all(companyId) as unknown as ContactRow[];
  return rows.map(toContact);
}

export function listContacts(limit = 100): Contact[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM contacts ORDER BY extracted_at DESC LIMIT ?")
    .all(limit) as unknown as ContactRow[];
  return rows.map(toContact);
}

export function getContact(id: ContactId): Contact | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as ContactRow | undefined;
  return row ? toContact(row) : null;
}
