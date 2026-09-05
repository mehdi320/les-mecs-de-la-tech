import { randomUUID } from "node:crypto";

type Brand<T, B extends string> = T & { readonly __brand: B };

export type CompanyId = Brand<string, "CompanyId">;
export type ExtractionBatchId = Brand<string, "ExtractionBatchId">;
export type ContactId = Brand<string, "ContactId">;
export type VerificationResultId = Brand<string, "VerificationResultId">;
export type DataProvenanceRecordId = Brand<string, "DataProvenanceRecordId">;
export type OptOutRecordId = Brand<string, "OptOutRecordId">;
export type AuditLogEntryId = Brand<string, "AuditLogEntryId">;
export type RetentionPolicyId = Brand<string, "RetentionPolicyId">;

function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export const newCompanyId = (): CompanyId => newId("company") as CompanyId;
export const newExtractionBatchId = (): ExtractionBatchId => newId("batch") as ExtractionBatchId;
export const newContactId = (): ContactId => newId("contact") as ContactId;
export const newVerificationResultId = (): VerificationResultId => newId("verif") as VerificationResultId;
export const newDataProvenanceRecordId = (): DataProvenanceRecordId =>
  newId("provenance") as DataProvenanceRecordId;
export const newOptOutRecordId = (): OptOutRecordId => newId("optout") as OptOutRecordId;
export const newAuditLogEntryId = (): AuditLogEntryId => newId("audit") as AuditLogEntryId;
export const newRetentionPolicyId = (): RetentionPolicyId => newId("retention") as RetentionPolicyId;
