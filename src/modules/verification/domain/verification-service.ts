import type { Contact, VerificationResultat } from "@/modules/verification/domain/entities";
import { detecterPatternDomaineSuspect } from "@/modules/verification/domain/pattern-suspect";
import type { DomaineAgeChecker, MxChecker, SmtpChecker } from "@/modules/verification/domain/ports";
import type {
  ContactRepository,
  ListeImporteeRepository,
  VerificationResultatRepository,
} from "@/modules/verification/domain/repositories";
import { calculerScoreRisque } from "@/modules/verification/domain/scoring";

function domaineDe(email: string): string {
  return email.split("@")[1] ?? "";
}

export class VerificationService {
  constructor(
    private readonly contacts: ContactRepository,
    private readonly resultats: VerificationResultatRepository,
    private readonly listes: ListeImporteeRepository,
    private readonly mx: MxChecker,
    private readonly smtp: SmtpChecker,
    private readonly age: DomaineAgeChecker,
  ) {}

  /**
   * Verifie chaque contact d'une liste et calcule son score de
   * risque explique (cf. SPEC.md section 4, etape 3c). Idempotent :
   * un contact deja verifie n'est pas re-verifie.
   */
  async verifierListe(listeId: string): Promise<VerificationResultat[]> {
    this.listes.updateStatut(listeId, "en_cours");

    const contacts = this.contacts.listByListe(listeId);
    const resultats: VerificationResultat[] = [];

    for (const contact of contacts) {
      const existant = this.resultats.findByContact(contact.id);
      if (existant) {
        resultats.push(existant);
        continue;
      }
      resultats.push(await this.verifierContact(contact));
    }

    this.listes.updateStatut(listeId, "terminee", contacts.length);
    return resultats;
  }

  private async verifierContact(contact: Contact): Promise<VerificationResultat> {
    const domaine = domaineDe(contact.email);
    const [mxValide, resultatSmtp, ageDomaineJours] = await Promise.all([
      this.mx.verifierMx(domaine),
      this.smtp.verifier(contact.email),
      this.age.obtenirAgeJours(domaine),
    ]);
    const patternDomaineSuspect = detecterPatternDomaineSuspect(domaine);

    const { score, explication } = calculerScoreRisque({
      resultatSmtp,
      mxValide,
      ageDomaineJours,
      patternDomaineSuspect,
    });

    return this.resultats.upsert({
      contactId: contact.id,
      resultatSmtp,
      mxValide,
      ageDomaineJours,
      patternDomaineSuspect,
      scoreRisque: score,
      scoreExplication: explication,
    });
  }
}
