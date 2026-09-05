import type { ContactId, DataProvenanceRecordId } from "@/kernel/ids";

export type PurgeStatus = "active" | "scheduled" | "purged";

/**
 * Version US du LegalBasisRecord du SPEC.md initial (pensé RGPD) : pas de
 * "base légale" à documenter au sens RGPD, mais on garde la traçabilité de
 * la source et une échéance de purge — bonne pratique indépendamment du cadre
 * légal, et ça reste la fondation si le produit s'ouvre un jour à l'Europe.
 * Voir PASSATION.md, section pivot marché US.
 */
export interface DataProvenanceRecord {
  id: DataProvenanceRecordId;
  contactId: ContactId;
  sourceCited: string;
  recordedAt: string;
  retentionDeadline: string;
  purgeStatus: PurgeStatus;
  purgedAt: string | null;
}
