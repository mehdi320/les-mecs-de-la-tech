import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { OrigineSuppression, SuppressionEntree } from "@/modules/conformite/domain/entities";
import type { SuppressionRepository } from "@/modules/conformite/domain/repositories";

interface SuppressionRow {
  id: string;
  client_id: string;
  email: string;
  origine: OrigineSuppression;
  campagne_origine_id: string | null;
  horodatage: string;
}

function toEntree(row: SuppressionRow): SuppressionEntree {
  return {
    id: row.id,
    clientId: row.client_id,
    email: row.email,
    origine: row.origine,
    campagneOrigineId: row.campagne_origine_id,
    horodatage: row.horodatage,
  };
}

export class SqliteSuppressionRepository implements SuppressionRepository {
  constructor(private readonly db: Database) {}

  ajouter(input: { clientId: string; email: string; origine: OrigineSuppression; campagneOrigineId: string | null }): SuppressionEntree {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO suppression_entrees (id, client_id, email, origine, campagne_origine_id)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (client_id, email) DO NOTHING`,
      )
      .run(id, input.clientId, input.email, input.origine, input.campagneOrigineId);

    const row = this.db
      .prepare("SELECT * FROM suppression_entrees WHERE client_id = ? AND email = ?")
      .get(input.clientId, input.email) as SuppressionRow;
    return toEntree(row);
  }

  estPresent(clientId: string, email: string): boolean {
    const row = this.db
      .prepare("SELECT 1 FROM suppression_entrees WHERE client_id = ? AND email = ?")
      .get(clientId, email);
    return row !== undefined;
  }

  listByClient(clientId: string): SuppressionEntree[] {
    const rows = this.db
      .prepare("SELECT * FROM suppression_entrees WHERE client_id = ? ORDER BY horodatage DESC")
      .all(clientId) as SuppressionRow[];
    return rows.map(toEntree);
  }
}
