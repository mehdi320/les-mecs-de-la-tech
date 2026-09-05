import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { Sequence, SequenceEtape, SequenceStatut } from "@/modules/envoi/domain/entities";
import type { SequenceRepository } from "@/modules/envoi/domain/repositories";

interface SequenceRow {
  id: string;
  client_id: string;
  nom: string;
  statut: SequenceStatut;
}

interface SequenceEtapeRow {
  id: string;
  sequence_id: string;
  ordre: number;
  delai_jours: number;
  sujet: string;
  corps: string;
  condition_branche: string | null;
}

function toSequence(row: SequenceRow): Sequence {
  return { id: row.id, clientId: row.client_id, nom: row.nom, statut: row.statut };
}

function toEtape(row: SequenceEtapeRow): SequenceEtape {
  return {
    id: row.id,
    sequenceId: row.sequence_id,
    ordre: row.ordre,
    delaiJours: row.delai_jours,
    sujet: row.sujet,
    corps: row.corps,
    conditionBranche: row.condition_branche,
  };
}

export class SqliteSequenceRepository implements SequenceRepository {
  constructor(private readonly db: Database) {}

  listByClient(clientId: string): Sequence[] {
    const rows = this.db
      .prepare("SELECT * FROM sequences WHERE client_id = ? ORDER BY created_at DESC")
      .all(clientId) as SequenceRow[];
    return rows.map(toSequence);
  }

  findById(id: string): Sequence | null {
    const row = this.db.prepare("SELECT * FROM sequences WHERE id = ?").get(id) as SequenceRow | undefined;
    return row ? toSequence(row) : null;
  }

  create(input: { clientId: string; nom: string }): Sequence {
    const id = randomUUID();
    this.db.prepare("INSERT INTO sequences (id, client_id, nom) VALUES (?, ?, ?)").run(id, input.clientId, input.nom);
    return this.findById(id)!;
  }

  addEtape(input: { sequenceId: string; ordre: number; delaiJours: number; sujet: string; corps: string }): SequenceEtape {
    const id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO sequence_etapes (id, sequence_id, ordre, delai_jours, sujet, corps) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(id, input.sequenceId, input.ordre, input.delaiJours, input.sujet, input.corps);
    const row = this.db.prepare("SELECT * FROM sequence_etapes WHERE id = ?").get(id) as SequenceEtapeRow;
    return toEtape(row);
  }

  listEtapes(sequenceId: string): SequenceEtape[] {
    const rows = this.db
      .prepare("SELECT * FROM sequence_etapes WHERE sequence_id = ? ORDER BY ordre ASC")
      .all(sequenceId) as SequenceEtapeRow[];
    return rows.map(toEtape);
  }
}
