import { createHash } from "node:crypto";
import type { AuditExport } from "@/modules/conformite/domain/entities";
import type { AuditExportRepository, SuppressionRepository } from "@/modules/conformite/domain/repositories";
import type { CampagneHistoriqueLookup } from "@/modules/conformite/domain/ports";

function hasherEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/**
 * Export d'audit par contact (cf. SPEC.md section 3.3 et section 4,
 * etape 9) : quelle campagne, quelle date, quel statut d'opposition.
 * Positionne comme preuve de conformite que le client peut montrer a
 * ses propres clients, pas comme simple export technique.
 */
export class AuditExportService {
  constructor(
    private readonly audits: AuditExportRepository,
    private readonly suppressions: SuppressionRepository,
    private readonly historique: CampagneHistoriqueLookup,
  ) {}

  genererExport(clientId: string, email: string, generePar: string | null): AuditExport {
    const emailNormalise = email.trim().toLowerCase();
    const campagnes = this.historique.obtenirHistorique(clientId, emailNormalise);
    const statutOpposition = this.suppressions.estPresent(clientId, emailNormalise) ? "opposee" : "aucune";

    return this.audits.create({
      clientId,
      contactEmailHash: hasherEmail(emailNormalise),
      campagnes,
      statutOpposition,
      generePar,
    });
  }
}
