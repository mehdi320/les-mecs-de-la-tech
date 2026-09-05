/**
 * Connecteur OAuth Microsoft 365 (Microsoft Graph). Necessite
 * MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID,
 * MICROSOFT_REDIRECT_URI en variables d'environnement — non fournies
 * dans cet environnement de developpement, donc non testable ici de
 * bout en bout. Le code est ecrit pour etre fonctionnel des que ces
 * identifiants OAuth sont enregistres aupres de Microsoft (Azure AD
 * / Entra ID app registration).
 */

const GRAPH_SEND_MAIL_URL = "https://graph.microsoft.com/v1.0/me/sendMail";
const GRAPH_SCOPE = "https://graph.microsoft.com/Mail.Send offline_access";

export interface MicrosoftTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquant : requis pour l'integration Microsoft 365.`);
  return value;
}

function authorizeUrl(): string {
  const tenant = requireEnv("MICROSOFT_TENANT_ID");
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`;
}

function tokenUrl(): string {
  const tenant = requireEnv("MICROSOFT_TENANT_ID");
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
}

export function construireUrlAutorisationMicrosoft(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("MICROSOFT_CLIENT_ID"),
    redirect_uri: requireEnv("MICROSOFT_REDIRECT_URI"),
    response_type: "code",
    response_mode: "query",
    scope: GRAPH_SCOPE,
    state,
  });
  return `${authorizeUrl()}?${params.toString()}`;
}

export async function echangerCodeMicrosoft(code: string): Promise<MicrosoftTokens> {
  const body = new URLSearchParams({
    client_id: requireEnv("MICROSOFT_CLIENT_ID"),
    client_secret: requireEnv("MICROSOFT_CLIENT_SECRET"),
    redirect_uri: requireEnv("MICROSOFT_REDIRECT_URI"),
    code,
    grant_type: "authorization_code",
    scope: GRAPH_SCOPE,
  });
  const res = await fetch(tokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Echange de code Microsoft echoue : ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export async function rafraichirTokenMicrosoft(refreshToken: string): Promise<MicrosoftTokens> {
  const body = new URLSearchParams({
    client_id: requireEnv("MICROSOFT_CLIENT_ID"),
    client_secret: requireEnv("MICROSOFT_CLIENT_SECRET"),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: GRAPH_SCOPE,
  });
  const res = await fetch(tokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Rafraichissement du token Microsoft echoue : ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  return { accessToken: json.access_token, refreshToken, expiresAt: Date.now() + json.expires_in * 1000 };
}

export async function envoyerParGraph(
  tokens: MicrosoftTokens,
  message: { destinataire: string; sujet: string; corps: string },
): Promise<{ statutSmtp: string; messageId: string | null }> {
  const res = await fetch(GRAPH_SEND_MAIL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: message.sujet,
        body: { contentType: "HTML", content: message.corps },
        toRecipients: [{ emailAddress: { address: message.destinataire } }],
      },
    }),
  });
  if (res.status === 202) {
    return { statutSmtp: "envoye", messageId: null };
  }
  return { statutSmtp: `erreur: ${res.status} ${await res.text()}`, messageId: null };
}
