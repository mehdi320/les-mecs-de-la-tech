# PASSATION — SaaS B2B scraping, vérification, délivrabilité, conformité, boucle de prospection

Dernière mise à jour : 2026-09-05
Statut du projet : MVP codé et fonctionnel en local (Extraction + Vérification + Conformité). Aucune clé API réelle configurée, aucun déploiement, aucun avis juridique obtenu.

## 1. Pivot marché US — à savoir avant de lire le reste

Le SPEC.md initial était pensé pour le marché français/européen (RGPD, CNIL). Sur décision explicite, le code de ce MVP part du postulat d'un usage sur le **marché US**, où le cadre pertinent est le CAN-SPAM Act (pas le RGPD). Conséquences concrètes :

- Le module Conformité n'implémente pas de `LegalBasisRecord` RGPD ni d'`Article14NoticeRecord` — voir `DataProvenanceRecord` (`modules/conformite/domain/data-provenance-record.ts`), une version simplifiée : traçabilité de la source + échéance de purge, sans justification d'intérêt légitime au sens RGPD.
- Les six points juridiques listés section 4 de ce document (avis externe RGPD) **restent vrais si le produit s'ouvre un jour à l'Europe**, mais ne bloquent pas ce MVP tant qu'il reste sur le marché US.
- CAN-SPAM a ses propres règles (identification claire de l'expéditeur, adresse postale physique, lien de désabonnement fonctionnel, honorer l'opt-out sous 10 jours ouvrés) : elles s'appliquent surtout au niveau de l'email envoyé (module Boucle, V2, non construit), pas au niveau du contact scrappé (module Conformité actuel). **Personne n'a vérifié ce point avec un avocat US** — ce cadrage a été fait sans recherche juridique dédiée au CAN-SPAM, contrairement à la recherche RGPD qui, elle, est sourcée dans `SPEC.md`. À traiter avant tout lancement commercial US également.
- La légalité du scraping LinkedIn lui-même (hiQ v. LinkedIn, Meta v. Bright Data — SPEC.md section 5.2) reste une question de droit des contrats US, pas seulement RGPD : elle s'applique donc aussi au marché US et n'a pas disparu avec ce pivot.

## 2. Décisions bloquantes — verrouillées par défaut pour pouvoir coder

Les trois décisions de `DECISIONS-BLOQUANTES.md` ont été tranchées par défaut (recommandations du document, pas de nouvel arbitrage business) pour permettre au code d'avancer :

1. **Extraction déléguée à Apollo API**, pas de scraper interne, pas d'actor Apify branché dans ce MVP.
2. **Waterfall MillionVerifier (primaire) + Bouncer (secondaire)** — les deux ne facturent pas de supplément sur le catch-all, cohérent avec le différenciateur produit.
3. **Périmètre MVP = Extraction + Vérification + Conformité.** Délivrabilité et Boucle restent à l'état de plan dans `ARBORESCENCE.md`, aucune table ni code pour elles.

Si le choix réel diffère (autre fournisseur de vérification après devis, Apify finalement nécessaire, etc.), mettre à jour `DECISIONS-BLOQUANTES.md` ET le code — ils ne doivent pas diverger.

## 3. Où en est le code

- `npm install` + `npm run typecheck` + `npm run build` passent tous les trois (vérifié le 2026-09-05).
- Testé manuellement en local (`next build && next start`) : le flux opt-out → journal d'audit fonctionne de bout en bout ; une extraction sans `APOLLO_API_KEY` échoue proprement avec un message clair et le batch est marqué `failed` (comportement voulu, pas un bug).
- **Aucune clé API réelle testée** : `APOLLO_API_KEY`, `MILLIONVERIFIER_API_KEY`, `BOUNCER_API_KEY` sont vides dans `.env.example`. Les clients d'intégration (`apollo-client.ts`, `millionverifier-client.ts`, `bouncer-client.ts`) sont écrits à partir de la documentation publique consultée le 2026-09-05 (endpoints, en-têtes, forme de réponse) — **à revalider contre la doc live avant le premier appel réel**, ces contrats changent sans préavis et je n'ai pas pu les tester en conditions réelles.
- Pas d'authentification : les routes API tournent avec un `requestedByUserId: "operator"` en dur. À traiter avant tout déploiement multi-utilisateur.
- Pas de test automatisé (unitaire ou autre) écrit pour l'instant — `risk-scoring.ts` (le cœur du différenciateur) mériterait des tests unitaires en priorité avant d'aller plus loin.

