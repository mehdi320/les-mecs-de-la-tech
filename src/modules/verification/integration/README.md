# Verification / integration

Implementations concretes : verification SMTP (handshake sans envoi
reel), resolution et validation MX, heuristique d'age/pattern de
domaine (whois ou service tiers a choisir), acces SQLite aux tables
du module.

Le detail du fournisseur ou de la methode de verification SMTP est un
choix d'integration, pas une decision structurante du domaine : il
doit pouvoir changer sans toucher a `domain/`.
