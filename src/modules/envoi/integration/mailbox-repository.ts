import { randomUUID } from "node:crypto";
import type { Database } from "better-sqlite3";
import type { Mailbox, MailboxProvider, MailboxStatut } from "@/modules/envoi/domain/entities";
import type { MailboxRepository } from "@/modules/envoi/domain/repositories";

interface MailboxRow {
  id: string;
  client_id: string;
  provider: MailboxProvider;
  email: string;
  statut_connexion: MailboxStatut;
  quota_jour: number;
  created_at: string;
}

function toMailbox(row: MailboxRow): Mailbox {
  return {
    id: row.id,
    clientId: row.client_id,
    provider: row.provider,
    email: row.email,
    statutConnexion: row.statut_connexion,
    quotaJour: row.quota_jour,
    createdAt: row.created_at,
  };
}

export class SqliteMailboxRepository implements MailboxRepository {
  constructor(private readonly db: Database) {}

  listByClient(clientId: string): Mailbox[] {
    const rows = this.db
      .prepare("SELECT * FROM mailboxes WHERE client_id = ? ORDER BY created_at DESC")
      .all(clientId) as MailboxRow[];
    return rows.map(toMailbox);
  }

  findById(id: string): Mailbox | null {
    const row = this.db.prepare("SELECT * FROM mailboxes WHERE id = ?").get(id) as MailboxRow | undefined;
    return row ? toMailbox(row) : null;
  }

  create(input: { clientId: string; provider: MailboxProvider; email: string; quotaJour: number }): Mailbox {
    const id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO mailboxes (id, client_id, provider, email, quota_jour) VALUES (?, ?, ?, ?, ?)",
      )
      .run(id, input.clientId, input.provider, input.email, input.quotaJour);
    return this.findById(id)!;
  }

  setSmtpConfigRef(mailboxId: string, ref: string, statut: Mailbox["statutConnexion"]): void {
    this.db
      .prepare(
        "UPDATE mailboxes SET smtp_config_ref = ?, statut_connexion = ?, updated_at = datetime('now') WHERE id = ?",
      )
      .run(ref, statut, mailboxId);
  }

  setOAuthTokensRef(mailboxId: string, ref: string, statut: Mailbox["statutConnexion"]): void {
    this.db
      .prepare(
        "UPDATE mailboxes SET oauth_tokens_ref = ?, statut_connexion = ?, updated_at = datetime('now') WHERE id = ?",
      )
      .run(ref, statut, mailboxId);
  }

  getSmtpConfigRef(mailboxId: string): string | null {
    const row = this.db.prepare("SELECT smtp_config_ref FROM mailboxes WHERE id = ?").get(mailboxId) as
      | { smtp_config_ref: string | null }
      | undefined;
    return row?.smtp_config_ref ?? null;
  }

  getOAuthTokensRef(mailboxId: string): string | null {
    const row = this.db.prepare("SELECT oauth_tokens_ref FROM mailboxes WHERE id = ?").get(mailboxId) as
      | { oauth_tokens_ref: string | null }
      | undefined;
    return row?.oauth_tokens_ref ?? null;
  }
}
