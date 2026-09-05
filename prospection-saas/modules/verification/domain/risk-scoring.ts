import type { VerdictLabel, VerificationSignals } from "./verification-result";

export interface RiskAssessment {
  riskScore: number;
  verdictLabel: VerdictLabel;
  explanationText: string;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function labelFromScore(score: number): VerdictLabel {
  if (score <= 15) return "valide";
  if (score <= 40) return "risque";
  if (score <= 70) return "catch_all_incertain";
  return "invalide";
}

/**
 * Calcule un score de risque continu (0 = fiable, 100 = à éviter) au lieu d'un
 * verdict binaire — c'est le premier différenciateur du produit. Chaque règle
 * qui s'applique est listée dans l'explication, pour que l'utilisateur voie
 * *pourquoi* le score est ce qu'il est, pas seulement le chiffre.
 */
export function computeRiskAssessment(signals: VerificationSignals): RiskAssessment {
  const reasons: string[] = [];

  if (!signals.mxValid) {
    reasons.push("Aucun enregistrement MX valide sur le domaine : la boîte ne peut pas recevoir d'email.");
    return { riskScore: 100, verdictLabel: "invalide", explanationText: reasons.join(" ") };
  }

  if (signals.primaryProviderVerdict === "invalid") {
    reasons.push("Le fournisseur de vérification principal a rejeté l'adresse comme invalide.");
    if (signals.secondaryProviderVerdict === "valid") {
      reasons.push("Le second fournisseur (waterfall) la considère valide : score ramené en zone incertaine plutôt qu'invalide franc.");
      return { riskScore: 60, verdictLabel: "catch_all_incertain", explanationText: reasons.join(" ") };
    }
    return { riskScore: 95, verdictLabel: "invalide", explanationText: reasons.join(" ") };
  }

  if (signals.primaryProviderVerdict === "disposable") {
    reasons.push("Domaine identifié comme adresse jetable.");
    return { riskScore: 90, verdictLabel: "invalide", explanationText: reasons.join(" ") };
  }

  if (signals.primaryProviderVerdict === "valid" && !signals.catchAllDetected) {
    reasons.push("Le fournisseur principal confirme une adresse valide, domaine non catch-all.");
    return { riskScore: 10, verdictLabel: "valide", explanationText: reasons.join(" ") };
  }

  // Cas catch-all : c'est le cœur du différenciateur, on ne renvoie jamais un
  // verdict binaire ici, on combine plusieurs signaux.
  let score = 55;
  reasons.push("Domaine catch-all : accepte tous les emails, impossible de confirmer la boîte précise par SMTP seul.");

  if (signals.domainAgeDays !== null && signals.domainAgeDays < 90) {
    score += 20;
    reasons.push(`Domaine récent (${signals.domainAgeDays} jours) : risque accru d'infrastructure jetable.`);
  }

  if (signals.patternMatchConfidence >= 0.7) {
    score -= 20;
    reasons.push("L'adresse suit un pattern courant observé pour ce domaine (ex. prénom.nom) : confiance accrue.");
  } else if (signals.patternMatchConfidence < 0.3) {
    score += 10;
    reasons.push("L'adresse ne correspond à aucun pattern courant observé pour ce domaine.");
  }

  if (signals.secondaryProviderVerdict === "valid") {
    score -= 15;
    reasons.push("Le second fournisseur (waterfall) confirme une adresse valide.");
  } else if (signals.secondaryProviderVerdict === "invalid") {
    score += 25;
    reasons.push("Le second fournisseur (waterfall) rejette l'adresse.");
  }

  const riskScore = clampScore(score);
  return { riskScore, verdictLabel: labelFromScore(riskScore), explanationText: reasons.join(" ") };
}
