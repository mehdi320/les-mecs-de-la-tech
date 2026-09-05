/**
 * Diagnostic de sous-performance par cause (cf. SPEC.md section 3.4,
 * trou concurrentiel #3 : "diagnostic par cause, pas de taux bruts
 * seuls"). Regles a seuils, pas de machine learning — les seuils
 * ci-dessous sont explicitement provisoires (meme esprit que
 * `personnalisation/scoring.ts` : la logique de diagnostic est
 * correcte des maintenant, les valeurs numeriques restent a valider
 * sur des donnees reelles avant mise en prod).
 *
 * Calcule a la volee a chaque affichage, jamais persiste : plus
 * simple pour un premier jet, et toujours a jour. SPEC.md section 3.4
 * prevoit une table `DiagnosticPerformance` persistee — pas necessaire
 * tant que le calcul reste rapide (agregats sur quelques centaines de
 * lignes au plus au stade actuel).
 */

export type CauseSousPerformance = "delivrabilite" | "contenu" | "ciblage" | "aucune";

export interface MetriquesEntreeCampagne {
  envoyes: number;
  echecs: number;
  ouverts: number;
  repondus: number;
  /** null si la liste n'a pas encore ete verifiee ou n'a pas de contact score. */
  scoreRisqueMoyenListe: number | null;
  /** null si aucun domaine associe trouve pour la mailbox utilisee. */
  domaineAuthValide: boolean | null;
}

export interface DiagnosticPerformance {
  cause: CauseSousPerformance;
  tauxEchec: number;
  tauxOuverture: number;
  tauxReponse: number;
  recommandation: string;
}

// --- Seuils provisoires, a valider sur donnees reelles avant mise en prod ---
export const ENVOIS_MIN_DIAGNOSTIC = 20;
export const SEUIL_TAUX_ECHEC_ELEVE = 0.15;
export const SEUIL_TAUX_OUVERTURE_FAIBLE = 0.2;
export const SEUIL_TAUX_REPONSE_FAIBLE = 0.02;
export const SEUIL_SCORE_RISQUE_ELEVE = 50;

function ratio(numerateur: number, denominateur: number): number {
  if (denominateur <= 0) return 0;
  return numerateur / denominateur;
}

export function diagnostiquer(m: MetriquesEntreeCampagne): DiagnosticPerformance {
  const envoisReussis = m.envoyes - m.echecs;
  const tauxEchec = ratio(m.echecs, m.envoyes);
  const tauxOuverture = ratio(m.ouverts, envoisReussis);
  const tauxReponse = ratio(m.repondus, envoisReussis);

  if (m.envoyes < ENVOIS_MIN_DIAGNOSTIC) {
    return {
      cause: "aucune",
      tauxEchec,
      tauxOuverture,
      tauxReponse,
      recommandation: `Pas assez d'envois pour diagnostiquer (${m.envoyes}/${ENVOIS_MIN_DIAGNOSTIC} minimum indicatif).`,
    };
  }

  if (tauxEchec >= SEUIL_TAUX_ECHEC_ELEVE) {
    return {
      cause: "delivrabilite",
      tauxEchec,
      tauxOuverture,
      tauxReponse,
      recommandation: `Taux d'echec d'envoi eleve (${Math.round(tauxEchec * 100)}%) — verifiez la configuration SPF/DKIM/DMARC du domaine et l'etat de la mailbox avant toute autre optimisation.`,
    };
  }

  if (tauxOuverture < SEUIL_TAUX_OUVERTURE_FAIBLE) {
    if (m.domaineAuthValide === false) {
      return {
        cause: "delivrabilite",
        tauxEchec,
        tauxOuverture,
        tauxReponse,
        recommandation: `Taux d'ouverture faible (${Math.round(tauxOuverture * 100)}%) et authentification de domaine invalide — les emails atterrissent probablement en spam plutot que d'etre ignores.`,
      };
    }
    return {
      cause: "contenu",
      tauxEchec,
      tauxOuverture,
      tauxReponse,
      recommandation: `Taux d'ouverture faible (${Math.round(tauxOuverture * 100)}%) malgre une authentification de domaine correcte — l'objet ne donne probablement pas envie d'ouvrir. Testez d'autres variantes d'objet.`,
    };
  }

  if (tauxReponse < SEUIL_TAUX_REPONSE_FAIBLE) {
    if (m.scoreRisqueMoyenListe !== null && m.scoreRisqueMoyenListe >= SEUIL_SCORE_RISQUE_ELEVE) {
      return {
        cause: "ciblage",
        tauxEchec,
        tauxOuverture,
        tauxReponse,
        recommandation: `Bon taux d'ouverture mais peu de reponses, et score de risque moyen eleve sur la liste (${Math.round(m.scoreRisqueMoyenListe)}/100) — le ciblage (qualite de la liste) est probablement en cause avant le message lui-meme.`,
      };
    }
    return {
      cause: "contenu",
      tauxEchec,
      tauxOuverture,
      tauxReponse,
      recommandation: "Bon taux d'ouverture mais peu de reponses — le corps ou le CTA ne convertit pas l'attention en reponse. Testez un CTA plus direct ou un angle different.",
    };
  }

  return {
    cause: "aucune",
    tauxEchec,
    tauxOuverture,
    tauxReponse,
    recommandation: "Pas de signal de sous-performance marque sur les seuils indicatifs actuels.",
  };
}
