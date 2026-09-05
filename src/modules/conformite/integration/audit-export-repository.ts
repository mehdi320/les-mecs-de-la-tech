import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { AuditExport, CampagneAuditEntry, StatutOpposition } from "@/modules/conformite/domain/entities";
import type { AuditExportRepository } from "@/modules/conformite/domain/repositories";

interface AuditExportRow {
  id: string;
  client_id: string;
  contact_email_hash: string;
  campagnes_json: string;
  statut_opposition: StatutOpposition;
  genere_at: string;
  genere_par: string | null;
}

function toAuditExport(row: AuditExportRow): AuditExport {
  return {
    id: row.id,
    clientId: row.client_id,
    contactEmailHash: row.contact_email_hash,
    campagnes: JSON.parse(row.campagnes_json) as CampagneAuditEntry[],
    statutOpposition: row.statut_opposition,
    genereAt: row.genere_at,
    generePar: row.genere_par,
  };
}

export class SqliteAuditExportRepository implements AuditExportRepository {
  constructor(private readonly db: Database) {}

  create(input: {
    clientId: string;
    contactEmailHash: string;
    campagnes: CampagneAuditEntry[];
    statutOpposition: StatutOpposition;
    generePar: string | null;
  }): AuditExport {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO audit_exports (id, client_id, contact_email_hash, campagnes_json, statut_opposition, genere_par)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.clientId, input.contactEmailHash, JSON.stringify(input.campagnes), input.statutOpposition, input.generePar);
    return this.listByClient(input.clientId).find((a) => a.id === id)!;
  }

  listByClient(clientId: string): AuditExport[] {
    const rows = this.db
      .prepare("SELECT * FROM audit_exports WHERE client_id = ? ORDER BY genere_at DESC")
      .all(clientId) as AuditExportRow[];
    return rows.map(toAuditExport);
  }
}
