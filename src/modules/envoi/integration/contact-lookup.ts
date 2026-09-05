import type { Database } from "better-sqlite3";
import type { ContactLookup } from "@/modules/envoi/domain/contact-lookup";

export class SqliteContactLookup implements ContactLookup {
  constructor(private readonly db: Database) {}

  getEmail(contactId: string): string | null {
    const row = this.db.prepare("SELECT email FROM contacts WHERE id = ?").get(contactId) as
      | { email: string }
      | undefined;
    return row?.email ?? null;
  }
}
