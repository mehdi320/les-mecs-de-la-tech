import type { CampagneAuditEntry } from "@/modules/conformite/domain/entities";

/**
 * Frontiere vers le module Envoi : le module Conformite a besoin de
 * l'historique des campagnes ayant contacte un email pour construire
 * l'export d'audit (cf. SPEC.md section 3.3 et section 4, etape 9),
 * jamais des details d'implementation du moteur d'envoi.
 */
export interface CampagneHistoriqueLookup {
  obtenirHistorique(clientId: string, email: string): CampagneAuditEntry[];
}
