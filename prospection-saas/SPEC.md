# SPEC — SaaS B2B scraping, vérification, délivrabilité, conformité, boucle de prospection

Statut : document de cadrage avant toute ligne de code. Ne pas coder à partir de ce document sans avoir tranché les 3 décisions bloquantes (voir `DECISIONS-BLOQUANTES.md`) et sans avis juridique externe sur les points listés en section 5.

## 0. Rappel produit et différenciation

Le produit se différencie des outils existants (b2bleadsscrape.com, Lead Scrape, Apollo, UpLead) sur quatre points, à ne jamais diluer :

1. Score de risque catch-all nuancé plutôt qu'un verdict binaire valide/invalide.
2. Pilotage de la délivrabilité intégré (surveillance + automatisation), pas juste un export de liste.
3. Conformité RGPD native : base légale tracée par contact, purge automatique, opt-out opposable, journal d'audit.
4. Boucle fermée liste → envoi → réponse → conversion → réinjection dans le ciblage suivant.

Cible : agences de prospection B2B et équipes commerciales de PME en Europe, qui utilisent aujourd'hui un outil de scraping US et un outil d'envoi séparés (Instantly, Smartlead, Lemlist) sans les faire communiquer.

---

## 1. Modèle de données par module

Les cinq modules sont cloisonnés : chaque module possède ses propres tables, et ne lit les données d'un autre module qu'à travers une interface explicite (pas de jointure SQL directe cross-module dans le code applicatif, même si le MVP tourne sur une seule base SQLite). Voir `ARBORESCENCE.md` pour la traduction en dossiers.

### 1.1 Module Extraction

**`Company`** (référentiel dédupliqué)
- `id`
- `domain` (unique, clé de dédoublonnage principale)
- `name`
- `industry` (nullable)
- `size_range` (nullable, ex. "10-50")
- `country`
- `linkedin_url` (nullable)

