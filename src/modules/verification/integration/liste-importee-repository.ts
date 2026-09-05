import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { ListeImportee, StatutVerificationListe } from "@/modules/verification/domain/entities";
import type { ListeImporteeRepository } from "@/modules/verification/domain/repositories";

interface ListeRow {
  id: string;
  client_id: string;
  nom: string;
  source_declaree: string | null;
  nb_contacts: number;
  statut_verification: StatutVerificationListe;
}

function toListe(row: ListeRow): ListeImportee {
  return {
    id: row.id,
    clientId: row.client_id,
    nom: row.nom,
    sourceDeclaree: row.source_declaree,
    nbContacts: row.nb_contacts,
    statutVerification: row.statut_verification,
  };
}

export class SqliteListeImporteeRepository implements ListeImporteeRepository {
  constructor(private readonly db: Database) {}

  listByClient(clientId: string): ListeImportee[] {
    const rows = this.db
      .prepare("SELECT * FROM listes_importees WHERE client_id = ? ORDER BY created_at DESC")
      .all(clientId) as ListeRow[];
    return rows.map(toListe);
  }

  findById(id: string): ListeImportee | null {
    const row = this.db.prepare("SELECT * FROM listes_importees WHERE id = ?").get(id) as ListeRow | undefined;
    return row ? toListe(row) : null;
  }

  create(input: { clientId: string; nom: string; sourceDeclaree: string | null }): ListeImportee {
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO listes_importees (id, client_id, nom, source_declaree) VALUES (?, ?, ?, ?)")
      .run(id, input.clientId, input.nom, input.sourceDeclaree);
    return this.findById(id)!;
  }

  updateStatut(id: string, statut: StatutVerificationListe, nbContacts?: number): void {
    if (nbContacts === undefined) {
      this.db
        .prepare("UPDATE listes_importees SET statut_verification = ?, updated_at = datetime('now') WHERE id = ?")
        .run(statut, id);
    } else {
      this.db
        .prepare(
          "UPDATE listes_importees SET statut_verification = ?, nb_contacts = ?, updated_at = datetime('now') WHERE id = ?",
        )
        .run(statut, nbContacts, id);
    }
  }
}
