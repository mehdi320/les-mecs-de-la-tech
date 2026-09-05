import nodemailer from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export async function verifierConnexionSmtp(config: SmtpConfig): Promise<{ ok: boolean; erreur?: string }> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  try {
    await transporter.verify();
    return { ok: true };
  } catch (erreur) {
    return { ok: false, erreur: erreur instanceof Error ? erreur.message : String(erreur) };
  }
}

export async function envoyerParSmtp(
  config: SmtpConfig,
  message: { destinataire: string; sujet: string; corps: string },
): Promise<{ statutSmtp: string; messageId: string | null }> {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  try {
    const info = await transporter.sendMail({
      from: config.user,
      to: message.destinataire,
      subject: message.sujet,
      html: message.corps,
    });
    return { statutSmtp: "envoye", messageId: info.messageId ?? null };
  } catch (erreur) {
    return { statutSmtp: `erreur: ${erreur instanceof Error ? erreur.message : String(erreur)}`, messageId: null };
  }
}
