# app/api/webhooks

Point d'entree Next.js pour les webhooks entrants (reponses,
bounces, conversions) qui alimentent le module Delivrabilite
(`ReponseEvenement`, cf. SPEC.md section 3.4). Route uniquement,
delegue immediatement au cas d'usage expose par
`src/modules/delivrabilite/domain`.
