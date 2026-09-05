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

  getDonneesAdditionnelles(contactId: string): Record<string, unknown> {
    const row = this.db
      .prepare("SELECT donnees_additionnelles_json, email FROM contacts WHERE id = ?")
      .get(contactId) as { donnees_additionnelles_json: string; email: string } | undefined;
    if (!row) return {};
    const donnees = JSON.parse(row.donnees_additionnelles_json) as Record<string, unknown>;
    return { ...donnees, email: row.email };
  }
}
