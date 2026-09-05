# Delivrabilite / domain

Entites et regles metier du module Delivrabilite et Boucle :
`DomaineAuthRecord`, `IPDediee`, `WarmupPlan`, `DiagnosticPerformance`,
`ReponseEvenement`, `SegmentScore` (cf. SPEC.md section 3.4).

Module V2 (cf. SPEC.md section 6), sauf le suivi SPF/DKIM/DMARC en
lecture seule qui pourrait migrer en V1 si le temps le permet.
Regle centrale a porter ici : le diagnostic classe la
sous-performance par cause racine (delivrabilite / contenu / ciblage),
jamais par simple taux brut d'ouverture ou de reponse.
