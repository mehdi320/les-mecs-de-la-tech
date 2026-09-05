import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { Client, ClientRepository } from "@/shared/domain/client";

interface ClientRow {
  id: string;
  nom: string;
  plan_id: string;
  dpa_signed_at: string | null;
  dpa_version: string | null;
  created_at: string;
  updated_at: string;
}

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    nom: row.nom,
    planId: row.plan_id,
    dpaSignedAt: row.dpa_signed_at,
    dpaVersion: row.dpa_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteClientRepository implements ClientRepository {
  constructor(private readonly db: Database) {}

  findById(id: string): Client | null {
    const row = this.db.prepare("SELECT * FROM clients WHERE id = ?").get(id) as ClientRow | undefined;
    return row ? toClient(row) : null;
  }

  create(input: { id: string; nom: string; planId: string }): Client {
    const id = input.id || randomUUID();
    this.db
      .prepare("INSERT INTO clients (id, nom, plan_id) VALUES (?, ?, ?)")
      .run(id, input.nom, input.planId);
    return this.findById(id)!;
  }

  signDpa(id: string, dpaVersion: string): Client {
    this.db
      .prepare(
        "UPDATE clients SET dpa_signed_at = datetime('now'), dpa_version = ?, updated_at = datetime('now') WHERE id = ?",
      )
      .run(dpaVersion, id);
    return this.findById(id)!;
  }
}
