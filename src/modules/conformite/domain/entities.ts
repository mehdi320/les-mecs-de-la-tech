export type OrigineSuppression = "desinscription" | "plainte" | "bounce_dur" | "import_manuel";

export interface SuppressionEntree {
  id: string;
  clientId: string;
  email: string;
  origine: OrigineSuppression;
  campagneOrigineId: string | null;
  horodatage: string;
}

export type StatutOpposition = "aucune" | "opposee";

export interface CampagneAuditEntry {
  campagneId: string;
  horodatage: string;
  statut: string;
}

export interface AuditExport {
  id: string;
  clientId: string;
  contactEmailHash: string;
  campagnes: CampagneAuditEntry[];
  statutOpposition: StatutOpposition;
  genereAt: string;
  generePar: string | null;
}
