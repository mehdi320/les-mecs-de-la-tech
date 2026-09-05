import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { FacteurScore, ResultatSmtp, VerificationResultat } from "@/modules/verification/domain/entities";
import type { VerificationResultatRepository } from "@/modules/verification/domain/repositories";

interface ResultatRow {
  id: string;
  contact_id: string;
  resultat_smtp: ResultatSmtp;
  mx_valide: number;
  age_domaine_jours: number | null;
  pattern_domaine_suspect: number;
  score_risque: number;
  score_explication_json: string;
}

function toResultat(row: ResultatRow): VerificationResultat {
  return {
    id: row.id,
    contactId: row.contact_id,
    resultatSmtp: row.resultat_smtp,
    mxValide: row.mx_valide === 1,
    ageDomaineJours: row.age_domaine_jours,
    patternDomaineSuspect: row.pattern_domaine_suspect === 1,
    scoreRisque: row.score_risque,
    scoreExplication: JSON.parse(row.score_explication_json) as FacteurScore[],
  };
}

export class SqliteVerificationResultatRepository implements VerificationResultatRepository {
  constructor(private readonly db: Database) {}

  findByContact(contactId: string): VerificationResultat | null {
    const row = this.db.prepare("SELECT * FROM verification_resultats WHERE contact_id = ?").get(contactId) as
      | ResultatRow
      | undefined;
    return row ? toResultat(row) : null;
  }

  upsert(input: Omit<VerificationResultat, "id">): VerificationResultat {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO verification_resultats
          (id, contact_id, resultat_smtp, mx_valide, age_domaine_jours, pattern_domaine_suspect, score_risque, score_explication_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (contact_id) DO UPDATE SET
           resultat_smtp = excluded.resultat_smtp,
           mx_valide = excluded.mx_valide,
           age_domaine_jours = excluded.age_domaine_jours,
           pattern_domaine_suspect = excluded.pattern_domaine_suspect,
           score_risque = excluded.score_risque,
           score_explication_json = excluded.score_explication_json`,
      )
      .run(
        id,
        input.contactId,
        input.resultatSmtp,
        input.mxValide ? 1 : 0,
        input.ageDomaineJours,
        input.patternDomaineSuspect ? 1 : 0,
        input.scoreRisque,
        JSON.stringify(input.scoreExplication),
      );
    return this.findByContact(input.contactId)!;
  }
}
