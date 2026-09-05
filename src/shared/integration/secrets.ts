import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * Chiffrement au repos des secrets stockes en base (tokens OAuth,
 * identifiants SMTP) — exige par le DPA (legal/DPA-template.md,
 * Article 5). AES-256-GCM, cle derivee de APP_SECRET_KEY.
 */
function getKey(): Buffer {
  const secret = process.env.APP_SECRET_KEY;
  if (!secret) {
    throw new Error("APP_SECRET_KEY manquant : requis pour chiffrer les secrets de mailbox.");
  }
  return scryptSync(secret, "cold-email-saas-secrets", 32);
}

export function chiffrer(clair: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const chiffre = Buffer.concat([cipher.update(clair, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, chiffre]).toString("base64");
}

export function dechiffrer(valeur: string): string {
  const buf = Buffer.from(valeur, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const chiffre = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(chiffre), decipher.final()]).toString("utf-8");
}
