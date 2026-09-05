import { resolveTxt } from "node:dns/promises";
import type { DomaineAuthStatut } from "@/modules/envoi/domain/entities";
import { avecDelai } from "@/shared/integration/timeout";

const DELAI_DNS_MS = 5000;

/**
 * Verification SPF/DMARC en lecture seule par requete DNS TXT (cf.
 * SPEC.md section 6 : peut migrer en V1 car prerequis de fiabilite
 * de l'Envoi). DKIM n'est pas verifiable de facon generique sans
 * connaitre le selecteur choisi par le client — reste `inconnu` ici,
 * a completer quand le client peut renseigner son selecteur DKIM.
 */
export async function verifierAuthDomaine(nomDomaine: string): Promise<{
  spf: DomaineAuthStatut;
  dkim: DomaineAuthStatut;
  dmarc: DomaineAuthStatut;
}> {
  const spf = await verifierTxtContient(nomDomaine, "v=spf1");
  const dmarc = await verifierTxtContient(`_dmarc.${nomDomaine}`, "v=DMARC1");
  return { spf, dkim: "inconnu", dmarc };
}

async function verifierTxtContient(nom: string, prefixe: string): Promise<DomaineAuthStatut> {
  const enregistrements = await avecDelai<string[][] | null>(
    resolveTxt(nom).catch(() => null),
    DELAI_DNS_MS,
    null,
  );
  if (enregistrements === null) return "inconnu";
  const trouve = enregistrements.some((lignes) => lignes.join("").startsWith(prefixe));
  return trouve ? "valide" : "invalide";
}
