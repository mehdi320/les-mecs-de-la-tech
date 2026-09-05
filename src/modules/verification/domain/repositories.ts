import type {
  Contact,
  ListeImportee,
  StatutVerificationListe,
  VerificationResultat,
} from "@/modules/verification/domain/entities";

export interface ListeImporteeRepository {
  listByClient(clientId: string): ListeImportee[];
  findById(id: string): ListeImportee | null;
  create(input: { clientId: string; nom: string; sourceDeclaree: string | null }): ListeImportee;
  updateStatut(id: string, statut: StatutVerificationListe, nbContacts?: number): void;
}

export interface ContactRepository {
  listByListe(listeId: string): Contact[];
  findById(id: string): Contact | null;
  /** Deduplique par (liste_id, email) — silencieux sur conflit, cf. import CSV. */
  createMany(input: { clientId: string; listeId: string; contacts: { email: string; donneesAdditionnelles: Record<string, unknown> }[] }): Contact[];
}

export interface VerificationResultatRepository {
  findByContact(contactId: string): VerificationResultat | null;
  upsert(input: Omit<VerificationResultat, "id">): VerificationResultat;
}
