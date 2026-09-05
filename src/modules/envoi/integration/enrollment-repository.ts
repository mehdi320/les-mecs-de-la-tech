import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { Enrollment, EnrollmentStatut } from "@/modules/envoi/domain/entities";
import type { EnrollmentRepository } from "@/modules/envoi/domain/repositories";

interface EnrollmentRow {
  id: string;
  campagne_id: string;
  contact_id: string;
  etape_courante: number;
  statut: EnrollmentStatut;
}

function toEnrollment(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    campagneId: row.campagne_id,
    contactId: row.contact_id,
    etapeCourante: row.etape_courante,
    statut: row.statut,
  };
}

export class SqliteEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly db: Database) {}

  listByCampagne(campagneId: string): Enrollment[] {
    const rows = this.db
      .prepare("SELECT * FROM enrollments WHERE campagne_id = ? ORDER BY created_at ASC")
      .all(campagneId) as EnrollmentRow[];
    return rows.map(toEnrollment);
  }

  findById(id: string): Enrollment | null {
    const row = this.db.prepare("SELECT * FROM enrollments WHERE id = ?").get(id) as EnrollmentRow | undefined;
    return row ? toEnrollment(row) : null;
  }

  create(input: { campagneId: string; contactId: string }): Enrollment {
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO enrollments (id, campagne_id, contact_id) VALUES (?, ?, ?)")
      .run(id, input.campagneId, input.contactId);
    return this.findById(id)!;
  }

  updateStatut(id: string, statut: EnrollmentStatut, etapeCourante?: number): Enrollment {
    if (etapeCourante === undefined) {
      this.db
        .prepare("UPDATE enrollments SET statut = ?, updated_at = datetime('now') WHERE id = ?")
        .run(statut, id);
    } else {
      this.db
        .prepare(
          "UPDATE enrollments SET statut = ?, etape_courante = ?, updated_at = datetime('now') WHERE id = ?",
        )
        .run(statut, etapeCourante, id);
    }
    return this.findById(id)!;
  }
}
