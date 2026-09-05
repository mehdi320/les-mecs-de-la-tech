export type MailboxProvider = "google_workspace" | "microsoft_365" | "smtp_generique";
export type MailboxStatut = "en_attente" | "connecte" | "erreur";

export interface Mailbox {
  id: string;
  clientId: string;
  provider: MailboxProvider;
  email: string;
  statutConnexion: MailboxStatut;
  quotaJour: number;
  createdAt: string;
}

export type DomaineAuthStatut = "inconnu" | "valide" | "invalide";

export interface Domaine {
  id: string;
  clientId: string;
  nomDomaine: string;
  spfStatut: DomaineAuthStatut;
  dkimStatut: DomaineAuthStatut;
  dmarcStatut: DomaineAuthStatut;
  dernierCheckAt: string | null;
}

export type SequenceStatut = "brouillon" | "active" | "archivee";

export interface Sequence {
  id: string;
  clientId: string;
  nom: string;
  statut: SequenceStatut;
}

export interface SequenceEtape {
  id: string;
  sequenceId: string;
  ordre: number;
  delaiJours: number;
  sujet: string;
  corps: string;
  conditionBranche: string | null;
}

export type CampagneStatut = "brouillon" | "active" | "en_pause" | "terminee";

export interface Campagne {
  id: string;
  clientId: string;
  sequenceId: string;
  listeId: string;
  mailboxIds: string[];
  fuseauHoraire: string;
  fenetreEnvoiDebut: string;
  fenetreEnvoiFin: string;
  seuilScoreRisqueMin: number | null;
  statut: CampagneStatut;
}

export type EnrollmentStatut =
  | "en_attente"
  | "envoye"
  | "repondu"
  | "stoppe_suppression"
  | "stoppe_reponse";

export interface Enrollment {
  id: string;
  campagneId: string;
  contactId: string;
  etapeCourante: number;
  statut: EnrollmentStatut;
}

export interface EnvoiEvenement {
  id: string;
  enrollmentId: string;
  mailboxId: string;
  varianteId: string | null;
  horodatage: string;
  statutSmtp: string;
  messageId: string | null;
  /** Rempli par le pixel de suivi (cf. SPEC.md section 9.7) — null tant que l'email n'a pas ete ouvert. */
  ouvertAt: string | null;
}
