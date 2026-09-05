# PASSATION — SaaS B2B scraping, vérification, délivrabilité, conformité, boucle de prospection

Dernière mise à jour : 2026-09-05
Statut du projet : cadrage, aucune ligne de code applicatif écrite.

## 1. Où en est le projet

- `SPEC.md` : modèle de données des cinq modules, flux d'un contact de l'extraction à la conversion, fournisseurs candidats sourcés, zones d'incertitude juridique — rédigé.
- `ARBORESCENCE.md` : structure de dossiers par module (domain/integration/presentation), sans code — rédigée.
- `DECISIONS-BLOQUANTES.md` : les trois décisions à trancher avant de coder — documentées, non tranchées.
- Aucun code, aucune migration de base de données, aucun compte fournisseur (Apollo, Apify, vérification email) créé à ce stade.

## 2. Décisions déjà prises (actées dans le brief initial, pas à rediscuter)

- Stack : Next.js (App Router) + TypeScript, Tailwind CSS, SQLite au MVP (Postgres si le volume ou le multi-tenant l'exige plus tard).
- FastAPI en service séparé uniquement si le module Vérification demande un traitement asynchrone lourd — sinon tout reste dans le monolithe Next.js.
- Cinq modules cloisonnés : Extraction, Vérification, Délivrabilité, Conformité, Boucle. Communication inter-modules uniquement via `kernel/events.ts`, jamais par import direct entre modules.
- Ne pas construire de scraper LinkedIn interne au départ — évaluer des fournisseurs existants (Apollo API, Apify) en premier.
- Score de risque catch-all nuancé au lieu d'un verdict binaire, avec explication affichée à l'utilisateur.
- Ne jamais afficher dans l'interface une garantie de conformité totale ou de protection face à un contrôle fiscal/RGPD — formuler en outil de traçabilité, jamais en promesse juridique.

## 3. Décisions en attente (bloquantes, voir `DECISIONS-BLOQUANTES.md`)

1. Construire ou déléguer l'extraction LinkedIn en V1 (et si délégué, Apollo seul ou Apollo + Apify).
2. Quel fournisseur de vérification croiser en waterfall (candidats : MillionVerifier, Bouncer, ZeroBounce, NeverBounce, Kickbox — devis et test de précision à faire).
3. Périmètre exact du MVP entre les cinq modules (proposition : Extraction + Vérification + Conformité en V1, Délivrabilité + Boucle en V2 — à confirmer après avis juridique).

## 4. Avis juridique externe à obtenir avant tout lancement commercial

Détail complet et sources dans `SPEC.md` section 5. Résumé des points à poser à l'avocat consulté, par ordre de priorité :

1. Où se situe la limite entre le cold email B2B légal en France (intérêt légitime, L34-5 CPCE) et le pattern que la CNIL a déjà sanctionné deux fois (Kaspr 2024, Nestor 2021) sur scraping LinkedIn + prospection ?
2. Le fait de déléguer l'extraction à un prestataire tiers (Apollo, Apify) change-t-il l'analyse de responsabilité par rapport à un scraping interne ?
3. La documentation de l'intérêt légitime prévue (`LegalBasisRecord`) résiste-t-elle au triple test EDPB Guidelines 1/2024 ?
4. Le produit doit-il inclure un mécanisme réel de notice article 14 (information des personnes dont la donnée n'a pas été collectée directement) ? C'est potentiellement le point qui change le plus le périmètre du module Conformité.
5. Quelle durée de rétention par défaut est défendable pour un fichier de prospection B2B constitué par scraping (pas de référence CNIL fixe équivalente au B2C trouvée à ce jour) ?
6. L'éditeur du SaaS est-il sous-traitant ou responsable de traitement conjoint vis-à-vis de ses clients ? Cette réponse conditionne le contenu du contrat (DPA) à faire signer avant la commercialisation.

**Ce projet ne doit pas être vendu commercialement avant que ces six points aient une réponse écrite d'un avocat.**

## 5. Comment reprendre le travail

- Lire `SPEC.md` en entier avant de toucher au modèle de données — il contient le raisonnement, pas seulement les tables.
- Ne pas commencer le code tant que les trois décisions bloquantes n'ont pas un choix explicite noté dans `DECISIONS-BLOQUANTES.md` (ajouter une section "Choix retenu" sous chaque décision une fois tranchée, avec la date).
- Une fois les décisions prises : commencer par le module Conformité (`LegalBasisRecord`, `OptOutRecord`, `AuditLogEntry`) avant le module Extraction, même si l'ordre naturel du flux est inverse — un contact ne devrait jamais pouvoir exister dans le système sans que la traçabilité légale existe déjà pour le recevoir.
- Respecter l'arborescence de `ARBORESCENCE.md` dès le premier commit de code, pas comme un refactor a posteriori.

## 6. Historique

| Date | Événement |
|---|---|
| 2026-09-05 | Cadrage initial : SPEC.md, ARBORESCENCE.md, DECISIONS-BLOQUANTES.md, PASSATION.md rédigés. Aucun code écrit. |
