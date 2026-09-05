# Conformite / domain

Entites et regles metier du module Conformite : `SuppressionEntree`,
`NotificationTemplate`, `AuditExport` (cf. SPEC.md section 3.3).

Regle centrale a porter ici, consommee par le module Envoi via
interface : une `SuppressionEntree` est unique par (`client_id`,
`email`) et s'applique a **toutes** les campagnes et listes de ce
client, jamais a un autre client. Le generateur de notification
conforme (multilingue) est en V2 (cf. SPEC.md section 6) ; le registre
de suppression et l'export d'audit sont en V1.
