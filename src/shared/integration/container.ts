import { getDb } from "@/shared/integration/db";
import { SqliteClientRepository } from "@/shared/integration/client-repository";

import { SqliteMailboxRepository } from "@/modules/envoi/integration/mailbox-repository";
import { SqliteDomaineRepository } from "@/modules/envoi/integration/domaine-repository";
import { SqliteSequenceRepository } from "@/modules/envoi/integration/sequence-repository";
import { SqliteCampagneRepository } from "@/modules/envoi/integration/campagne-repository";
import { SqliteEnrollmentRepository } from "@/modules/envoi/integration/enrollment-repository";
import { SqliteEnvoiEvenementRepository } from "@/modules/envoi/integration/envoi-evenement-repository";
import { SqliteContactLookup } from "@/modules/envoi/integration/contact-lookup";
import { MailboxSender } from "@/modules/envoi/integration/mailbox-sender";
import { EnrollmentService } from "@/modules/envoi/domain/enrollment-service";
import { SqliteSequenceEtapeVarianteRepository } from "@/modules/envoi/integration/sequence-etape-variante-repository";

import { SqliteListeImporteeRepository } from "@/modules/verification/integration/liste-importee-repository";
import { SqliteContactRepository } from "@/modules/verification/integration/contact-repository";
import { SqliteVerificationResultatRepository } from "@/modules/verification/integration/verification-resultat-repository";
import { DnsMxChecker } from "@/modules/verification/integration/mx-checker";
import { SmtpHandshakeChecker } from "@/modules/verification/integration/smtp-checker";
import { AucunDomaineAgeChecker } from "@/modules/verification/integration/domaine-age-checker";
import { VerificationService } from "@/modules/verification/domain/verification-service";
import { ImporterListeService } from "@/modules/verification/domain/import-liste-service";

import { SqliteSuppressionRepository } from "@/modules/conformite/integration/suppression-repository";
import { SqliteAuditExportRepository } from "@/modules/conformite/integration/audit-export-repository";
import { SqliteCampagneHistoriqueLookup } from "@/modules/conformite/integration/campagne-historique-lookup";
import { RepositorySuppressionChecker } from "@/modules/conformite/domain/suppression-checker-adapter";
import { AuditExportService } from "@/modules/conformite/domain/audit-export-service";

/**
 * Composition root : le seul endroit du code qui instancie les
 * implementations SQLite et les relie aux services de domaine. Les
 * routes/pages (presentation) n'importent que `getContainer()`,
 * jamais une classe d'integration directement.
 */
export function getContainer() {
  const db = getDb();

  const clients = new SqliteClientRepository(db);

  const mailboxes = new SqliteMailboxRepository(db);
  const domaines = new SqliteDomaineRepository(db);
  const sequences = new SqliteSequenceRepository(db);
  const campagnes = new SqliteCampagneRepository(db);
  const enrollments = new SqliteEnrollmentRepository(db);
  const envoiEvenements = new SqliteEnvoiEvenementRepository(db);
  const contactLookup = new SqliteContactLookup(db);
  const mailboxSender = new MailboxSender(mailboxes);
  const sequenceEtapeVariantes = new SqliteSequenceEtapeVarianteRepository(db);

  const listesImportees = new SqliteListeImporteeRepository(db);
  const contacts = new SqliteContactRepository(db);
  const verificationResultats = new SqliteVerificationResultatRepository(db);

  const suppressions = new SqliteSuppressionRepository(db);
  const auditExports = new SqliteAuditExportRepository(db);
  const campagneHistorique = new SqliteCampagneHistoriqueLookup(db);
  const suppressionChecker = new RepositorySuppressionChecker(suppressions);

  const enrollmentService = new EnrollmentService(
    enrollments,
    sequences,
    envoiEvenements,
    suppressionChecker,
    contactLookup,
    mailboxSender,
    sequenceEtapeVariantes,
  );

  const verificationService = new VerificationService(
    contacts,
    verificationResultats,
    listesImportees,
    new DnsMxChecker(),
    new SmtpHandshakeChecker(),
    new AucunDomaineAgeChecker(),
  );

  const importerListeService = new ImporterListeService(listesImportees, contacts, suppressionChecker);

  const auditExportService = new AuditExportService(auditExports, suppressions, campagneHistorique);

  return {
    clients,
    envoi: { mailboxes, domaines, sequences, campagnes, enrollments, envoiEvenements, enrollmentService, sequenceEtapeVariantes },
    verification: { listesImportees, contacts, verificationResultats, verificationService, importerListeService },
    conformite: { suppressions, auditExports, auditExportService },
  };
}
