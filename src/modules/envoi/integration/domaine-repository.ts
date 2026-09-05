import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { Domaine, DomaineAuthStatut } from "@/modules/envoi/domain/entities";
import type { DomaineRepository } from "@/modules/envoi/domain/repositories";

interface DomaineRow {
  id: string;
  client_id: string;
  nom_domaine: string;
  spf_statut: DomaineAuthStatut;
  dkim_statut: DomaineAuthStatut;
  dmarc_statut: DomaineAuthStatut;
  dernier_check_at: string | null;
}

function toDomaine(row: DomaineRow): Domaine {
  return {
    id: row.id,
    clientId: row.client_id,
    nomDomaine: row.nom_domaine,
    spfStatut: row.spf_statut,
    dkimStatut: row.dkim_statut,
    dmarcStatut: row.dmarc_statut,
    dernierCheckAt: row.dernier_check_at,
  };
}

export class SqliteDomaineRepository implements DomaineRepository {
  constructor(private readonly db: Database) {}

  listByClient(clientId: string): Domaine[] {
    const rows = this.db
      .prepare("SELECT * FROM domaines WHERE client_id = ? ORDER BY created_at DESC")
      .all(clientId) as DomaineRow[];
    return rows.map(toDomaine);
  }

  findById(id: string): Domaine | null {
    const row = this.db.prepare("SELECT * FROM domaines WHERE id = ?").get(id) as DomaineRow | undefined;
    return row ? toDomaine(row) : null;
  }

  create(input: { clientId: string; nomDomaine: string }): Domaine {
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO domaines (id, client_id, nom_domaine) VALUES (?, ?, ?)")
      .run(id, input.clientId, input.nomDomaine);
    return this.findById(id)!;
  }

  setAuthStatuts(id: string, statuts: { spf: DomaineAuthStatut; dkim: DomaineAuthStatut; dmarc: DomaineAuthStatut }): void {
    this.db
      .prepare(
        "UPDATE domaines SET spf_statut = ?, dkim_statut = ?, dmarc_statut = ?, dernier_check_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      )
      .run(statuts.spf, statuts.dkim, statuts.dmarc, id);
  }
}
