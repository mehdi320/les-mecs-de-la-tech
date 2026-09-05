import { getDb, nowIso } from "@/kernel/db";
import { newAuditLogEntryId } from "@/kernel/ids";
import type { AuditLogEntryId } from "@/kernel/ids";
import type { AuditAction, AuditActor, AuditLogEntry } from "../domain/audit-log-entry";

interface AuditRow {
  id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  actor: string;
  timestamp: string;
  details: string;
  exportable: number;
}

function toEntry(row: AuditRow): AuditLogEntry {
  return {
    id: row.id as AuditLogEntryId,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    actor: row.actor,
    timestamp: row.timestamp,
    details: JSON.parse(row.details),
    exportable: row.exportable === 1,
  };
}

export function writeAuditLog(input: {
  entityType: string;
  entityId: string;
  action: AuditAction;
  actor: AuditActor;
  details: Record<string, unknown>;
  exportable?: boolean;
}): AuditLogEntry {
  const db = getDb();
  const entry: AuditLogEntry = {
    id: newAuditLogEntryId(),
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actor: input.actor,
    timestamp: nowIso(),
    details: input.details,
    exportable: input.exportable ?? true,
  };

  db.prepare(
    `INSERT INTO audit_log_entries (id, entity_type, entity_id, action, actor, timestamp, details, exportable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    entry.id,
    entry.entityType,
    entry.entityId,
    entry.action,
    entry.actor,
    entry.timestamp,
    JSON.stringify(entry.details),
    entry.exportable ? 1 : 0,
  );

  return entry;
}

export function listAuditLog(limit = 200): AuditLogEntry[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM audit_log_entries ORDER BY timestamp DESC LIMIT ?")
    .all(limit) as unknown as AuditRow[];
  return rows.map(toEntry);
}
