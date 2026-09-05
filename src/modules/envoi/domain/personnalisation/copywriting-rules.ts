// Regles de cold outreach B2B appliquees au generateur de variantes,
// portees et adaptees depuis outboundDM-max
// (.claude/skills/dm-prospecting/, src/utils/copywritingRules.ts) au
// format email : objet + corps genere ensemble, registre par defaut
// vouvoiement (norme du cold email B2B francais, contre le
// tutoiement par defaut du skill DM), et regles specifiques a
// l'objet (lintSujet). Cf. SPEC.md section 9.
//
// Tout ce qui peut etre corrige mecaniquement sans risquer de casser
// la grammaire l'est automatiquement (genere par genererVariantesEmail
// dans generator.ts). Ce qui releve du jugement (ex : la colonne
// personnalisee vraiment connectee au probleme) est signale via
// lintCorps()/lintSujet() pour que l'humain tranche avant d'activer
// la variante.

import { countMatches, splitSentences } from "./text";

export interface LintIssue {
  code: string;
  message: string;
}

function phraseRegex(phrase: string, flags = "iu"): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, flags);
}

// --- Pronoms : le prospect doit dominer ---
const SELF_PRONOUNS = ["je", "j'ai", "moi", "mon", "ma", "mes", "nous", "notre", "nos"];
const PROSPECT_PRONOUNS = [
  "tu",
  "toi",
  "ton",
  "ta",
  "tes",
  "te",
  "t'as",
  "t'es",
  "vous",
  "votre",
  "vos",
];

// Ouvertures reference-activite : deux variantes selon qu'une colonne
// de personnalisation ({dernier_post}, {actualite_entreprise}, etc.)
// a ete detectee dans le texte de reference — jamais de donnee
// inventee, cf. SPEC.md section 9.1/9.2. `{{ANCRE}}` est remplace par
// le token detecte (ex: "{dernier_post}") avant utilisation.
// Ecrits pour ne jamais reintroduire de pronom auto-centre (je/j'ai/
// mon...) et ajouter plutot un "vous"/"votre" : sinon la recentration
// (ensureProspectFirst) ajoute du texte sans corriger le desequilibre
// qu'elle est censee resoudre. Jamais de "?" final : normalizeSingleCta
// retire toute question qui n'est pas le CTA ajoute en dernier, une
// ouverture interrogative ici disparaitrait silencieusement.
const PROBLEM_LINK_OPENERS_AVEC_ANCRE = [
  "En regardant {{ANCRE}}, un point a retenu l'attention — c'est souvent le signe d'un vrai sujet a debloquer.",
  "{{ANCRE}} a interpelle — c'est exactement le genre de sujet qui prend plus de temps que prevu a traiter seul.",
  "Vu {{ANCRE}}, ce sujet vous prend probablement plus de temps que prevu en ce moment.",
];

const PROBLEM_LINK_OPENERS_SANS_ANCRE = [
  "Un point sur votre activite recente a retenu l'attention — c'est souvent le signe d'un vrai sujet a debloquer.",
  "Quelque chose dans votre activite recente a interpelle — c'est le genre de sujet qui prend plus de temps que prevu a traiter seul.",
  "Un sujet en particulier vous prend probablement plus de temps que prevu en ce moment.",
];

function choisirOuverture(ancre: string | null, seed: number): string {
  const banque = ancre ? PROBLEM_LINK_OPENERS_AVEC_ANCRE : PROBLEM_LINK_OPENERS_SANS_ANCRE;
  const modele = banque[seed % banque.length]!;
  return ancre ? modele.replace("{{ANCRE}}", ancre) : modele;
}

// Recentre le message sur le prospect si "je" y domine, en ancrant
// l'accroche sur la colonne personnalisee detectee (si disponible).
export function ensureProspectFirst(text: string, ancre: string | null, seed: number): string {
  const selfCount = countMatches(text, SELF_PRONOUNS);
  const prospectCount = countMatches(text, PROSPECT_PRONOUNS);
  if (selfCount === 0 || selfCount <= prospectCount) return text;
  return `${choisirOuverture(ancre, seed)}\n\n${text.trim()}`;
}

export function prependProblemLinkedOpener(text: string, ancre: string | null, seed: number): string {
  return `${choisirOuverture(ancre, seed)}\n\n${text.trim()}`;
}

// --- CTA : un seul, a faible friction (vouvoiement par defaut) ---
const LOW_FRICTION_QUESTIONS = [
  "Ca vous parle ?",
  "Vous en pensez quoi ?",
  "Ca vaut le coup d'en discuter ?",
  "Je peux vous montrer rapidement ?",
  "Curieux d'avoir votre avis ?",
];

const LOW_FRICTION_STATEMENTS = [
  "Dites-moi si ca vous parle.",
  "Curieux d'avoir votre retour.",
  "Faites-moi signe si ca vous interesse.",
];