### Correction d'architecture faite pendant l'implémentation (important si vous retouchez le code)

Le plan initial (`ARBORESCENCE.md` v1) prévoyait un `kernel/events.ts` (event bus en mémoire) + un `instrumentation.ts` pour que le module Conformité écoute les événements des autres modules sans les importer directement. **Testé et non fonctionnel** : Next.js ne garantit pas que `instrumentation.ts` et les route handlers partagent la même instance de module en mémoire en production (`next build && next start`) — un abonnement enregistré au démarrage ne recevait jamais les événements publiés depuis une route API. Ces trois fichiers ont été supprimés. La composition entre modules se fait maintenant explicitement dans les route handlers (`app/api/*`), soit par appel direct (le module Conformité n'est jamais importé par Extraction ou Vérification, c'est la route qui appelle les deux), soit par callback passé en paramètre (`runExtraction({ onContactInserted })`). Détail complet dans `ARBORESCENCE.md`.

## 4. Avis juridique externe à obtenir avant tout lancement commercial (RGPD — si ouverture Europe)

Détail complet et sources dans `SPEC.md` section 5. Reste valable si le produit s'ouvre un jour au marché européen ; ne bloque pas le marché US actuel (voir section 1 ci-dessus).

1. Où se situe la limite entre le cold email B2B légal en France (intérêt légitime, L34-5 CPCE) et le pattern que la CNIL a déjà sanctionné deux fois (Kaspr 2024, Nestor 2021) sur scraping LinkedIn + prospection ?
2. Le fait de déléguer l'extraction à un prestataire tiers (Apollo, Apify) change-t-il l'analyse de responsabilité par rapport à un scraping interne ?
3. La documentation de provenance résisterait-elle au triple test EDPB Guidelines 1/2024 si on la RGPD-ise ?
4. Le produit devrait-il inclure un mécanisme réel de notice article 14 pour le marché européen ?
5. Quelle durée de rétention par défaut serait défendable en RGPD (le défaut actuel de 180 jours est un choix opérationnel US, pas une analyse RGPD) ?
6. L'éditeur du SaaS serait-il sous-traitant ou responsable de traitement conjoint vis-à-vis de ses clients ?

**Pour le marché US actuel, le point équivalent à traiter avant commercialisation est CAN-SPAM (voir section 1) — non recherché à ce stade, contrairement au RGPD.**

## 5. Comment reprendre le travail

- Lire ce document en entier avant de retoucher au code — il contient les décisions verrouillées et le piège d'architecture déjà rencontré (section 3).
- `SPEC.md` reste la référence pour le modèle de données complet des cinq modules (y compris Délivrabilité et Boucle, non codés), mais son cadrage juridique est RGPD — pertinent seulement si le marché change.
- Avant de coder Délivrabilité ou Boucle (V2) : relire `ARBORESCENCE.md` pour la structure prévue, et refaire le même exercice de vérification par le build qui a révélé le problème d'event bus — ne pas supposer qu'un mécanisme de découplage fonctionne sans le tester en conditions `next build && next start`.
- Variables d'environnement à renseigner avant tout usage réel : voir `.env.example`.

## 6. Historique

| Date | Événement |
|---|---|
| 2026-09-05 | Cadrage initial : SPEC.md, ARBORESCENCE.md, DECISIONS-BLOQUANTES.md, PASSATION.md rédigés. Aucun code écrit. |
| 2026-09-05 | Pivot marché US demandé, aspect juridique RGPD mis de côté pour ce MVP. Décisions bloquantes verrouillées par défaut. MVP codé (Extraction + Vérification + Conformité) : Next.js + TypeScript + Tailwind + SQLite (`node:sqlite`). Build et typecheck validés. Bug d'architecture trouvé et corrigé (event bus process-wide non fiable entre `instrumentation.ts` et les route handlers Next.js) — composition inter-modules déplacée dans `app/api/*`. |
