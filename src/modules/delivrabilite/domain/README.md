# Delivrabilite / domain

Entites et regles metier du module Delivrabilite et Boucle :
`DomaineAuthRecord`, `IPDediee`, `WarmupPlan`, `DiagnosticPerformance`,
`ReponseEvenement`, `SegmentScore` (cf. SPEC.md section 3.4).

Module V2 (cf. SPEC.md section 6), sauf trois tranches deja codees en
avance de perimetre (cf. SPEC.md section 9.7/9.8) :

- `tracking-pixel.ts` : construction/injection du pixel de suivi
  d'ouverture (le suivi SPF/DKIM/DMARC en lecture seule vit lui dans
  `envoi/integration/domaine-auth-checker.ts`, deja code egalement).
- `diagnostic-performance.ts` : `diagnostiquer()`, calcule a la volee
  (pas de table `DiagnosticPerformance` persistee pour l'instant).
  Regle centrale : classer la sous-performance par cause racine
  (delivrabilite / contenu / ciblage), jamais par simple taux brut.

`IPDediee`, `WarmupPlan`, `SegmentScore`, et la persistance du
diagnostic restent V2, non codes.
