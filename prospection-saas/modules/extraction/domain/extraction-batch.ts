import type { ExtractionBatchId } from "@/kernel/ids";

export type ExtractionProvider = "apollo_api" | "apify_actor" | "manual_upload";
export type ExtractionBatchStatus = "pending" | "running" | "completed" | "failed";

export interface ExtractionQueryParams {
  organizationDomains?: string[];
  personTitles?: string[];
  personLocations?: string[];
  perPage?: number;
}

export interface ExtractionBatch {
  id: ExtractionBatchId;
  queryParams: ExtractionQueryParams;
  provider: ExtractionProvider;
  providerRunId: string | null;
  requestedByUserId: string;
  status: ExtractionBatchStatus;
  startedAt: string;
  completedAt: string | null;
  contactCount: number;
  cost: number;
  /** Renseigné si ce batch vient d'une proposition du module Boucle (V2, non branché au MVP). */
  sourceQueryOrigin: string | null;
}
