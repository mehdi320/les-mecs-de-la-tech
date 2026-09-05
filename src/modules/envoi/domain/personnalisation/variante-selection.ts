import type { SequenceEtapeVariante } from "@/modules/envoi/domain/personnalisation/entities";

/**
 * Rotation equilibree entre variantes actives (adapte du round-robin
 * `buildQueue()` d'outboundDM-max, src/components/Queue.tsx) : plutot
 * qu'un index de lot, on choisit la variante la moins envoyee jusque
 * la (compteurs sur `EnvoiEvenement.variante_id`) — resilient a un
 * traitement par lots interrompu/relance, contrairement a un simple
 * `i % nb_variantes`.
 */
export function choisirVarianteEquilibree(
  variantesActives: SequenceEtapeVariante[],
  envoisParVarianteId: Record<string, number>,
): SequenceEtapeVariante {
  if (variantesActives.length === 0) {
    throw new Error("Aucune variante active a choisir.");
  }
  return variantesActives.reduce((moinsEnvoyee, courante) => {
    const compteCourant = envoisParVarianteId[courante.id] ?? 0;
    const compteMoinsEnvoyee = envoisParVarianteId[moinsEnvoyee.id] ?? 0;
    return compteCourant < compteMoinsEnvoyee ? courante : moinsEnvoyee;
  });
}
