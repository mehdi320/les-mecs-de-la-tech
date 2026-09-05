// Ported et adapte depuis outboundDM-max (src/utils/generator.ts),
// format email (objet + corps generes ensemble) au lieu du format DM
// (message unique). Cf. SPEC.md section 9.

import type { Longueur, Structure, Tone, VarianteGeneree } from "@/modules/envoi/domain/personnalisation/entities";
import { applyReplacements, splitSentences } from "@/modules/envoi/domain/personnalisation/text";
import {
  capEmojis,
  ensureProspectFirst,
  normalizeSingleCta,
  prependProblemLinkedOpener,
  stripFillerSentences,
  stripFlatteryOpeners,
  stripHighFrictionCtaSentences,
  stripJargon,
  stripPricingDetails,
  stripUrgencyLanguage,
} from "@/modules/envoi/domain/personnalisation/copywriting-rules";
import { extraireChampsPersonnalisation } from "@/shared/domain/template";

// Vouvoiement <-> tutoiement : le resultat est a relire avant
// activation, comme le reste de ce generateur (aucune variante n'est
// activee automatiquement). Les verbes a objet direct/indirect
// ("vous dire" -> "te dire", jamais "tu dire") sont traites en phrases
// specifiques AVANT le remplacement generique "vous"/"tu", qui ne
// couvre que l'emploi sujet — sans ces cas, le remplacement generique
// produit des tournures agrammaticales ("tu aider" au lieu de
// "t'aider"). Liste non exhaustive : reste a relire avant envoi.
const VOUS_TO_TU: [string, string][] = [
  ["vous etes", "tu es"],
  ["vous avez", "tu as"],
  ["vous pouvez", "tu peux"],
  ["vous voulez", "tu veux"],
  ["vous pensez", "tu penses"],
  ["vous dire", "te dire"],
  ["vous aider", "t'aider"],
  ["vous montrer", "te montrer"],
  ["vous parler", "te parler"],
  ["vous demander", "te demander"],
  ["vous envoyer", "t'envoyer"],
  ["vous proposer", "te proposer"],
  ["vous-meme", "toi-meme"],
  ["votre", "ton"],
  ["vos", "tes"],
  ["avec vous", "avec toi"],
  ["pour vous", "pour toi"],
  ["chez vous", "chez toi"],
  ["vous", "tu"],
  ["bonjour", "hey"],
];

const TU_TO_VOUS: [string, string][] = [
  ["tu as", "vous avez"],
  ["tu es", "vous etes"],
  ["tu peux", "vous pouvez"],
  ["tu veux", "vous voulez"],
  ["tu penses", "vous pensez"],
  ["te dire", "vous dire"],
  ["t'aider", "vous aider"],
  ["te montrer", "vous montrer"],
  ["te parler", "vous parler"],
  ["te demander", "vous demander"],
  ["t'envoyer", "vous envoyer"],
  ["te proposer", "vous proposer"],
  ["toi-meme", "vous-meme"],
  ["ton", "votre"],
  ["ta", "votre"],
  ["tes", "vos"],
  ["toi", "vous"],
  ["te", "vous"],
  ["tu", "vous"],
  ["hey", "bonjour"],
];

// Version courte : garde l'accroche + la derniere phrase (souvent le
// CTA), sans reecrire le fond.
function buildCourte(sentences: string[]): string {
  if (sentences.length <= 2) return sentences.join(" ");
  const first = sentences[0]!;
  const last = sentences[sentences.length - 1]!;
  return first === last ? first : `${first} ${last}`;
}

function buildSujetVariante(sujetReference: string, structure: Structure, ancre: string | null): string {
  const propre = sujetReference.trim();
  if (structure === "reference_activite" && ancre) {
    return `${ancre} — ${propre}`;
  }
  if (structure === "question_ouverte" && !propre.endsWith("?")) {
    return `${propre} ?`;
  }
  return propre;
}

interface Combo {
  structure: Structure;
  longueur: Longueur;
  tone: Tone;
}

// 5 combinaisons ou (structure, longueur) n'est jamais repete : le
// ton (formel/familier) n'est applique que sur des combos par
// ailleurs deja uniques, pour ne jamais faire varier le ton seul —
// une variante de meme longueur/structure avec un simple changement
// de mots n'est pas un vrai test A/B (regle du skill dm-prospecting).
const COMBOS: Combo[] = [
  { structure: "question_ouverte", longueur: "courte", tone: "neutre" },
  { structure: "affirmation_directe", longueur: "courte", tone: "neutre" },
  { structure: "reference_activite", longueur: "developpee", tone: "neutre" },
  { structure: "question_ouverte", longueur: "developpee", tone: "formel" },
  { structure: "reference_activite", longueur: "courte", tone: "familier" },
];

/**
 * Genere 5 variantes (objet + corps) qui gardent le fond du message
 * de reference mais varient la forme : longueur, structure
 * d'ouverture, et (jamais seul) le ton. N'invente aucune donnee : la
 * colonne de personnalisation utilisee pour "reference_activite" est
 * detectee dans le texte de reference lui-meme (`{colonne}`), jamais
 * fabriquee ni recuperee par scraping (cf. SPEC.md section 9.1/9.2).
 */
export function genererVariantesEmail(sujetReference: string, corpsReference: string): VarianteGeneree[] {
  const sujetPropre = sujetReference.trim();
  const corpsPropre = corpsReference.trim();
  if (!sujetPropre || !corpsPropre) return [];

  const champs = extraireChampsPersonnalisation(corpsPropre);
  const ancre = champs.length > 0 ? `{${champs[0]}}` : null;

  const sentences = splitSentences(corpsPropre);
  const courteBase = buildCourte(sentences);

  return COMBOS.map(({ structure, longueur, tone }, i) => {
    let corps = longueur === "courte" ? courteBase : corpsPropre;

    if (structure === "reference_activite") {
      corps = prependProblemLinkedOpener(corps, ancre, i);
    }

    corps = stripFillerSentences(corps);
    corps = stripFlatteryOpeners(corps);
    corps = stripUrgencyLanguage(corps);
    corps = stripPricingDetails(corps);
    corps = stripHighFrictionCtaSentences(corps);
    corps = stripJargon(corps);
    corps = capEmojis(corps);

    corps = normalizeSingleCta(corps, structure !== "affirmation_directe", i);

    if (structure !== "reference_activite") {
      corps = ensureProspectFirst(corps, ancre, i);
    }

    if (tone === "formel") {
      corps = applyReplacements(corps, TU_TO_VOUS);
    } else if (tone === "familier") {
      corps = applyReplacements(corps, VOUS_TO_TU);
    }

    let sujet = buildSujetVariante(sujetPropre, structure, ancre);
    if (tone === "formel") sujet = applyReplacements(sujet, TU_TO_VOUS);
    else if (tone === "familier") sujet = applyReplacements(sujet, VOUS_TO_TU);

    return { sujet, corps, structure, longueur, tone };
  });
}
