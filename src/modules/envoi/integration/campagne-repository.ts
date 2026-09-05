import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { Campagne, CampagneStatut } from "@/modules/envoi/domain/entities";
import type { CampagneRepository } from "@/modules/envoi/domain/repositories";
import { supprimerSiPossible } from "@/shared/integration/delete-guard";

interface CampagneRow {
  id: string;
  client_id: string;
  sequence_id: string;
  liste_id: string;
  mailbox_ids_json: string;
  fuseau_horaire: string;
  fenetre_envoi_debut: string;
  fenetre_envoi_fin: string;
  seuil_score_risque_min: number | null;
  statut: CampagneStatut;
}

function toCampagne(row: CampagneRow): Campagne {
  return {
    id: row.id,
    clientId: row.client_id,
    sequenceId: row.sequence_id,
    listeId: row.liste_id,
    mailboxIds: JSON.parse(row.mailbox_ids_json) as string[],
    fuseauHoraire: row.fuseau_horaire,
    fenetreEnvoiDebut: row.fenetre_envoi_debut,
    fenetreEnvoiFin: row.fenetre_envoi_fin,
    seuilScoreRisqueMin: row.seuil_score_risque_min,
    statut: row.statut,
  };
}

export class SqliteCampagneRepository implements CampagneRepository {
  constructor(private readonly db: Database) {}

  listByClient(clientId: string): Campagne[] {
    const rows = this.db
      .prepare("SELECT * FROM campagnes WHERE client_id = ? ORDER BY created_at DESC")
      .all(clientId) as CampagneRow[];
    return rows.map(toCampagne);
  }

  findById(id: string): Campagne | null {
    const row = this.db.prepare("SELECT * FROM campagnes WHERE id = ?").get(id) as CampagneRow | undefined;
    return row ? toCampagne(row) : null;
  }

  create(input: {
    clientId: string;
    sequenceId: string;
    listeId: string;
    mailboxIds: string[];
    fuseauHoraire: string;
    fenetreEnvoiDebut: string;
    fenetreEnvoiFin: string;
    seuilScoreRisqueMin: number | null;
  }): Campagne {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO campagnes
          (id, client_id, sequence_id, liste_id, mailbox_ids_json, fuseau_horaire, fenetre_envoi_debut, fenetre_envoi_fin, seuil_score_risque_min)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.clientId,
        input.sequenceId,
        input.listeId,
        JSON.stringify(input.mailboxIds),
        input.fuseauHoraire,
        input.fenetreEnvoiDebut,
        input.fenetreEnvoiFin,
        input.seuilScoreRisqueMin,
      );
    return this.findById(id)!;
  }

  delete(id: string): boolean {
    return supprimerSiPossible(() => {
      this.db.prepare("DELETE FROM campagnes WHERE id = ?").run(id);
    });
  }
}
