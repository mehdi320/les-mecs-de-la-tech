import type { SuppressionChecker } from "@/shared/domain/suppression-checker";
import type { SuppressionRepository } from "@/modules/conformite/domain/repositories";

/**
 * Seule implementation de `SuppressionChecker` (cf. SPEC.md section
 * 2) : consommee par les modules Envoi et Verification via
 * l'interface partagee, jamais par acces direct a ce module.
 */
export class RepositorySuppressionChecker implements SuppressionChecker {
  constructor(private readonly repository: SuppressionRepository) {}

  estSupprime(clientId: string, email: string): boolean {
    return this.repository.estPresent(clientId, email.trim().toLowerCase());
  }
}
