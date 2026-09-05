export type RetentionScope = "contacts_non_convertis" | "tous_les_contacts";

export interface RetentionPolicy {
  id: string;
  tenantId: string;
  defaultRetentionDays: number;
  appliesTo: RetentionScope;
}

/**
 * Pas de durée légale imposée pour le marché US visé (contrairement au RGPD où
 * le principe de limitation de la conservation s'applique). 180 jours est un
 * défaut opérationnel raisonnable, pas une exigence réglementaire — à ajuster
 * librement selon l'usage réel du produit.
 */
export const DEFAULT_RETENTION_DAYS = 180;

export function computeRetentionDeadline(recordedAtIso: string, retentionDays = DEFAULT_RETENTION_DAYS): string {
  const recordedAt = new Date(recordedAtIso);
  const deadline = new Date(recordedAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  return deadline.toISOString();
}
