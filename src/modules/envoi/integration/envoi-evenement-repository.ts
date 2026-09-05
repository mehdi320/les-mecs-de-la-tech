import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { EnvoiEvenement } from "@/modules/envoi/domain/entities";
import type { EnvoiEvenementRepository } from "@/modules/envoi/domain/repositories";

interface EnvoiEvenementRow {
  id: string;
  enrollment_id: string;
  mailbox_id: string;
  horodatage: string;
  statut_smtp: string;
  message_id: string | null;
}

function toEvenement(row: EnvoiEvenementRow): EnvoiEvenement {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    mailboxId: row.mailbox_id,
    horodatage: row.horodatage,
    statutSmtp: row.statut_smtp,
    messageId: row.message_id,
  };
}

export class SqliteEnvoiEvenementRepository implements EnvoiEvenementRepository {
  constructor(private readonly db: Database) {}

  create(input: { enrollmentId: string; mailboxId: string; statutSmtp: string; messageId: string | null }): EnvoiEvenement {
    const id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO envoi_evenements (id, enrollment_id, mailbox_id, statut_smtp, message_id) VALUES (?, ?, ?, ?, ?)",
      )
      .run(id, input.enrollmentId, input.mailboxId, input.statutSmtp, input.messageId);
    return this.listByEnrollment(input.enrollmentId).find((e) => e.id === id)!;
  }

  listByEnrollment(enrollmentId: string): EnvoiEvenement[] {
    const rows = this.db
      .prepare("SELECT * FROM envoi_evenements WHERE enrollment_id = ? ORDER BY horodatage ASC")
      .all(enrollmentId) as EnvoiEvenementRow[];
    return rows.map(toEvenement);
  }
}
