import { randomUUID } from "node:crypto";
import { Socket } from "node:net";
import { resolveMx } from "node:dns/promises";
import type { ResultatSmtp } from "@/modules/verification/domain/entities";
import type { SmtpChecker } from "@/modules/verification/domain/ports";
import { avecDelai } from "@/shared/integration/timeout";

const TIMEOUT_MS = 5000;
const EMAIL_VERIFICATEUR = process.env.SMTP_CHECK_FROM_ADDRESS ?? "verify@example.com";

/**
 * Verification SMTP par handshake sans envoi reel (EHLO/MAIL FROM/
 * RCPT TO puis QUIT sans DATA), cf. SPEC.md section 3.2. Detecte le
 * catch-all en comparant la reponse pour l'adresse cible et pour une
 * adresse aleatoire du meme domaine. De nombreux reseaux bloquent le
 * port 25 sortant (dont potentiellement l'environnement d'execution
 * de ce produit) : toute erreur ou timeout retombe sur `inconnu`
 * plutot que de faire echouer l'import.
 */
export class SmtpHandshakeChecker implements SmtpChecker {
  async verifier(email: string): Promise<ResultatSmtp> {
    const domaine = email.split("@")[1];
    if (!domaine) return "inconnu";

    const records = await avecDelai(
      resolveMx(domaine).catch(() => []),
      TIMEOUT_MS,
      [] as Awaited<ReturnType<typeof resolveMx>>,
    );
    const meilleur = records.sort((a, b) => a.priority - b.priority)[0];
    if (!meilleur) return "inconnu";
    const host = meilleur.exchange;

    try {
      const cibleAcceptee = await this.tester(host, email);
      if (cibleAcceptee === null) return "inconnu";
      if (!cibleAcceptee) return "invalide";

      const adresseAleatoire = `${randomUUID().replace(/-/g, "")}@${domaine}`;
      const aleatoireAcceptee = await this.tester(host, adresseAleatoire);
      if (aleatoireAcceptee === true) return "catch_all";
      return "valide";
    } catch {
      return "inconnu";
    }
  }

  private tester(host: string, destinataire: string): Promise<boolean | null> {
    return new Promise((resolve) => {
      const socket = new Socket();
      let etape = 0;
      let resolu = false;

      const terminer = (valeur: boolean | null) => {
        if (resolu) return;
        resolu = true;
        socket.destroy();
        resolve(valeur);
      };

      socket.setTimeout(TIMEOUT_MS, () => terminer(null));
      socket.on("error", () => terminer(null));

      socket.connect(25, host);

      socket.on("data", (data) => {
        const ligne = data.toString();
        const code = Number(ligne.slice(0, 3));

        if (etape === 0) {
          if (code !== 220) return terminer(null);
          socket.write(`EHLO verification.local\r\n`);
          etape = 1;
        } else if (etape === 1) {
          if (code !== 250) return terminer(null);
          socket.write(`MAIL FROM:<${EMAIL_VERIFICATEUR}>\r\n`);
          etape = 2;
        } else if (etape === 2) {
          if (code !== 250) return terminer(null);
          socket.write(`RCPT TO:<${destinataire}>\r\n`);
          etape = 3;
        } else if (etape === 3) {
          socket.write("QUIT\r\n");
          terminer(code === 250);
        }
      });
    });
  }
}
