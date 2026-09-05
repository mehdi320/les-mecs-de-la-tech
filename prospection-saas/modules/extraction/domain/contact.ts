import type { CompanyId, ContactId, ExtractionBatchId } from "@/kernel/ids";

export type ContactSource =
  | "linkedin_public"
  | "apollo_api"
  | "apify_actor"
  | "company_website"
  | "directory";

export interface Contact {
  id: ContactId;
  fullName: string;
  companyId: CompanyId;
  jobTitle: string | null;
  emailGuessed: string | null;
  phone: string | null;
  source: ContactSource;
  sourceUrl: string | null;
  extractionBatchId: ExtractionBatchId;
  extractedAt: string;
  /** Payload brut du fournisseur, conservé tel quel pour l'audit. */
  rawPayload: unknown;
}
