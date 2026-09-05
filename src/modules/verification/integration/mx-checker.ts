import { resolveMx } from "node:dns/promises";
import type { MxChecker } from "@/modules/verification/domain/ports";
import { avecDelai } from "@/shared/integration/timeout";

const DELAI_DNS_MS = 5000;

export class DnsMxChecker implements MxChecker {
  async verifierMx(domaine: string): Promise<boolean> {
    const records = await avecDelai(
      resolveMx(domaine).catch(() => []),
      DELAI_DNS_MS,
      [] as Awaited<ReturnType<typeof resolveMx>>,
    );
    return records.length > 0;
  }
}
