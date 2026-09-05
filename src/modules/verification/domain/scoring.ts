import type { FacteurScore, ResultatSmtp } from "@/modules/verification/domain/entities";

export interface EntreeScoring {
  resultatSmtp: ResultatSmtp;
  mxValide: boolean;
  ageDomaineJours: number | null;
  patternDomaineSuspect: boolean;
}

export interface SortieScoring {
  score: number;
  explication: FacteurScore[];
}

/**
 * Score de risque explique (cf. SPEC.md section 3.2) : plus le score
 * est eleve, plus le contact est risque a l'envoi. Chaque facteur
 * applique est trace dans l'explication, pour ne jamais afficher un
 * chiffre nu.
 */
export function calculerScoreRisque(entree: EntreeScoring): SortieScoring {
  const explication: FacteurScore[] = [];
  let score = 0;

  if (!entree.mxValide) {
    score += 40;
    explication.push({ facteur: "mx_invalide", poids: 40, detail: "Aucun enregistrement MX valide sur le domaine." });
  }

  if (entree.resultatSmtp === "invalide") {
    score += 60;
    explication.push({ facteur: "smtp_invalide", poids: 60, detail: "Le serveur SMTP rejette l'adresse." });
  } else if (entree.resultatSmtp === "catch_all") {
    score += 30;
    explication.push({
      facteur: "smtp_catch_all",
      poids: 30,
      detail: "Le domaine accepte tous les emails (catch-all) : impossible de confirmer l'adresse precise.",
    });
  } else if (entree.resultatSmtp === "inconnu") {
    score += 15;
    explication.push({ facteur: "smtp_inconnu", poids: 15, detail: "La verification SMTP n'a pas pu conclure." });
  }

  if (entree.patternDomaineSuspect) {
    score += 20;
    explication.push({
      facteur: "pattern_domaine_suspect",
      poids: 20,
      detail: "Le nom de domaine suit un pattern typique des domaines jetables ou generes automatiquement.",
    });
  }

  if (entree.ageDomaineJours !== null) {
    if (entree.ageDomaineJours < 30) {
      score += 25;
      explication.push({
        facteur: "domaine_recent",
        poids: 25,
        detail: `Domaine cree il y a ${entree.ageDomaineJours} jours (< 30 jours).`,
      });
    } else if (entree.ageDomaineJours < 90) {
      score += 10;
      explication.push({
        facteur: "domaine_jeune",
        poids: 10,
        detail: `Domaine cree il y a ${entree.ageDomaineJours} jours (< 90 jours).`,
      });
    }
  }

  return { score: Math.min(score, 100), explication };
}
