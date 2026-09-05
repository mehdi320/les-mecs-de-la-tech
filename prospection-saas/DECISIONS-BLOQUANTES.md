# Décisions bloquantes avant la première ligne de code

**Statut : verrouillées par défaut le 2026-09-05** pour permettre au code d'avancer (pivot marché US, aspect juridique RGPD mis de côté pour ce MVP — voir PASSATION.md section 1). Les trois décisions ci-dessous ont été tranchées sur la recommandation de cadrage de chaque section, pas sur un nouvel arbitrage business (devis fournisseurs, test de précision réel) — ce travail reste à faire, voir "Ce qu'il reste à faire" sous chaque décision.

---

## Décision 1 — Construire ou déléguer l'extraction LinkedIn en V1

**Options**

| Option | Avantage | Coût / risque |
|---|---|---|
| Déléguer à Apollo API | API officielle, conditions contractuelles claires, pas d'exposition directe aux conditions d'utilisation de LinkedIn | Dépendance à un fournisseur tiers pour la donnée cœur du produit, couverture éventuellement incomplète sur certains secteurs/pays |
| Déléguer à un actor Apify tiers | Couvre des cas qu'Apollo ne couvre pas (recherche par profil précis, données non indexées par Apollo) | Le point le plus exposé légalement du produit — voir `SPEC.md` section 5.1 et 5.2, deux sanctions CNIL sur ce pattern précis (Kaspr 240k€, Nestor 20k€) |
| Construire un scraper interne | Contrôle total, pas de dépendance externe | Expose directement l'éditeur du produit (et non plus un prestataire) aux conditions d'utilisation de LinkedIn et au RGPD, sans aucun avis juridique reçu à ce jour |

**Choix retenu (2026-09-05) : Apollo API seul, pas d'actor Apify.** C'est ce que le code implémente (`modules/extraction/integration/apollo-client.ts`). Pas de scraper interne.

**Ce qui reste à faire** : si Apollo ne couvre pas un besoin réel (secteur ou pays mal indexé), réévaluer un actor Apify à ce moment-là plutôt que par anticipation. L'avis juridique externe sur `SPEC.md` section 5.1/5.2 reste à obtenir avant tout lancement commercial sur un marché où le RGPD s'applique ; pour le marché US actuel, voir PASSATION.md section 1 sur le cadre équivalent (CAN-SPAM, non recherché à ce stade).

---

## Décision 2 — Quel fournisseur de vérification croiser en waterfall

**Candidats identifiés avec API publique documentée** (détail complet et sources dans `SPEC.md` section 3.2) : MillionVerifier, Bouncer, ZeroBounce, NeverBounce, Kickbox.

**Ce qui différencie les candidats sur le point qui compte pour ce produit** : MillionVerifier et Bouncer ne facturent pas de supplément sur les résultats catch-all — c'est-à-dire sur exactement les cas où le score de risque nuancé (différenciateur n°1 du produit) apporte de la valeur. ZeroBounce facture ce cas en supplément. NeverBounce et Kickbox n'ont pas été détaillés sur ce point précis par la recherche effectuée — à vérifier en devis direct avant de choisir.

**Choix retenu (2026-09-05) : MillionVerifier en primaire, Bouncer en secondaire (waterfall déclenché sur catch-all ou résultat incertain).** C'est ce que le code implémente (`modules/verification/integration/millionverifier-client.ts`, `bouncer-client.ts`, `domain/waterfall-policy.ts`).

**Ce qu'il reste à faire** : aucune clé API réelle testée, aucun devis obtenu, aucun test de précision sur un échantillon réel. Avant le premier client payant :
1. Devis direct auprès de MillionVerifier et Bouncer sur le volume réel prévu.
2. Test de précision sur un échantillon représentatif du secteur ciblé, pas seulement les benchmarks marketing.
3. Revalider les contrats d'API contre la documentation live (voir PASSATION.md section 3) — écrits à partir de la doc publique, jamais appelés en conditions réelles.

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

**Choix retenu (2026-09-05) : ce périmètre est celui codé.** Extraction, Vérification et Conformité existent en code fonctionnel (voir PASSATION.md section 3). Conformité a été adaptée au marché US (pas de `LegalBasisRecord`/`Article14NoticeRecord` RGPD, voir `DataProvenanceRecord`) — donc plus légère que ce que prévoyait le SPEC.md initial, pas plus lourde. Délivrabilité et Boucle restent à l'état de plan dans `ARBORESCENCE.md`, zéro code.

**Ce qu'il reste à faire** : si le produit s'ouvre un jour à l'Europe, reprendre l'avis juridique RGPD (`SPEC.md` section 5) et réévaluer si le module Conformité doit s'enrichir (article 14 notamment) avant d'y vendre.
