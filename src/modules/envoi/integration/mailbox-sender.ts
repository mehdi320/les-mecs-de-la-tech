import type { EnvoiPort } from "@/modules/envoi/domain/enrollment-service";
import type { MailboxRepository } from "@/modules/envoi/domain/repositories";
import { chiffrer, dechiffrer } from "@/shared/integration/secrets";
import { envoyerParSmtp, type SmtpConfig } from "@/modules/envoi/integration/connectors/smtp-generic-connector";
import {
  envoyerParGmail,
  rafraichirTokenGoogle,
  type GoogleTokens,
} from "@/modules/envoi/integration/connectors/google-workspace-connector";
import {
  envoyerParGraph,
  rafraichirTokenMicrosoft,
  type MicrosoftTokens,
} from "@/modules/envoi/integration/connectors/microsoft-365-connector";

/**
 * Point unique d'envoi effectif d'un email, quel que soit le
 * fournisseur de la mailbox. Dispatch par `provider` (cf. SPEC.md
 * section 3.1) — c'est la seule couche qui sait qu'un envoi Google
 * passe par Gmail API, un envoi Microsoft par Graph, et un envoi
 * generique par SMTP direct.
 */
export class MailboxSender implements EnvoiPort {
  constructor(private readonly mailboxes: MailboxRepository) {}

  async envoyer(input: { mailboxId: string; destinataire: string; sujet: string; corps: string }) {
    const mailbox = this.mailboxes.findById(input.mailboxId);
    if (!mailbox) {
      return { statutSmtp: "erreur: mailbox introuvable", messageId: null };
    }

    switch (mailbox.provider) {
      case "smtp_generique": {
        const ref = this.mailboxes.getSmtpConfigRef(mailbox.id);
        if (!ref) return { statutSmtp: "erreur: mailbox non connectee", messageId: null };
        const config = JSON.parse(dechiffrer(ref)) as SmtpConfig;
        return envoyerParSmtp(config, input);
      }
      case "google_workspace": {
        const ref = this.mailboxes.getOAuthTokensRef(mailbox.id);
        if (!ref) return { statutSmtp: "erreur: mailbox non connectee", messageId: null };
        let tokens = JSON.parse(dechiffrer(ref)) as GoogleTokens;
        if (tokens.expiresAt < Date.now()) {
          tokens = await rafraichirTokenGoogle(tokens.refreshToken);
          this.mailboxes.setOAuthTokensRef(mailbox.id, chiffrer(JSON.stringify(tokens)), "connecte");
        }
        return envoyerParGmail(tokens, mailbox.email, input);
      }
      case "microsoft_365": {
        const ref = this.mailboxes.getOAuthTokensRef(mailbox.id);
        if (!ref) return { statutSmtp: "erreur: mailbox non connectee", messageId: null };
        let tokens = JSON.parse(dechiffrer(ref)) as MicrosoftTokens;
        if (tokens.expiresAt < Date.now()) {
          tokens = await rafraichirTokenMicrosoft(tokens.refreshToken);
          this.mailboxes.setOAuthTokensRef(mailbox.id, chiffrer(JSON.stringify(tokens)), "connecte");
        }
        return envoyerParGraph(tokens, input);
      }
    }
  }
}
