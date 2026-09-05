import type { EnrollmentStatut, EnvoiEvenement } from "@/modules/envoi/domain/entities";

/**
 * Statut visuel (smiley) d'un enrollment, cf. SPEC.md section 9.7.
 * Echelle choisie par l'utilisateur, pas un score d'engagement croissant :
 * repondu > envoye > ouvert > echec.
 */
export type StatutVisuel = "echec" | "envoye" | "ouvert" | "repondu";

export function statutVisuelEnrollment(
  statutEnrollment: EnrollmentStatut,
  evenements: EnvoiEvenement[],
): StatutVisuel | null {
  if (statutEnrollment === "repondu") return "repondu";

  const dernier = evenements[evenements.length - 1];
  if (!dernier) return null; // rien envoye pour l'instant (en_attente) : pas de smiley

  if (dernier.statutSmtp.startsWith("erreur")) return "echec";
  if (dernier.ouvertAt) return "ouvert";
  return "envoye";
}
