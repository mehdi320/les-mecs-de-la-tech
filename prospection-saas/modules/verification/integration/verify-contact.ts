import { nowIso } from "@/kernel/db";
import type { ContactId } from "@/kernel/ids";
import { computeRiskAssessment } from "../domain/risk-scoring";
import { estimatePatternMatchConfidence } from "../domain/pattern-heuristics";
import { shouldTriggerSecondaryVerification } from "../domain/waterfall-policy";
import type { VerificationResult, VerificationSignals } from "../domain/verification-result";
import { verifyEmailPrimary } from "./millionverifier-client";
import { verifyEmailSecondary } from "./bouncer-client";
import { insertVerificationResult } from "./verification-result-repository";

/**
 * Ne connaît le module Extraction que par les primitives passées en paramètre
 * (contactId, email, fullName) — jamais par un import direct du type Contact ou
 * de son repository. C'est la route API qui fait la composition entre modules.
 */
export async function verifyContact(input: {
  contactId: ContactId;
  email: string;
  fullName: string;
}): Promise<VerificationResult> {
  const primary = await verifyEmailPrimary(input.email);

  let secondaryVerdict: VerificationSignals["secondaryProviderVerdict"] = null;
  let secondaryCost = 0;
  if (shouldTriggerSecondaryVerification(primary.verdict)) {
    const secondary = await verifyEmailSecondary(input.email);
    secondaryVerdict = secondary.verdict;
    secondaryCost = 1;
  }

  // Simplification MVP : pas de fournisseur WHOIS branché pour l'âge du domaine
  // (voir DECISIONS-BLOQUANTES.md) — le signal reste null, la logique de score
  // le gère explicitement plutôt que d'inventer une valeur.
  const signals: VerificationSignals = {
    mxValid: !primary.raw.subresult.toLowerCase().includes("mx"),
    catchAllDetected: primary.verdict === "catch_all" || secondaryVerdict === "catch_all",
    domainAgeDays: null,
    patternMatchConfidence: estimatePatternMatchConfidence(input.email, input.fullName),
    primaryProviderVerdict: primary.verdict,
    secondaryProviderVerdict: secondaryVerdict,
  };

  const assessment = computeRiskAssessment(signals);

  const result = insertVerificationResult({
    contactId: input.contactId,
    emailChecked: input.email,
    riskScore: assessment.riskScore,
    verdictLabel: assessment.verdictLabel,
    signals,
    primaryProvider: "millionverifier",
    secondaryProvider: secondaryVerdict ? "bouncer" : null,
    explanationText: assessment.explanationText,
    verifiedAt: nowIso(),
    verificationCost: 1 + secondaryCost,
  });

  return result;
}
