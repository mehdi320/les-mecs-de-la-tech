import { getDb, nowIso } from "@/kernel/db";
import { newDataProvenanceRecordId } from "@/kernel/ids";
import type { ContactId, DataProvenanceRecordId } from "@/kernel/ids";
import { computeRetentionDeadline } from "../domain/retention-policy";
import type { DataProvenanceRecord, PurgeStatus } from "../domain/data-provenance-record";

interface ProvenanceRow {
  id: string;
  contact_id: string;
  source_cited: string;
  recorded_at: string;
  retention_deadline: string;
  purge_status: PurgeStatus;
  purged_at: string | null;
}

function toRecord(row: ProvenanceRow): DataProvenanceRecord {
  return {
    id: row.id as DataProvenanceRecordId,
    contactId: row.contact_id as ContactId,
    sourceCited: row.source_cited,
    recordedAt: row.recorded_at,
    retentionDeadline: row.retention_deadline,
    purgeStatus: row.purge_status,
    purgedAt: row.purged_at,
  };
}

export function recordProvenance(contactId: ContactId, sourceCited: string): DataProvenanceRecord {
  const db = getDb();
  const recordedAt = nowIso();
  const record: DataProvenanceRecord = {
    id: newDataProvenanceRecordId(),
    contactId,
    sourceCited,
    recordedAt,
    retentionDeadline: computeRetentionDeadline(recordedAt),
    purgeStatus: "active",
    purgedAt: null,
  };

  db.prepare(
    `INSERT INTO data_provenance_records (id, contact_id, source_cited, recorded_at, retention_deadline, purge_status, purged_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(record.id, record.contactId, record.sourceCited, record.recordedAt, record.retentionDeadline, record.purgeStatus, record.purgedAt);

  return record;
}

export function listExpiredActiveProvenance(nowIsoValue: string): DataProvenanceRecord[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM data_provenance_records WHERE purge_status = 'active' AND retention_deadline <= ?")
    .all(nowIsoValue) as unknown as ProvenanceRow[];
  return rows.map(toRecord);
}

export function markPurged(id: DataProvenanceRecordId): void {
  const db = getDb();
  db.prepare("UPDATE data_provenance_records SET purge_status = 'purged', purged_at = ? WHERE id = ?").run(
    nowIso(),
    id,
  );
}
