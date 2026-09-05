/**
 * Connecteur OAuth Google Workspace (Gmail API). Necessite
 * GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI en
 * variables d'environnement — non fournies dans cet environnement de
 * developpement, donc non testable ici de bout en bout. Le code est
 * ecrit pour etre fonctionnel des que ces identifiants OAuth sont
 * enregistres aupres de Google.
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquant : requis pour l'integration Google Workspace.`);
  return value;
}

export function construireUrlAutorisationGoogle(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: requireEnv("GOOGLE_REDIRECT_URI"),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPE,
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function echangerCodeGoogle(code: string): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
    redirect_uri: requireEnv("GOOGLE_REDIRECT_URI"),
    code,
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Echange de code Google echoue : ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export async function rafraichirTokenGoogle(refreshToken: string): Promise<GoogleTokens> {
  const body = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Rafraichissement du token Google echoue : ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  return { accessToken: json.access_token, refreshToken, expiresAt: Date.now() + json.expires_in * 1000 };
}

function construireMessageMime(expediteur: string, destinataire: string, sujet: string, corps: string): string {
  const message = [
    `From: ${expediteur}`,
    `To: ${destinataire}`,
    `Subject: ${sujet}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    corps,
  ].join("\r\n");
  return Buffer.from(message).toString("base64url");
}

export async function envoyerParGmail(
  tokens: GoogleTokens,
  expediteur: string,
  message: { destinataire: string; sujet: string; corps: string },
): Promise<{ statutSmtp: string; messageId: string | null }> {
  const raw = construireMessageMime(expediteur, message.destinataire, message.sujet, message.corps);
  const res = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    return { statutSmtp: `erreur: ${res.status} ${await res.text()}`, messageId: null };
  }
  const json = (await res.json()) as { id: string };
  return { statutSmtp: "envoye", messageId: json.id };
}
