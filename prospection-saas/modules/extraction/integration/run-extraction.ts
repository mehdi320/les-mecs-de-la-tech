import type { ExtractionQueryParams } from "../domain/extraction-batch";
import type { Contact } from "../domain/contact";
import { searchPeople, type ApolloPersonResult } from "./apollo-client";
import { upsertCompany } from "./company-repository";
import { insertContact, listContactsByCompany } from "./contact-repository";
import { deduplicateContacts } from "../domain/dedupe";
import { normalizeDomain } from "../domain/company";
import {
  completeExtractionBatch,
  createExtractionBatch,
} from "./extraction-batch-repository";
import type { ContactSource } from "../domain/contact";
import type { ExtractionBatchId } from "@/kernel/ids";

interface ContactDraft {
  fullName: string;
  jobTitle: string | null;
  emailGuessed: string | null;
  phone: null;
  source: ContactSource;
  sourceUrl: string | null;
  extractionBatchId: ExtractionBatchId;
  rawPayload: ApolloPersonResult;
  company: NonNullable<ApolloPersonResult["organization"]>;
}

function personToContactDraft(person: ApolloPersonResult, extractionBatchId: ExtractionBatchId): ContactDraft {
  const organization = person.organization ?? {
    name: "Entreprise inconnue",
    website_url: null,
    primary_domain: null,
    industry: null,
    estimated_num_employees: null,
  };

  return {
    fullName: person.name,
    jobTitle: person.title,
    emailGuessed: person.email,
    phone: null,
    source: "apollo_api",
    sourceUrl: person.linkedin_url,
    extractionBatchId,
    rawPayload: person,
    company: organization,
  };
}

/**
 * Lance une extraction Apollo, dédoublonne contre l'existant de chaque entreprise
 * et insère les nouveaux contacts. `onContactInserted` est appelé pour chaque
 * contact inséré — c'est la route API (app/api/extraction/batches) qui branche
 * ce callback sur le module Conformité pour créer la trace de provenance.
 * L'extraction elle-même n'importe jamais le module Conformité : voir
 * ARBORESCENCE.md sur pourquoi ce n'est pas fait via un event bus process-wide
 * (instrumentation.ts et les route handlers Next.js ne partagent pas forcément
 * la même instance de module en production, on l'a vérifié en testant).
 */
export async function runExtraction(params: {
  queryParams: ExtractionQueryParams;
  requestedByUserId: string;
  onContactInserted?: (contact: Contact) => void;
}): Promise<{ batchId: string; insertedCount: number }> {
  const batch = createExtractionBatch({
    queryParams: params.queryParams,
    provider: "apollo_api",
    requestedByUserId: params.requestedByUserId,
  });

  try {
    const result = await searchPeople(params.queryParams);
    let insertedCount = 0;

    for (const person of result.people) {
      const draft = personToContactDraft(person, batch.id);
      const domain = draft.company.primary_domain ?? draft.company.website_url;
      if (!domain) continue;

      const company = upsertCompany({
        domain: normalizeDomain(domain),
        name: draft.company.name,
        industry: draft.company.industry,
        sizeRange: draft.company.estimated_num_employees
          ? String(draft.company.estimated_num_employees)
          : null,
        country: null,
        linkedinUrl: null,
      });

      const existing = listContactsByCompany(company.id);
      const [deduped] = deduplicateContacts(
        [{ fullName: draft.fullName, emailGuessed: draft.emailGuessed, companyId: company.id }],
        existing,
      );
      if (!deduped) continue;

      const contact = insertContact({
        fullName: draft.fullName,
        companyId: company.id,
        jobTitle: draft.jobTitle,
        emailGuessed: draft.emailGuessed,
        phone: draft.phone,
        source: draft.source,
        sourceUrl: draft.sourceUrl,
        extractionBatchId: draft.extractionBatchId,
        rawPayload: draft.rawPayload,
      });

      params.onContactInserted?.(contact);
      insertedCount += 1;
    }

    completeExtractionBatch(batch.id, { status: "completed", contactCount: insertedCount, cost: 0 });
    return { batchId: batch.id, insertedCount };
  } catch (error) {
    completeExtractionBatch(batch.id, { status: "failed", contactCount: 0, cost: 0 });
    throw error;
  }
}
