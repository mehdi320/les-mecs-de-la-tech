# Envoi / integration

Implementations concretes des interfaces definies en `domain/` :
acces SQLite aux tables du module Envoi, client OAuth Google Workspace
/ Microsoft Graph, client SMTP/IMAP generique, moteur de programmation
d'envoi (respect des fenetres horaires multi-fuseaux et des quotas
par mailbox).

Toute integration avec un fournisseur tiers (OAuth, SMTP, futur relais
d'envoi propre / IP dediee, cf. SPEC.md section 7) vit ici, jamais
dans `domain/` ni `presentation/`.
