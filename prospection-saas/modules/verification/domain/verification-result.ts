import type { ContactId, VerificationResultId } from "@/kernel/ids";

export type VerdictLabel = "valide" | "risque" | "catch_all_incertain" | "invalide";

export type ProviderVerdict = "valid" | "invalid" | "catch_all" | "unknown" | "disposable";

export interface VerificationSignals {
  mxValid: boolean;
  catchAllDetected: boolean;
  domainAgeDays: number | null;
  /** 0 à 1 : confiance que l'email deviné suit un pattern courant pour ce domaine. */
  patternMatchConfidence: number;
  primaryProviderVerdict: ProviderVerdict;
  secondaryProviderVerdict: ProviderVerdict | null;
}

export interface VerificationResult {
  id: VerificationResultId;
  contactId: ContactId;
  emailChecked: string;
  riskScore: number;
  verdictLabel: VerdictLabel;
  signals: VerificationSignals;
  primaryProvider: "millionverifier";
  secondaryProvider: "bouncer" | null;
  explanationText: string;
  verifiedAt: string;
  verificationCost: number;
}
