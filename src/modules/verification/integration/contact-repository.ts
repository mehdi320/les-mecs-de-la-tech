import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { Contact } from "@/modules/verification/domain/entities";
import type { ContactRepository } from "@/modules/verification/domain/repositories";

interface ContactRow {
  id: string;
  client_id: string;
  liste_id: string;
  email: string;
  donnees_additionnelles_json: string;
}

function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    clientId: row.client_id,
    listeId: row.liste_id,
    email: row.email,
    donneesAdditionnelles: JSON.parse(row.donnees_additionnelles_json) as Record<string, unknown>,
  };
}

export class SqliteContactRepository implements ContactRepository {
  constructor(private readonly db: Database) {}

  listByListe(listeId: string): Contact[] {
    const rows = this.db.prepare("SELECT * FROM contacts WHERE liste_id = ?").all(listeId) as ContactRow[];
    return rows.map(toContact);
  }

  findById(id: string): Contact | null {
    const row = this.db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as ContactRow | undefined;
    return row ? toContact(row) : null;
  }

  createMany(input: {
    clientId: string;
    listeId: string;
    contacts: { email: string; donneesAdditionnelles: Record<string, unknown> }[];
  }): Contact[] {
    const insert = this.db.prepare(
      `INSERT INTO contacts (id, client_id, liste_id, email, donnees_additionnelles_json)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (liste_id, email) DO NOTHING`,
    );

    const ids: string[] = [];
    const inserer = this.db.transaction((contacts: typeof input.contacts) => {
      for (const contact of contacts) {
        const id = randomUUID();
        const info = insert.run(id, input.clientId, input.listeId, contact.email, JSON.stringify(contact.donneesAdditionnelles));
        if (info.changes > 0) ids.push(id);
      }
    });
    inserer(input.contacts);

    return this.listByListe(input.listeId).filter((c) => ids.includes(c.id));
  }
}
