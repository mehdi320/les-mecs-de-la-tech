import { nowIso } from "@/kernel/db";
import { listExpiredActiveProvenance, markPurged } from "./data-provenance-repository";
import { writeAuditLog } from "./audit-log-repository";

/**
 * Pas de cron réel au MVP : à appeler depuis une route API déclenchée
 * manuellement ou par un scheduler externe (voir app/api/conformite/purge).
 * Ne purge jamais les opt_out_records : la liste de suppression doit survivre
 * pour continuer à honorer le refus, même après la purge du contact d'origine.
 */
export function purgeExpiredContacts(): { purgedCount: number } {
  const expired = listExpiredActiveProvenance(nowIso());

  for (const record of expired) {
    markPurged(record.id);
    writeAuditLog({
      entityType: "contact",
      entityId: record.contactId,
      action: "purged",
      actor: "system",
      details: {},
    });
  }

  return { purgedCount: expired.length };
}