**`ExtractionBatch`**
- `id`
- `query_params` (JSON — critères de recherche envoyés au fournisseur)
- `provider` (enum : `apollo_api`, `apify_actor`, `manual_upload`)
- `provider_run_id` (référence externe, pour audit et debug)
- `requested_by_user_id`
- `status` (enum : `pending`, `running`, `completed`, `failed`)
- `started_at`, `completed_at`
- `contact_count`
- `cost` (crédits ou devise consommée)
- `source_query_origin` (FK nullable → `NextQueryProposal` du module Boucle, si le batch vient d'une requête affinée automatiquement)

**`Contact`** (enregistrement brut extrait)
- `id`
- `full_name`
- `company_id` (FK → `Company`)
- `job_title`
- `email_guessed` (nullable)
- `phone` (nullable)
- `source` (enum : `linkedin_public`, `apollo_api`, `apify_actor`, `company_website`, `directory`)
- `source_url`
- `extraction_batch_id` (FK → `ExtractionBatch`)
- `extracted_at`
- `raw_payload` (JSON brut du fournisseur, conservé pour audit et pour recalculer si le schéma évolue)

### 1.2 Module Vérification

**`VerificationResult`**
- `id`
- `contact_id` (FK → `Contact`)
- `email_checked`
- `risk_score` (0–100, continu — jamais de verdict binaire seul)
- `verdict_label` (enum dérivé du score pour l'affichage : `valide`, `risqué`, `catch-all incertain`, `invalide` — label indicatif, pas une garantie)
- `signals` (JSON structuré : `smtp_check`, `mx_valid` (bool), `domain_age_days`, `pattern_match_confidence`, `catch_all_detected` (bool), `primary_provider_verdict`, `secondary_provider_verdict`)
- `primary_provider` (enum fournisseur, voir section 2)
- `secondary_provider` (nullable — fournisseur croisé en waterfall, déclenché seulement si `catch_all_detected = true` ou score ambigu)
- `explanation_text` (texte généré, expliquant à l'utilisateur *pourquoi* ce score — obligatoire, pas juste le chiffre)
- `verified_at`
- `verification_cost`

### 1.3 Module Délivrabilité

**`SendingDomain`**
- `id`
- `domain`
- `tenant_id` (propriétaire — le client connecte son propre domaine)
- `spf_status` / `dkim_status` / `dmarc_status` (enum : `pass`, `fail`, `none`)
- `dmarc_policy` (enum : `none`, `quarantine`, `reject`)
- `warmup_stage` (enum : `not_started`, `warming`, `warmed`, `paused`)
- `warmup_started_at`
- `reputation_score` (0–100, dérivé des signaux de bounce/plainte remontés par le module Boucle)
- `last_checked_at`

**`SendingMailbox`**
- `id`
- `sending_domain_id` (FK)
- `email_address`
- `provider` (enum : `google_workspace`, `microsoft_365`, `other` — connexion via OAuth ou identifiants SMTP/IMAP fournis par le client, jamais une boîte que nous hébergeons)
- `daily_send_cap`
- `current_daily_volume`
- `rotation_group_id` (nullable — pour la rotation d'adresses)
- `status` (enum : `active`, `paused`, `flagged`)

**`DeliverabilityAlert`**
- `id`
- `sending_domain_id` ou `sending_mailbox_id`
- `alert_type` (enum : `spf_broken`, `dkim_broken`, `dmarc_alignment_fail`, `reputation_drop`, `high_bounce_rate`, `high_spam_complaint_rate`)
- `severity`
- `detected_at`, `resolved_at` (nullable)

> Ce module pilote et alerte, il ne remplace pas l'infrastructure d'envoi réelle : le client connecte ses propres domaines et boîtes, on ne détient jamais les identifiants comme un service d'envoi le ferait pour son propre compte.

### 1.4 Module Conformité

**`LegalBasisRecord`**
- `id`
- `contact_id` (FK → `Contact`)
- `legal_basis` (enum — une seule valeur supportée au MVP : `interet_legitime_b2b`, structure extensible)
- `justification_text` (motivation écrite et datée : poste et email professionnels, contenu en lien avec la fonction — voir section 5 sur la robustesse réelle de cette justification)
- `source_cited` (copié depuis `Contact.source`)
- `recorded_at`
- `recorded_by` (`system` ou `user_id`)
- `retention_deadline` (calculé : `recorded_at` + `RetentionPolicy.default_retention_days`)
- `purge_status` (enum : `active`, `scheduled`, `purged`)
- `purged_at` (nullable)

**`Article14NoticeRecord`** *(entité candidate, à confirmer après avis juridique — voir section 5.5)*
- `id`
- `contact_id` (FK)
- `notice_sent_at` (nullable — si null, le contact ne devrait pas être contacté commercialement selon une lecture stricte de l'article 14)
- `notice_channel` (enum : `email_dedie`, `mention_dans_premier_email`, `mention_site_web_generale`)
- `notice_content_version` (référence au texte type utilisé)

**`OptOutRecord`**
- `id`
- `email_or_domain` (normalisé)
- `contact_id` (nullable — la liste de suppression doit survivre même si le contact d'origine est purgé, c'est le point sensible : ne jamais purger un `OptOutRecord` sur la même politique de rétention que les contacts actifs)
- `opted_out_at`
- `opt_out_source` (enum : `unsubscribe_link`, `reply_detected`, `manual_entry`, `imported_list`)
- `scope` (enum : `contact_only`, `domain_wide` — le défaut légal est `contact_only`, `domain_wide` est une option opérationnelle du client, pas une exigence RGPD)

**`AuditLogEntry`**
- `id`
- `entity_type` (`contact`, `campaign`, `opt_out`, `verification`, …)
- `entity_id`
- `action` (`extracted`, `verified`, `notice_sent`, `opted_out`, `purged`, `exported`, `sent`)
- `actor` (`system` ou `user_id`)
- `timestamp`
- `details` (JSON)
- `exportable` (bool — marque ce qui doit sortir dans un export du journal en cas de contrôle)

**`RetentionPolicy`**
- `id`
- `tenant_id`
- `default_retention_days` (paramétrable — voir section 5.6, pas de durée légale fixe à copier depuis le B2C)
- `applies_to` (enum : `contacts_non_convertis`, `tous_les_contacts`)

### 1.5 Module Boucle

**`SendingCampaign`**
- `id`
- `name`
- `external_tool` (enum : `instantly`, `smartlead`, `lemlist`, `native`)
- `external_campaign_id` (nullable si `native`)
- `sending_domain_id` (FK → module Délivrabilité)
- `created_at`

**`CampaignContact`** (table de jonction)
- `campaign_id` (FK)
- `contact_id` (FK)
- `status` (enum : `queued`, `sent`, `opened`, `replied`, `bounced`, `unsubscribed`, `converted`)
- `sent_at`, `replied_at`, `converted_at` (nullables)

**`EngagementEvent`** (reçu par webhook)
- `id`
- `campaign_contact_id` (FK)
- `event_type` (enum : `sent`, `open`, `reply`, `bounce`, `unsubscribe`, `conversion`)
- `received_at`
- `raw_payload` (JSON brut du webhook, conservé pour audit)
- `source_tool` (enum : `instantly`, `smartlead`, `lemlist`, `native`)

**`SourcePerformanceScore`** (recalculé périodiquement)
- `id`
- `dimension_type` (enum : `extraction_source`, `segment`, `query_pattern`)
- `dimension_value` (ex. `"apollo_api:industrie=btp:taille=10-50"`)
- `reply_rate`, `conversion_rate`, `sample_size`
- `computed_at`

**`NextQueryProposal`**
- `id`
- `based_on_score_id` (FK → `SourcePerformanceScore`)
- `proposed_query_params` (JSON — réinjecté dans `ExtractionBatch.query_params` du module Extraction)
- `status` (enum : `proposed`, `accepted`, `rejected`, `applied`)
- `created_at`

---

## 2. Flux d'un contact, de l'extraction à la conversion

1. **Extraction déclenchée** : un `ExtractionBatch` est créé, soit manuellement par l'utilisateur, soit à partir d'un `NextQueryProposal` accepté. Le fournisseur choisi (Apollo API ou actor Apify) est appelé avec `query_params`.
2. **Ingestion** : chaque enregistrement brut renvoyé devient un `Contact`, rattaché à une `Company` dédupliquée par `domain`. Le `raw_payload` est conservé tel quel.
3. **Traçabilité légale immédiate** : à l'insertion du `Contact`, un `LegalBasisRecord` est créé automatiquement — base légale, justification, source citée, échéance de purge calculée. Un contact sans `LegalBasisRecord` ne doit jamais pouvoir entrer dans une campagne (contrainte applicative, pas seulement une bonne pratique).
4. **Vérification** : un `VerificationResult` est calculé. Si `catch_all_detected = true` ou score ambigu, un second fournisseur est interrogé en waterfall. Le score et son explication sont exposés à l'utilisateur, jamais un verdict binaire seul.
5. **Filtrage utilisateur** : l'utilisateur choisit un seuil de risque acceptable pour passer à l'étape d'envoi.
6. **Vérification opt-out, bloquante** : avant toute entrée dans une `CampaignContact`, le contact est comparé à `OptOutRecord` (par email et par domaine si `scope = domain_wide`). Un contact présent dans la liste de suppression ne peut pas être ajouté à une campagne, sans exception ni contournement manuel.
7. **(Si applicable) Notice article 14** : selon l'issue de l'avis juridique (section 5.5), un `Article14NoticeRecord` est créé et une information est envoyée avant ou avec le premier contact commercial.
8. **Campagne** : le contact est ajouté à une `CampaignContact`, rattachée à une `SendingCampaign` elle-même liée à un `SendingDomain` surveillé par le module Délivrabilité (SPF/DKIM/DMARC, réchauffement, rotation).
9. **Envoi** : via l'outil externe connecté (webhook) ou l'envoi natif si construit plus tard.
10. **Remontée d'engagement** : chaque événement (`sent`, `open`, `reply`, `bounce`, `unsubscribe`, `conversion`) arrive comme `EngagementEvent`, met à jour `CampaignContact.status`, et si c'est un `unsubscribe`, crée immédiatement un `OptOutRecord`.
11. **Journal d'audit** : chaque étape clé (extraction, vérification, notice, opt-out, envoi, purge) écrit une `AuditLogEntry`, exportable en cas de contrôle.
12. **Agrégation** : périodiquement, `SourcePerformanceScore` est recalculé par source d'extraction et par segment à partir des `EngagementEvent`.
13. **Boucle** : un `NextQueryProposal` est généré à partir des scores de performance, proposé à l'utilisateur pour validation avant de relancer une nouvelle `ExtractionBatch`.
14. **Purge** : à l'échéance de `LegalBasisRecord.retention_deadline`, si le contact n'a pas convergé vers une conversion active, il est purgé (`purge_status = purged`), sauf si un `OptOutRecord` existe pour lui — celui-ci n'est jamais purgé sur la même politique, car il sert à honorer le refus, pas à exploiter la donnée.

---

## 3. Fournisseurs candidats (API publique documentée, vérifiés par recherche — aucun nom inventé)

### 3.1 Extraction

| Fournisseur | Ce qu'il couvre | Nature de l'API | Point d'attention |
|---|---|---|---|
| **Apollo.io API** (`docs.apollo.io`) | Base de 200M+ contacts, recherche et enrichissement de contacts/entreprises | API REST officielle, documentée publiquement, pricing détaillé sur `docs.apollo.io/docs/api-pricing` | Accès API de base inclus dès le plan gratuit, mais les filtres avancés et le volume de crédits dépendent du plan payant |
| **Apify — actors LinkedIn tiers** (ex. `linkedin-profile-scraper`, `linkedin-company-scraper-actor`, `linkedin-profile-search-scraper`) | Scraping de profils, entreprises, recherche de profils LinkedIn | L'API Apify elle-même (déclenchement d'un run, récupération du résultat) est officielle et bien documentée ; mais chaque **actor** est publié par un tiers indépendant, pas par Apify ni par LinkedIn | Fiabilité et conformité aux conditions d'utilisation de LinkedIn variables d'un actor à l'autre — voir section 5.1, c'est le point juridique le plus sensible du produit |

Recommandation de cadrage (à confirmer en décision bloquante #1) : ne pas construire de scraper LinkedIn interne en V1, évaluer Apollo API en premier choix car c'est une API officielle avec conditions contractuelles claires, garder un actor Apify en option secondaire si Apollo ne couvre pas un besoin précis.

### 3.2 Vérification (waterfall)

| Fournisseur | Traitement du catch-all | Tarif indicatif | API publique |
|---|---|---|---|
| **MillionVerifier** | Ne facture pas les résultats catch-all | 0,50–1,50 $ / 1000 vérifications (le moins cher du marché) | Oui |
| **Bouncer** | Ne facture pas les résultats catch-all | Non précisé dans les sources trouvées, à vérifier en devis direct | Oui |
| **ZeroBounce** | Facture en supplément le scoring catch-all | 4–10 $ / 1000 | Oui |
| **NeverBounce** | — (non détaillé par la recherche, à vérifier en devis direct) | 4–10 $ / 1000 | Oui |
| **Kickbox** | — (non détaillé par la recherche, à vérifier en devis direct) | 4–10 $ / 1000 | Oui |

Point directement pertinent pour l'architecture : comme le produit différencie sa gestion du catch-all, une politique de tarification favorable au catch-all (MillionVerifier, Bouncer) réduit le coût du waterfall précisément sur les cas qui font notre valeur ajoutée. À trancher en décision bloquante #2.

**Sources** :
- [API Pricing — Apollo.io](https://docs.apollo.io/docs/api-pricing)
- [Linkedin Profile Scraper API · Apify](https://apify.com/curious_coder/linkedin-profile-scraper/api)
- [Linkedin Company Scraper Actor API · Apify](https://apify.com/scraperforge/linkedin-company-scraper-actor/api)
- [Linkedin Profile Search Scraper API · Apify](https://apify.com/apimaestro/linkedin-profile-search-scraper/api)
- [Email Waterfall Verification — Happierleads](https://happierleads.com/features/email-waterfall-verification)
- [2026 Email Verification Benchmark — Instantly](https://instantly.ai/blog/2026-email-verification-benchmark-accuracy-scores-for-8-top-tools/)

---

## 4. Ce que ce document ne tranche pas

Voir `DECISIONS-BLOQUANTES.md` pour les trois décisions à prendre avant la première ligne de code, et la section 5 ci-dessous pour ce qui doit passer par un avis juridique externe avant tout lancement commercial.

---

## 5. Zones d'incertitude juridique — à faire trancher par un avis externe avant tout lancement commercial

Ces points ne sont **pas** résolus par ce document. Ils sont documentés avec leurs sources pour que l'avocat consulté parte d'un état des lieux précis plutôt que de zéro.

### 5.1 Le point le plus sensible : scraping LinkedIn + prospection, la CNIL a déjà sanctionné deux fois ce combo précis

- **CNIL / Kaspr, décembre 2024, amende de 240 000 €.** Kaspr proposait une extension de navigateur récupérant les coordonnées de profils LinkedIn (dont des profils ayant restreint leur visibilité), pour de la prospection, du recrutement ou de la vérification d'identité. La CNIL a jugé le traitement disproportionné par rapport à ce que les utilisateurs de LinkedIn pouvaient raisonnablement attendre. [Source — CNIL](https://www.cnil.fr/fr/aspiration-de-donnees-sanction-de-240-000-euros-lencontre-de-la-societe-kaspr)
- **CNIL / Nestor, 2021, amende de 20 000 €.** Sanction pour prospection B2B à partir de contacts identifiés par scraping LinkedIn sans consentement, la CNIL invoquant l'article L34-5 du code des postes et communications électroniques malgré le caractère public des données. [Source](https://www.haas-avocats.com/reglementation/cnil/cnil-240-000-euros-damende-pour-non-respect-des-regles-de-prospection-commerciale/)
- En parallèle, le cold email B2B par email reste présenté comme légal en France sous régime d'opt-in par exception (intérêt légitime, article L34-5 CPCE, quatre conditions : email professionnel, contenu lié à la fonction, lien de désabonnement, source déclarée).

**La tension à faire trancher** : ces deux lignes ne sont pas évidemment compatibles à l'échelle où ce produit veut opérer. Un avocat doit dire précisément où se situe la limite entre "cold email B2B légal sur donnée publique correctement sourcée" et "le pattern Kaspr/Nestor que la CNIL sanctionne", et si le fait de s'appuyer sur un prestataire tiers (Apify, Apollo) plutôt que de scraper soi-même change l'analyse de responsabilité.

### 5.2 Statut contractuel du scraping LinkedIn (hors RGPD, droit des contrats)

- **hiQ Labs v. LinkedIn (US)** : après six ans de procédure, règlement confidentiel en décembre 2022 ; LinkedIn a obtenu gain de cause sur le terrain contractuel (violation des conditions d'utilisation), avec injonction empêchant hiQ de continuer à scraper LinkedIn. La question de la légalité du scraping de données publiques au regard du CFAA (loi pénale fédérale US) avait été tranchée en faveur de hiQ dès 2019/2022, mais ce n'est pas ce qui a mis fin à l'affaire — c'est le contrat. [Source — Wikipedia / synthèse Morgan Lewis](https://www.morganlewis.com/blogs/sourcingatmorganlewis/2022/12/linkedin-v-hiq-landmark-data-scraping-suit-provides-guidance-to-data-scrapers-and-web-operators)
- **Meta v. Bright Data (janvier 2024, US)** : un juge fédéral a jugé que Bright Data ne violait les conditions d'utilisation de Meta que si le scraping avait lieu en étant connecté à un compte Meta — un signal favorable au scraping de données publiques sans connexion, mais qui reste une affaire contractuelle américaine, pas une lecture RGPD.

**À faire trancher** : que le produit utilise un actor Apify tiers ne supprime pas l'exposition contractuelle vis-à-vis de LinkedIn (violation des conditions d'utilisation de LinkedIn par l'actor, dont l'utilisateur final du produit pourrait être considéré comme complice ou bénéficiaire). Un avis est nécessaire sur le niveau de risque réellement transféré en passant par un prestataire plutôt qu'en scrapant en direct.

### 5.3 Le test en trois volets de l'intérêt légitime (EDPB Guidelines 1/2024), appliqué à ce cas précis

Les lignes directrices EDPB 1/2024 sur l'article 6(1)(f), consultées en version projet en octobre 2024 et destinées à une adoption finale début 2025, posent un test cumulatif en trois temps : intérêt réel et licite, nécessité (pas d'alternative moins intrusive aussi efficace), mise en balance avec les droits de la personne concernée. [Source — EDPB](https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2024/guidelines-12024-processing-personal-data-based_en)

**À faire trancher** : personne n'a encore testé ce triple test spécifiquement sur "scraping LinkedIn à l'échelle + cold email automatisé". La documentation de l'intérêt légitime prévue dans `LegalBasisRecord.justification_text` doit être construite avec un avocat pour résister à ce test précis, pas seulement cocher les quatre conditions classiques du cold email B2B français.

### 5.4 L'obligation d'information de l'article 14 est le point le plus concrètement actionnable, et le plus souvent ignoré

- L'article 14 RGPD s'applique dès que la donnée n'est pas collectée directement auprès de la personne — c'est exactement le cas du scraping. L'information doit être donnée dans un délai d'un mois maximum, et au plus tard lors du premier contact.
- L'exception pour "effort disproportionné" (article 14§5) est strictement encadrée : **elle ne couvre jamais un fichier commercial exploitable**, selon la doctrine consultée. La CNIL l'a rappelé explicitement dans la sanction Clearview AI : aspirer des données publiques ne fait pas disparaître l'obligation d'information. [Source](https://www.donneespersonnelles.fr/article-14-rgpd)

**Conséquence produit potentielle, à valider avant de coder** : il est possible que le module Conformité doive inclure un mécanisme réel d'envoi d'une notice article 14 (entité candidate `Article14NoticeRecord` déjà esquissée en section 1.4), distincte du message de prospection lui-même, et que ce ne soit pas optionnel. C'est le genre de point qui peut changer le périmètre du MVP — à trancher avant d'écrire le module Conformité, pas après.

### 5.5 Durée de rétention par défaut

Contrairement au B2C où une durée de 3 ans après le dernier contact est une référence CNIL bien connue, aucune durée fixe équivalente n'a été confirmée par la recherche pour les fichiers de prospection B2B constitués par scraping. Le principe RGPD de limitation de la conservation s'applique (durée proportionnée à la finalité), mais le nombre exact à mettre par défaut dans `RetentionPolicy.default_retention_days` doit être choisi avec un avocat, pas inventé ici.

### 5.6 Qualification des rôles RGPD entre l'éditeur du SaaS et ses clients (agences, PME)

Ce point n'a pas été trouvé documenté spécifiquement pour ce type de produit dans la recherche effectuée, et doit être posé explicitement à l'avocat consulté : l'éditeur du SaaS est-il sous-traitant (processor) des données que ses clients scrapent et envoient, ou responsable de traitement conjoint (joint controller) du fait qu'il opère lui-même l'extraction et le scoring ? La réponse conditionne le contenu du contrat (DPA) à faire signer à chaque client, qui n'existe pas encore et doit être écrit avant la commercialisation.

---

## Sources consultées

- [Apollo.io — API Pricing](https://docs.apollo.io/docs/api-pricing)
- [Apify — actors LinkedIn (profils, entreprises, recherche)](https://apify.com/curious_coder/linkedin-profile-scraper/api)
- [Email Waterfall Verification — Happierleads](https://happierleads.com/features/email-waterfall-verification)
- [2026 Email Verification Benchmark — Instantly](https://instantly.ai/blog/2026-email-verification-benchmark-accuracy-scores-for-8-top-tools/)
- [CNIL — Sanction Kaspr, 240 000 €](https://www.cnil.fr/fr/aspiration-de-donnees-sanction-de-240-000-euros-lencontre-de-la-societe-kaspr)
- [Haas Avocats — Sanction Nestor et cadre L34-5](https://www.haas-avocats.com/reglementation/cnil/cnil-240-000-euros-damende-pour-non-respect-des-regles-de-prospection-commerciale/)
- [Overloop — B2B cold email France, cadre CNIL/RGPD 2026](https://overloop.com/fr/blog/b2b-cold-email-france-cnil-rgpd)
- [Wikipedia / Morgan Lewis — hiQ Labs v. LinkedIn, issue du litige](https://www.morganlewis.com/blogs/sourcingatmorganlewis/2022/12/linkedin-v-hiq-landmark-data-scraping-suit-provides-guidance-to-data-scrapers-and-web-operators)
- [EDPB — Guidelines 1/2024 sur l'article 6(1)(f)](https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2024/guidelines-12024-processing-personal-data-based_en)
- [donneespersonnelles.fr — Article 14 RGPD, guide et délais](https://www.donneespersonnelles.fr/article-14-rgpd)
