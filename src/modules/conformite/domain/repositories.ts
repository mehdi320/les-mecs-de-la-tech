import type { AuditExport, CampagneAuditEntry, OrigineSuppression, SuppressionEntree } from "@/modules/conformite/domain/entities";

export interface SuppressionRepository {
  /** Unique par (client_id, email) — cf. SPEC.md section 3.3. */
  ajouter(input: { clientId: string; email: string; origine: OrigineSuppression; campagneOrigineId: string | null }): SuppressionEntree;
  estPresent(clientId: string, email: string): boolean;
  listByClient(clientId: string): SuppressionEntree[];
}

export interface AuditExportRepository {
  create(input: {
    clientId: string;
    contactEmailHash: string;
    campagnes: CampagneAuditEntry[];
    statutOpposition: AuditExport["statutOpposition"];
    generePar: string | null;
  }): AuditExport;
  listByClient(clientId: string): AuditExport[];
}
