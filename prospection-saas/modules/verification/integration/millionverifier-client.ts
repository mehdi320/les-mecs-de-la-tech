import type { ProviderVerdict } from "../domain/verification-result";

/**
 * Client MillionVerifier (millionverifier.com). Endpoint et champs de réponse
 * établis à partir de la documentation publique consultée le 2026-09-05 — à
 * revalider contre la doc live avant le premier appel réel.
 */
const MILLIONVERIFIER_BASE = "https://api.millionverifier.com/api/v3/";

export interface MillionVerifierResponse {
  email: string;
  quality: "good" | "bad" | "risky";
  result: "ok" | "catch_all" | "unknown" | "error" | "disposable" | "invalid";
  resultcode: number;
  subresult: string;
  free: boolean;
  role: boolean;
  credits: number;
}

export class MillionVerifierError extends Error {}

function toProviderVerdict(result: MillionVerifierResponse["result"]): ProviderVerdict {
  switch (result) {
    case "ok":
      return "valid";
    case "catch_all":
      return "catch_all";
    case "disposable":
      return "disposable";
    case "invalid":
      return "invalid";
    default:
      return "unknown";
  }
}

export async function verifyEmailPrimary(
  email: string,
): Promise<{ verdict: ProviderVerdict; raw: MillionVerifierResponse }> {
  const apiKey = process.env.MILLIONVERIFIER_API_KEY;
  if (!apiKey) {
    throw new MillionVerifierError(
      "MILLIONVERIFIER_API_KEY manquant. Renseigner la variable d'environnement avant de vérifier réellement.",
    );
  }

  const url = new URL(MILLIONVERIFIER_BASE);
  url.searchParams.set("api", apiKey);
  url.searchParams.set("email", email);
  url.searchParams.set("timeout", "10");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new MillionVerifierError(`MillionVerifier a répondu ${response.status}: ${await response.text()}`);
  }

  const raw = (await response.json()) as MillionVerifierResponse;
  return { verdict: toProviderVerdict(raw.result), raw };
}
