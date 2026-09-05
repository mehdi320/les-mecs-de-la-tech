# Verification / domain

Entites et regles metier du module Verification : `ListeImportee`,
`Contact`, `VerificationResultat` (cf. SPEC.md section 3.2).

Contient la logique de calcul du score de risque (pondération des
facteurs : resultat SMTP, MX valides, age et pattern du domaine) et
la structure de son explication (`score_explication_json`) — la regle
"le score doit toujours etre explicable" vit ici, independamment du
fournisseur technique de verification SMTP utilise en `integration/`.
