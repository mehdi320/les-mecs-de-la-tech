import type { AuditLogEntryId } from "@/kernel/ids";

export type AuditAction = "extracted" | "verified" | "opted_out" | "purged" | "exported" | "sent";
export type AuditActor = "system" | string;

export interface AuditLogEntry {
  id: AuditLogEntryId;
  entityType: string;
  entityId: string;
  action: AuditAction;
  actor: AuditActor;
  timestamp: string;
  details: Record<string, unknown>;
  exportable: boolean;
}
