import type { Longueur, SequenceEtapeVariante, StatutVariante, Structure, Tone } from "@/modules/envoi/domain/personnalisation/entities";

export interface SequenceEtapeVarianteRepository {
  listBySequenceEtape(sequenceEtapeId: string): SequenceEtapeVariante[];
  findById(id: string): SequenceEtapeVariante | null;
  create(input: {
    sequenceEtapeId: string;
    nom: string;
    sujet: string;
    corps: string;
    structure: Structure;
    longueur: Longueur;
    tone: Tone;
    champsPersonnalisationRequis: string[];
  }): SequenceEtapeVariante;
  updateStatut(id: string, statut: StatutVariante): void;
  delete(id: string): void;
}
