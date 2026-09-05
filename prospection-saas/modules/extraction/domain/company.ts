import type { CompanyId } from "@/kernel/ids";

export interface Company {
  id: CompanyId;
  domain: string;
  name: string;
  industry: string | null;
  sizeRange: string | null;
  country: string | null;
  linkedinUrl: string | null;
}

/** Normalise un domaine pour la déduplication (retire protocole, www, chemin, casse). */
export function normalizeDomain(rawDomain: string): string {
  const withoutProtocol = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] ?? withoutProtocol;
  return withoutPath.replace(/^www\./, "");
}
