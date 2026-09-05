# Décisions bloquantes avant la première ligne de code

Trois décisions. Tant qu'elles ne sont pas tranchées, aucun code applicatif ne doit être écrit — seuls `SPEC.md`, `ARBORESCENCE.md` et ce document existent à ce stade.

---

## Décision 1 — Construire ou déléguer l'extraction LinkedIn en V1

**Options**

| Option | Avantage | Coût / risque |
|---|---|---|
| Déléguer à Apollo API | API officielle, conditions contractuelles claires, pas d'exposition directe aux conditions d'utilisation de LinkedIn | Dépendance à un fournisseur tiers pour la donnée cœur du produit, couverture éventuellement incomplète sur certains secteurs/pays |
| Déléguer à un actor Apify tiers | Couvre des cas qu'Apollo ne couvre pas (recherche par profil précis, données non indexées par Apollo) | Le point le plus exposé légalement du produit — voir `SPEC.md` section 5.1 et 5.2, deux sanctions CNIL sur ce pattern précis (Kaspr 240k€, Nestor 20k€) |
| Construire un scraper interne | Contrôle total, pas de dépendance externe | Expose directement l'éditeur du produit (et non plus un prestataire) aux conditions d'utilisation de LinkedIn et au RGPD, sans aucun avis juridique reçu à ce jour |

**Recommandation de cadrage** (déjà actée dans le brief initial, reprise ici pour mémoire) : déléguer en V1, Apollo API en premier choix, ne pas construire en interne. Reste à trancher : Apollo seul, ou Apollo + un actor Apify en complément.

**Ce qui manque pour trancher définitivement** : l'avis juridique externe sur `SPEC.md` section 5.1/5.2. Une décision technique prise avant cet avis reste provisoire.

---

## Décision 2 — Quel fournisseur de vérification croiser en waterfall

**Candidats identifiés avec API publique documentée** (détail complet et sources dans `SPEC.md` section 3.2) : MillionVerifier, Bouncer, ZeroBounce, NeverBounce, Kickbox.

**Ce qui différencie les candidats sur le point qui compte pour ce produit** : MillionVerifier et Bouncer ne facturent pas de supplément sur les résultats catch-all — c'est-à-dire sur exactement les cas où le score de risque nuancé (différenciateur n°1 du produit) apporte de la valeur. ZeroBounce facture ce cas en supplément. NeverBounce et Kickbox n'ont pas été détaillés sur ce point précis par la recherche effectuée — à vérifier en devis direct avant de choisir.

**Ce qu'il reste à faire pour trancher** :
1. Devis direct auprès de MillionVerifier, Bouncer, NeverBounce et Kickbox sur le traitement du catch-all et le volume prévu en V1.
2. Test réel de précision sur un échantillon de contacts représentatif du secteur ciblé (BTP, PME), pas seulement sur les benchmarks marketing des fournisseurs.
3. Choisir un fournisseur primaire (le moins cher pour le flux normal) et un fournisseur secondaire (déclenché uniquement en waterfall sur catch-all ou score ambigu).

---

## Décision 3 — Périmètre exact du MVP entre les cinq modules

**Périmètre proposé dans le brief initial** : Extraction (déléguée) + Vérification + Conformité en V1, Délivrabilité et Boucle en V2.

**Ce que ce périmètre implique concrètement**, à valider explicitement :

- **Extraction déléguée** : aucun scraper interne, connecteur Apollo (et éventuellement Apify) uniquement.
- **Vérification** : score de risque catch-all et waterfall dès la V1 — c'est un des deux différenciateurs qui doivent être visibles dès le premier client.
- **Conformité** : `LegalBasisRecord`, `OptOutRecord`, `AuditLogEntry` et purge automatique dès la V1 — c'est le deuxième différenciateur visible dès le premier client, et probablement celui qui a le plus de dépendances juridiques non résolues (voir `SPEC.md` section 5).
- **Délivrabilité reportée en V2** : le produit V1 ne surveille pas SPF/DKIM/DMARC ni le réchauffement de domaine. Le client V1 doit gérer sa délivrabilité avec son outil d'envoi habituel (Instantly, Smartlead, Lemlist) en parallèle du produit.
- **Boucle reportée en V2** : pas de remontée automatique des réponses/conversions ni de réinjection de ciblage en V1. Le client exporte les résultats et les analyse lui-même.

**Point d'attention avant de valider ce périmètre** : la promesse de différenciation du produit repose sur quatre piliers (score nuancé, délivrabilité pilotée, conformité native, boucle fermée). Un MVP à deux piliers sur quatre (Vérification + Conformité) est cohérent pour sortir vite, mais le message commercial en V1 ne doit pas promettre les quatre à la fois tant que Délivrabilité et Boucle ne sont pas construites — à aligner avec le discours de vente dès le lancement bêta.

**Ce qu'il reste à faire pour trancher** : confirmer que ce périmètre reste valable une fois l'avis juridique reçu — si l'avis conclut que la Conformité doit inclure un mécanisme d'article 14 non prévu dans le brief initial (voir `SPEC.md` section 5.4), le périmètre V1 du module Conformité s'élargit d'autant, et ça vaut le coup de le savoir avant d'estimer la V1, pas après.
