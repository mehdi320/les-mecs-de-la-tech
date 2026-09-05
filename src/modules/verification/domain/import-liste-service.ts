import type { Contact } from "@/modules/verification/domain/entities";
import type { ContactRepository, ListeImporteeRepository } from "@/modules/verification/domain/repositories";
import type { SuppressionChecker } from "@/shared/domain/suppression-checker";

export interface ContactBrut {
  email: string;
  donneesAdditionnelles?: Record<string, unknown>;
}

export interface ResultatImport {
  liste: ReturnType<ListeImporteeRepository["create"]>;
  contactsImportes: Contact[];
  nbDedoublonnesIntraListe: number;
  nbExclusSuppression: number;
}

/**
 * Import d'une liste (cf. SPEC.md section 4, etape 3) : dedoublonnage
 * intra-liste, puis exclusion immediate des contacts deja presents
 * dans le registre de suppression du client — jamais reimportes
 * silencieusement comme "nouveaux" (section 4, etape 3b). La
 * verification (score de risque) est un second temps distinct,
 * declenche separement via VerificationService.
 */
export class ImporterListeService {
  constructor(
    private readonly listes: ListeImporteeRepository,
    private readonly contacts: ContactRepository,
    private readonly suppression: SuppressionChecker,
  ) {}

  importer(clientId: string, nom: string, sourceDeclaree: string | null, brut: ContactBrut[]): ResultatImport {
    const liste = this.listes.create({ clientId, nom, sourceDeclaree });

    const vus = new Set<string>();
    let nbDedoublonnesIntraListe = 0;
    let nbExclusSuppression = 0;
    const retenus: { email: string; donneesAdditionnelles: Record<string, unknown> }[] = [];

    for (const entree of brut) {
      const email = entree.email.trim().toLowerCase();
      if (!email) continue;

      if (vus.has(email)) {
        nbDedoublonnesIntraListe += 1;
        continue;
      }
      vus.add(email);

      if (this.suppression.estSupprime(clientId, email)) {
        nbExclusSuppression += 1;
        continue;
      }

      retenus.push({ email, donneesAdditionnelles: entree.donneesAdditionnelles ?? {} });
    }

    const contactsImportes = this.contacts.createMany({ clientId, listeId: liste.id, contacts: retenus });
    this.listes.updateStatut(liste.id, "en_attente", contactsImportes.length);

    return { liste, contactsImportes, nbDedoublonnesIntraListe, nbExclusSuppression };
  }
}