export const HIGH_FRICTION_CTA_TRIGGERS = [
  phraseRegex("un appel"),
  phraseRegex("un call"),
  phraseRegex("15 minutes"),
  phraseRegex("30 minutes"),
  phraseRegex("un rdv"),
  phraseRegex("un rendez-vous"),
  phraseRegex("rendez-vous"),
  phraseRegex("on se cale"),
  phraseRegex("caler un"),
  phraseRegex("planifier un"),
  phraseRegex("reserver un creneau"),
  phraseRegex("calendly"),
];

// Supprime entierement les phrases qui portent une demande a forte
// friction (call, rdv, creneau...) plutot que de simplement desamorcer
// leur "?" — sinon la phrase reste comme affirmation bancale.
export function stripHighFrictionCtaSentences(text: string): string {
  const sentences = splitSentences(text);
  return sentences.filter((s) => !HIGH_FRICTION_CTA_TRIGGERS.some((re) => re.test(s))).join(" ");
}

// Retire toute question residuelle du corps puis ajoute un unique CTA
// a faible friction, question ou affirmation selon la structure.
export function normalizeSingleCta(text: string, wantsQuestion: boolean, seed: number): string {
  const sentences = splitSentences(text);
  const withoutQuestions = sentences.filter((s) => !s.trim().endsWith("?"));
  const body =
    withoutQuestions.length > 0
      ? withoutQuestions.join(" ").trim()
      : sentences.map((s) => s.replace(/\?+\s*$/, ".")).join(" ").trim();
  const cta = wantsQuestion
    ? LOW_FRICTION_QUESTIONS[seed % LOW_FRICTION_QUESTIONS.length]
    : LOW_FRICTION_STATEMENTS[seed % LOW_FRICTION_STATEMENTS.length];
  return `${body} ${cta}`.trim();
}

function removeSentencesMatching(text: string, triggers: RegExp[]): string {
  const sentences = splitSentences(text);
  return sentences.filter((s) => !triggers.some((re) => re.test(s))).join(" ");
}

// --- Formules figees façon IA generique / email generique ---
const REMOVABLE_FILLER_SENTENCE_TRIGGERS: { pattern: RegExp; label: string }[] = [
  { pattern: phraseRegex("j'espere que ce message vous trouve bien"), label: "j'espere que ce message vous trouve bien" },
  { pattern: phraseRegex("j'espere que ce mail vous trouve bien"), label: "j'espere que ce mail vous trouve bien" },
  { pattern: phraseRegex("j'espere que vous allez bien"), label: "j'espere que vous allez bien" },
  { pattern: phraseRegex("je reste a votre disposition"), label: "je reste a votre disposition" },
  { pattern: phraseRegex("dans l'attente de votre retour"), label: "dans l'attente de votre retour" },
];

export function stripFillerSentences(text: string): string {
  return removeSentencesMatching(text, REMOVABLE_FILLER_SENTENCE_TRIGGERS.map((t) => t.pattern));
}

// --- Flatterie generique en ouverture ---
const FLATTERY_TRIGGERS: { pattern: RegExp; label: string }[] = [
  { pattern: phraseRegex("j'adore votre contenu"), label: "j'adore votre contenu" },
  { pattern: phraseRegex("j'adore ce que vous faites"), label: "j'adore ce que vous faites" },
  { pattern: phraseRegex("felicitations pour"), label: "felicitations pour" },
  { pattern: phraseRegex("super contenu"), label: "super contenu" },
];

export function stripFlatteryOpeners(text: string): string {
  return removeSentencesMatching(text, FLATTERY_TRIGGERS.map((t) => t.pattern));
}

// --- Urgence artificielle ---
const URGENCY_TRIGGERS: { pattern: RegExp; label: string }[] = [
  { pattern: phraseRegex("plus que quelques places"), label: "plus que quelques places" },
  { pattern: phraseRegex("offre limitee"), label: "offre limitee" },
  { pattern: phraseRegex("derniere chance"), label: "derniere chance" },
  { pattern: phraseRegex("aujourd'hui seulement"), label: "aujourd'hui seulement" },
  { pattern: phraseRegex("ne ratez pas"), label: "ne ratez pas" },
];

export function stripUrgencyLanguage(text: string): string {
  return removeSentencesMatching(text, URGENCY_TRIGGERS.map((t) => t.pattern));
}

// --- Prix/offre : a garder pour une relance dediee ---
const PRICING_TRIGGERS: RegExp[] = [
  /\d+\s?(€|\$|eur\b|euros?|dollars?)/iu,
  phraseRegex("tarif"),
  phraseRegex("abonnement"),
  phraseRegex("forfait"),
  phraseRegex("facture"),
];

export function stripPricingDetails(text: string): string {
  return removeSentencesMatching(text, PRICING_TRIGGERS);
}

// --- Emoji : email B2B, tolerance nulle par defaut (contre 1 en DM) ---
const EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;

export function capEmojis(text: string): string {
  return text.replace(EMOJI_PATTERN, "");
}

// --- Jargon corporate ---
const JARGON_REPLACEMENTS: [phrase: string, fix: string][] = [
  ["leverage", "utiliser"],
  ["synergie", "collaboration"],
  ["best-in-class", "parmi les meilleurs"],
  ["proactif", "a l'affut"],
  ["disruptif", "different"],
  ["scalable", "qui grandit facilement"],
  ["a valeur ajoutee", "utile"],
  ["actionnable", "concret"],
  ["impactant", "efficace"],
];

