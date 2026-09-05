import type { Enrollment, SequenceEtape } from "@/modules/envoi/domain/entities";
import type { EnrollmentRepository, EnvoiEvenementRepository, SequenceRepository } from "@/modules/envoi/domain/repositories";
import type { SuppressionChecker } from "@/shared/domain/suppression-checker";
import type { ContactLookup } from "@/modules/envoi/domain/contact-lookup";
import type { SequenceEtapeVarianteRepository } from "@/modules/envoi/domain/personnalisation/repositories";
import { choisirVarianteEquilibree } from "@/modules/envoi/domain/personnalisation/variante-selection";
import { renderTemplate } from "@/shared/domain/template";

export interface EnvoiPort {
  envoyer(input: { mailboxId: string; destinataire: string; sujet: string; corps: string }): Promise<{
    statutSmtp: string;
    messageId: string | null;
  }>;
}

export class EnrollmentService {
  constructor(
    private readonly enrollments: EnrollmentRepository,
    private readonly sequences: SequenceRepository,
    private readonly evenements: EnvoiEvenementRepository,
    private readonly suppression: SuppressionChecker,
    private readonly contacts: ContactLookup,
    private readonly envoi: EnvoiPort,
    private readonly variantes: SequenceEtapeVarianteRepository,
  ) {}

  /**
   * Fait avancer un enrollment d'une etape : cf. SPEC.md section 4,
   * etape 6 — le registre de suppression est revalide juste avant
   * l'envoi de CHAQUE etape, pas seulement a la creation de
   * l'enrollment, car le contact peut s'etre desinscrit d'une autre
   * campagne du meme client entre-temps.
   */
  async envoyerProchaineEtape(
    enrollment: Enrollment,
    sequenceId: string,
    clientId: string,
    mailboxId: string,
  ): Promise<Enrollment> {
    if (enrollment.statut !== "en_attente") {
      return enrollment;
    }

    const email = this.contacts.getEmail(enrollment.contactId);
    if (!email) {
      throw new Error(`Contact introuvable pour l'enrollment ${enrollment.id}`);
    }

    if (this.suppression.estSupprime(clientId, email)) {
      return this.enrollments.updateStatut(enrollment.id, "stoppe_suppression");
    }

    const etapes = this.sequences.listEtapes(sequenceId).sort((a, b) => a.ordre - b.ordre);
    const etape: SequenceEtape | undefined = etapes[enrollment.etapeCourante];
    if (!etape) {
      return this.enrollments.updateStatut(enrollment.id, "envoye");
    }

    // Variantes A/B (cf. SPEC.md section 9) : rotation equilibree entre
    // variantes non ecartees ("perdante" exclue) si l'etape en a ;
    // repli sur le contenu par defaut de l'etape sinon.
    const variantesActives = this.variantes.listBySequenceEtape(etape.id).filter((v) => v.statut !== "perdante");
    const variante =
      variantesActives.length > 0
        ? choisirVarianteEquilibree(variantesActives, this.evenements.countByVariantes(variantesActives.map((v) => v.id)))
        : null;

    const donnees = this.contacts.getDonneesAdditionnelles(enrollment.contactId);
    const sujet = renderTemplate(variante ? variante.sujet : etape.sujet, donnees);
    const corps = renderTemplate(variante ? variante.corps : etape.corps, donnees);

    const resultat = await this.envoi.envoyer({ mailboxId, destinataire: email, sujet, corps });

    this.evenements.create({
      enrollmentId: enrollment.id,
      mailboxId,
      varianteId: variante?.id ?? null,
      statutSmtp: resultat.statutSmtp,
      messageId: resultat.messageId,
    });

    const etapeSuivante = enrollment.etapeCourante + 1;
    const statut = etapeSuivante >= etapes.length ? "envoye" : "en_attente";
    return this.enrollments.updateStatut(enrollment.id, statut, etapeSuivante);
  }
}
