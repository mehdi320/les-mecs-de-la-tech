import type { ContactId, OptOutRecordId } from "@/kernel/ids";

export type OptOutSource = "unsubscribe_link" | "reply_detected" | "manual_entry" | "imported_list";
export type OptOutScope = "contact_only" | "domain_wide";

export interface OptOutRecord {
  id: OptOutRecordId;
  emailOrDomain: string;
  contactId: ContactId | null;
  optedOutAt: string;
  optOutSource: OptOutSource;
  scope: OptOutScope;
}

/** Normalise un email ou un domaine pour comparaison fiable dans la liste de suppression. */
export function normalizeEmailOrDomain(value: string): string {
  return value.trim().toLowerCase();
}
