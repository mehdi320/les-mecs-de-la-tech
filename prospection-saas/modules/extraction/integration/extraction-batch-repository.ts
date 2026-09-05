import { getDb, nowIso } from "@/kernel/db";
import { newExtractionBatchId } from "@/kernel/ids";
import type { ExtractionBatchId } from "@/kernel/ids";
import type { ExtractionBatch, ExtractionBatchStatus, ExtractionQueryParams } from "../domain/extraction-batch";

interface ExtractionBatchRow {
  id: string;
  query_params: string;
  provider: ExtractionBatch["provider"];
  provider_run_id: string | null;
  requested_by_user_id: string;
  status: ExtractionBatchStatus;
  started_at: string;
  completed_at: string | null;
  contact_count: number;
  cost: number;
  source_query_origin: string | null;
}

function toBatch(row: ExtractionBatchRow): ExtractionBatch {
  return {
    id: row.id as ExtractionBatchId,
    queryParams: JSON.parse(row.query_params) as ExtractionQueryParams,
    provider: row.provider,
    providerRunId: row.provider_run_id,
    requestedByUserId: row.requested_by_user_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    contactCount: row.contact_count,
    cost: row.cost,
    sourceQueryOrigin: row.source_query_origin,
  };
}

export function createExtractionBatch(input: {
  queryParams: ExtractionQueryParams;
  provider: ExtractionBatch["provider"];
  requestedByUserId: string;
}): ExtractionBatch {
  const db = getDb();
  const batch: ExtractionBatch = {
    id: newExtractionBatchId(),
    queryParams: input.queryParams,
    provider: input.provider,
    providerRunId: null,
    requestedByUserId: input.requestedByUserId,
    status: "pending",
    startedAt: nowIso(),
    completedAt: null,
    contactCount: 0,
    cost: 0,
    sourceQueryOrigin: null,
  };

  db.prepare(
    `INSERT INTO extraction_batches
       (id, query_params, provider, provider_run_id, requested_by_user_id, status, started_at, completed_at, contact_count, cost, source_query_origin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    batch.id,
    JSON.stringify(batch.queryParams),
    batch.provider,
    batch.providerRunId,
    batch.requestedByUserId,
    batch.status,
    batch.startedAt,
    batch.completedAt,
    batch.contactCount,
    batch.cost,
    batch.sourceQueryOrigin,
  );

  return batch;
}

export function completeExtractionBatch(
  id: ExtractionBatchId,
  result: { status: ExtractionBatchStatus; contactCount: number; cost: number },
): void {
  const db = getDb();
  db.prepare(
    `UPDATE extraction_batches SET status = ?, contact_count = ?, cost = ?, completed_at = ? WHERE id = ?`,
  ).run(result.status, result.contactCount, result.cost, nowIso(), id);
}

export function listExtractionBatches(limit = 50): ExtractionBatch[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM extraction_batches ORDER BY started_at DESC LIMIT ?")
    .all(limit) as unknown as ExtractionBatchRow[];
  return rows.map(toBatch);
}
