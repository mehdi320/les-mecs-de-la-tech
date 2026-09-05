import type { Database } from "better-sqlite3";
import type { CampagneAuditEntry } from "@/modules/conformite/domain/entities";
import type { CampagneHistoriqueLookup } from "@/modules/conformite/domain/ports";

interface HistoriqueRow {
  campagne_id: string;
  horodatage: string;
  statut_smtp: string;
}

export class SqliteCampagneHistoriqueLookup implements CampagneHistoriqueLookup {
  constructor(private readonly db: Database) {}

  obtenirHistorique(clientId: string, email: string): CampagneAuditEntry[] {
    const rows = this.db
      .prepare(
        `SELECT c.id AS campagne_id, ev.horodatage AS horodatage, ev.statut_smtp AS statut_smtp
         FROM contacts co
         JOIN enrollments en ON en.contact_id = co.id
         JOIN campagnes c ON c.id = en.campagne_id
         JOIN envoi_evenements ev ON ev.enrollment_id = en.id
         WHERE co.client_id = ? AND co.email = ?
         ORDER BY ev.horodatage ASC`,
      )
      .all(clientId, email) as HistoriqueRow[];

    return rows.map((row) => ({
      campagneId: row.campagne_id,
      horodatage: row.horodatage,
      statut: row.statut_smtp,
    }));
  }
}
