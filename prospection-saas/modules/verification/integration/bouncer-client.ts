import type { ProviderVerdict } from "../domain/verification-result";

/**
 * Client Bouncer (usebouncer.com), utilisé comme second fournisseur en waterfall
 * (voir DECISIONS-BLOQUANTES.md, décision 2 : ne facture pas de supplément sur
 * le catch-all, cohérent avec MillionVerifier en primaire). Endpoint et champs
 * établis à partir de la documentation publique consultée le 2026-09-05 — à
 * revalider contre la doc live avant le premier appel réel.
 */
const BOUNCER_BASE = "https://api.usebouncer.com/v1.1/email/verify";

export interface BouncerResponse {
  email: string;
  status: "deliverable" | "undeliverable" | "risky" | "unknown";
  reason: string;
  domain: {
    name: string;
    acceptAll: "yes" | "no" | "unknown";
    disposable: "yes" | "no";
    free: "yes" | "no";
  };
  score: number;
}

export class BouncerError extends Error {}

function toProviderVerdict(response: BouncerResponse): ProviderVerdict {
  if (response.domain.disposable === "yes") return "disposable";
  if (response.domain.acceptAll === "yes") return "catch_all";
  if (response.status === "deliverable") return "valid";
  if (response.status === "undeliverable") return "invalid";
  return "unknown";
}

export async function verifyEmailSecondary(
  email: string,
): Promise<{ verdict: ProviderVerdict; raw: BouncerResponse }> {
  const apiKey = process.env.BOUNCER_API_KEY;
  if (!apiKey) {
    throw new BouncerError(
      "BOUNCER_API_KEY manquant. Renseigner la variable d'environnement avant de vérifier réellement.",
    );
  }

  const url = new URL(BOUNCER_BASE);
  url.searchParams.set("email", email);

  const response = await fetch(url.toString(), {
    headers: { "x-api-key": apiKey },
  });
  if (!response.ok) {
    throw new BouncerError(`Bouncer a répondu ${response.status}: ${await response.text()}`);
  }

  const raw = (await response.json()) as BouncerResponse;
  return { verdict: toProviderVerdict(raw), raw };
}
