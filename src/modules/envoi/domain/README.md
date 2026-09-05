# Envoi / domain

Entites metier et regles pures du module Envoi, sans dependance a une
techno externe : `Mailbox`, `Domaine`, `Sequence`, `SequenceEtape`,
`Campagne`, `Enrollment`, `EnvoiEvenement` (cf. SPEC.md section 3.1).

Contient les interfaces de repository (ex: `EnrollmentRepository`)
implementees en `integration/`, jamais l'implementation elle-meme.

Regle metier centrale a porter ici : un `Enrollment` ne peut avancer
d'etape que si le contact ne figure pas dans le registre de
suppression du client (dependance vers le domaine du module
Conformite via une interface, pas un import direct).

`personnalisation/` : generateur de variantes A/B (objet + corps),
regles de copywriting et scoring statistique, adaptes du generateur
d'outboundDM-max au format email (cf. SPEC.md section 9).
