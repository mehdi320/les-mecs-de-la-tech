import type {
  Campagne,
  Domaine,
  Enrollment,
  EnvoiEvenement,
  Mailbox,
  MailboxProvider,
  Sequence,
  SequenceEtape,
} from "@/modules/envoi/domain/entities";

export interface MailboxRepository {
  listByClient(clientId: string): Mailbox[];
  findById(id: string): Mailbox | null;
  create(input: { clientId: string; provider: MailboxProvider; email: string; quotaJour: number }): Mailbox;
  /** `ref` est une valeur deja chiffree (cf. shared/integration/secrets.ts) : jamais un secret en clair. */
  setSmtpConfigRef(mailboxId: string, ref: string, statut: Mailbox["statutConnexion"]): void;
  setOAuthTokensRef(mailboxId: string, ref: string, statut: Mailbox["statutConnexion"]): void;
  getSmtpConfigRef(mailboxId: string): string | null;
  getOAuthTokensRef(mailboxId: string): string | null;
  /** `false` si bloque par une contrainte (des envois referencent deja cette mailbox). */
  delete(id: string): boolean;
}

export interface DomaineRepository {
  listByClient(clientId: string): Domaine[];
  findById(id: string): Domaine | null;
  create(input: { clientId: string; nomDomaine: string }): Domaine;
  setAuthStatuts(id: string, statuts: { spf: Domaine["spfStatut"]; dkim: Domaine["dkimStatut"]; dmarc: Domaine["dmarcStatut"] }): void;
  delete(id: string): void;
}

export interface SequenceRepository {
  listByClient(clientId: string): Sequence[];
  findById(id: string): Sequence | null;
  create(input: { clientId: string; nom: string }): Sequence;
  addEtape(input: {
    sequenceId: string;
    ordre: number;
    delaiJours: number;
    sujet: string;
    corps: string;
  }): SequenceEtape;
  listEtapes(sequenceId: string): SequenceEtape[];
  /** Cascade en base vers les etapes et leurs variantes (cf. migrations). */
  delete(id: string): void;
  deleteEtape(etapeId: string): void;
}

export interface CampagneRepository {
  listByClient(clientId: string): Campagne[];
  findById(id: string): Campagne | null;
  create(input: {
    clientId: string;
    sequenceId: string;
    listeId: string;
    mailboxIds: string[];
    fuseauHoraire: string;
    fenetreEnvoiDebut: string;
    fenetreEnvoiFin: string;
    seuilScoreRisqueMin: number | null;
  }): Campagne;
  /** `false` si bloque par une contrainte (une entree du registre de suppression cite cette campagne comme origine). */
  delete(id: string): boolean;
}

export interface EnrollmentRepository {
  listByCampagne(campagneId: string): Enrollment[];
  findById(id: string): Enrollment | null;
  create(input: { campagneId: string; contactId: string }): Enrollment;
  updateStatut(id: string, statut: Enrollment["statut"], etapeCourante?: number): Enrollment;
}

export interface EnvoiEvenementRepository {
  create(input: {
    enrollmentId: string;
    mailboxId: string;
    varianteId: string | null;
    statutSmtp: string;
    messageId: string | null;
  }): EnvoiEvenement;
  listByEnrollment(enrollmentId: string): EnvoiEvenement[];
  /** Nombre d'envois par variante — sert la rotation equilibree (cf. personnalisation/variante-selection.ts). */
  countByVariantes(varianteIds: string[]): Record<string, number>;
}
