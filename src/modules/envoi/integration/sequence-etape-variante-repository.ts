import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { Longueur, SequenceEtapeVariante, StatutVariante, Structure, Tone } from "@/modules/envoi/domain/personnalisation/entities";
import type { SequenceEtapeVarianteRepository } from "@/modules/envoi/domain/personnalisation/repositories";

interface VarianteRow {
  id: string;
  sequence_etape_id: string;
  nom: string;
  sujet: string;
  corps: string;
  structure: Structure;
  longueur: Longueur;
  tone: Tone;
  champs_personnalisation_requis_json: string;
  statut: StatutVariante;
}

function toVariante(row: VarianteRow): SequenceEtapeVariante {
  return {
    id: row.id,
    sequenceEtapeId: row.sequence_etape_id,
    nom: row.nom,
    sujet: row.sujet,
    corps: row.corps,
    structure: row.structure,
    longueur: row.longueur,
    tone: row.tone,
    champsPersonnalisationRequis: JSON.parse(row.champs_personnalisation_requis_json) as string[],
    statut: row.statut,
  };
}

export class SqliteSequenceEtapeVarianteRepository implements SequenceEtapeVarianteRepository {
  constructor(private readonly db: Database) {}

  listBySequenceEtape(sequenceEtapeId: string): SequenceEtapeVariante[] {
    const rows = this.db
      .prepare("SELECT * FROM sequence_etape_variantes WHERE sequence_etape_id = ? ORDER BY nom ASC")
      .all(sequenceEtapeId) as VarianteRow[];
    return rows.map(toVariante);
  }

  findById(id: string): SequenceEtapeVariante | null {
    const row = this.db.prepare("SELECT * FROM sequence_etape_variantes WHERE id = ?").get(id) as VarianteRow | undefined;
    return row ? toVariante(row) : null;
  }

  create(input: {
    sequenceEtapeId: string;
    nom: string;
    sujet: string;
    corps: string;
    structure: Structure;
    longueur: Longueur;
    tone: Tone;
    champsPersonnalisationRequis: string[];
  }): SequenceEtapeVariante {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO sequence_etape_variantes
          (id, sequence_etape_id, nom, sujet, corps, structure, longueur, tone, champs_personnalisation_requis_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.sequenceEtapeId,
        input.nom,
        input.sujet,
        input.corps,
        input.structure,
        input.longueur,
        input.tone,
        JSON.stringify(input.champsPersonnalisationRequis),
      );
    return this.findById(id)!;
  }

  updateStatut(id: string, statut: StatutVariante): void {
    this.db.prepare("UPDATE sequence_etape_variantes SET statut = ? WHERE id = ?").run(statut, id);
  }
}