export function stripJargon(text: string): string {
  return JARGON_REPLACEMENTS.reduce((acc, [phrase, fix]) => acc.replace(phraseRegex(phrase, "giu"), fix), text);
}

const FLAG_ONLY_PHRASES: { pattern: RegExp; label: string }[] = [
  { pattern: phraseRegex("n'hesitez pas a"), label: "n'hesitez pas a" },
];

const PROBLEM_INDICATOR_STEMS = [
  "probleme",
  "galere",
  "compliqu",
  "perdre du temps",
  "perd du temps",
  "prend du temps",
  "prend plus de temps",
  "temps que prevu",
  "bloque",
  "bloquant",
  "difficile",
  "chronophage",
  "casse-tete",
  "frein",
  "manque de temps",
  "coince",
  "coute cher",
  "coute du temps",
];

export function lintCorps(text: string): LintIssue[] {
  const issues: LintIssue[] = [];

  const selfCount = countMatches(text, SELF_PRONOUNS);
  const prospectCount = countMatches(text, PROSPECT_PRONOUNS);
  if (selfCount > 0 && selfCount > prospectCount) {
    issues.push({ code: "self_dominant", message: 'Le "je" domine sur le "vous" — recentre sur le prospect.' });
  }

  const sentences = splitSentences(text);
  const questionCount = sentences.filter((s) => s.trim().endsWith("?")).length;
  if (questionCount > 1) {
    issues.push({ code: "multi_cta", message: "Plusieurs questions detectees — n'en garde qu'une comme CTA." });
  }

  if (HIGH_FRICTION_CTA_TRIGGERS.some((re) => re.test(text))) {
    issues.push({
      code: "high_friction_cta",
      message: "CTA a forte friction detecte (appel/rdv) — prefere une question ouverte legere.",
    });
  }

  for (const { pattern, label } of FLAG_ONLY_PHRASES) {
    if (pattern.test(text)) issues.push({ code: "flagged_phrase", message: `Tournure a eviter : "${label}".` });
  }
  for (const [phrase] of JARGON_REPLACEMENTS) {
    if (phraseRegex(phrase).test(text)) issues.push({ code: "jargon", message: `Jargon corporate detecte : "${phrase}".` });
  }
  for (const { pattern, label } of REMOVABLE_FILLER_SENTENCE_TRIGGERS) {
    if (pattern.test(text)) issues.push({ code: "ai_filler", message: `Formule generique detectee : "${label}".` });
  }
  for (const { pattern, label } of FLATTERY_TRIGGERS) {
    if (pattern.test(text)) issues.push({ code: "flattery", message: `Flatterie generique detectee : "${label}".` });
  }
  for (const { pattern, label } of URGENCY_TRIGGERS) {
    if (pattern.test(text)) issues.push({ code: "urgency", message: `Langage d'urgence detecte : "${label}".` });
  }
  if (PRICING_TRIGGERS.some((re) => re.test(text))) {
    issues.push({
      code: "pricing_in_opener",
      message: "Detail de prix/offre detecte — garde-le pour une relance dediee.",
    });
  }

  const emojiCount = (text.match(EMOJI_PATTERN) ?? []).length;
  if (emojiCount > 0) {
    issues.push({ code: "emoji_email", message: "Emoji detecte — a eviter en cold email B2B." });
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 130) {
    issues.push({ code: "too_long", message: `${wordCount} mots — un cold email vise plutot 60-120 mots.` });
  }

  const matchesPersonnalisation = text.match(/\{[a-z0-9_]+\}/giu) ?? [];
  for (const token of matchesPersonnalisation) {
    const phraseSentence = sentences.find((s) => s.includes(token)) ?? text;
    const lower = phraseSentence.toLowerCase();
    const hasProblemLink = PROBLEM_INDICATOR_STEMS.some((stem) => lower.includes(stem));
    if (!hasProblemLink) {
      issues.push({
        code: "personnalisation_decorative",
        message: `${token} semble decoratif — connecte-le explicitement au probleme du prospect.`,
      });
    }
  }

  return issues;
}

export function lintSujet(sujet: string): LintIssue[] {
  const issues: LintIssue[] = [];

  if (sujet === sujet.toUpperCase() && /[A-Z]/.test(sujet)) {
    issues.push({ code: "sujet_majuscules", message: "Objet tout en majuscules — signal spam pour les filtres." });
  }
  const exclamations = (sujet.match(/!/g) ?? []).length;
  if (exclamations > 0) {
    issues.push({ code: "sujet_exclamation", message: "Point d'exclamation dans l'objet — a eviter (deliverabilite)." });
  }
  if (sujet.length > 60) {
    issues.push({ code: "sujet_trop_long", message: `Objet de ${sujet.length} caracteres — vise 30-50 pour l'affichage mobile.` });
  }
  if (PRICING_TRIGGERS.some((re) => re.test(sujet))) {
    issues.push({ code: "sujet_prix", message: "Detail de prix dans l'objet — a eviter." });
  }

  return issues;
}
