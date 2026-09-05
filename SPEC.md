# SPEC.md — SaaS B2B de cold email

Statut : MVP V1 code et fonctionnel en local (cf. PASSATION.md pour
l'etat d'avancement et les risques connus). Ce document reste la
reference du modele de donnees, du flux produit de bout en bout, et
renvoie vers le modele de DPA. Les decisions bloquantes non tranchees
sont listees en section 7.

---

## 1. Positionnement et perimetre produit

SaaS B2B de cold email, concurrent d'Instantly, Lemlist et Smartlead.
Le produit **n'extrait, ne scrape et ne vend aucune donnee de contact**.
Le client apporte sa propre liste (peu importe la source : sa base
CRM, un fournisseur tiers de son choix, un export manuel). Le produit
envoie, mesure, protege la delivrabilite, et referme la boucle
d'apprentissage sur les campagnes.

Quatre trous identifies chez les trois concurrents principaux, qui
structurent la feuille de route :

| # | Trou concurrentiel | Reponse produit |
|---|---|---|
| 1 | Conformite jamais vendue comme argument | Registre de suppression unifie inter-campagnes, generateur de notification conforme, export d'audit |
| 2 | Prix au siege / a la boite mail punit la croissance | Tarification au volume envoye, pas au siege ni a la mailbox |
| 3 | Manque de profondeur d'analyse (Lemlist notamment) | Diagnostic de sous-performance par cause (delivrabilite / contenu / ciblage), pas de taux bruts seuls |
| 4 | Aucune IP dediee standard, tout sur infra partagee | Option d'envoi isole / IP dediee (portee exacte a trancher, cf. section 7) |

---

## 2. Position juridique (resume — le detail contractuel est dans le DPA)

- Le **client est responsable de traitement** pour sa propre liste :
  il decide qui contacter, pourquoi, et sur quelle base legale.
- Le **produit est sous-traitant** au sens de l'article 28 du RGPD :
  il traite les donnees pour le compte du client, sur ses instructions
  documentees dans le DPA.
- Consequence sur le modele de donnees : chaque entite qui porte des
  donnees personnelles de contacts (liste, contact, evenement d'envoi,
  entree de suppression) doit etre rattachee sans ambiguite a un
  `client_id`/`tenant_id`, et le produit ne doit jamais faire circuler
  ou reutiliser une donnee de contact entre deux clients differents.
  C'est une contrainte dure sur l'architecture, pas juste juridique :
  **le registre de suppression du module Conformite est unifie a
  travers les campagnes d'un meme client, jamais a travers deux
  clients differents.**
- Obligations du produit (sous-traitant) : securite des donnees
  manipulees (chiffrement au repos et en transit, acces restreint et
  journalise, suppression sur demande), assistance a la notification
  de violation, tenue d'un registre des traitements sous-traites.
  Pas d'obligation de verifier la licite de la collecte initiale par
  le client — obligation qui reste contractuellement affirmee comme
  relevant du client (cf. DPA, clause de garantie du client).
- Le modele de DPA complet, a faire valider par un avocat avant mise
  en production, est dans [`legal/DPA-template.md`](./legal/DPA-template.md).
  Les CGU doivent porter une clause miroir (le client garantit la
  licite de sa liste et sa base legale de contact) — a rediger avec
  le meme avocat en meme temps que le DPA, pas separement.

---

## 3. Modele de donnees par module

Convention : toutes les tables portent un `client_id` (le tenant), un
`created_at`/`updated_at`, et un `id` (UUID). Ce socle commun est
omis des tableaux ci-dessous pour lisibilite sauf mention contraire.

### 3.1 Module Envoi

| Entite | Champs cles | Notes |
|---|---|---|
| `Client` | `id`, `nom`, `plan_id`, `dpa_signed_at`, `dpa_version` | Le tenant. `dpa_signed_at` null bloque l'envoi (cf. flux section 4). |
| `Mailbox` | `id`, `client_id`, `provider` (`google_workspace`\|`microsoft_365`\|`smtp_generique`), `email`, `oauth_tokens_ref` (reference chiffree, jamais le token en clair dans la table), `smtp_config_ref` (si generique), `statut_connexion`, `quota_jour` | Voir section 7 sur le choix OAuth Google/Microsoft vs SMTP/IMAP generique. |
| `Domaine` | `id`, `client_id`, `nom_domaine`, `spf_statut`, `dkim_statut`, `dmarc_statut`, `dernier_check_at` | Alimente aussi le module Delivrabilite (3.4). |
| `Sequence` | `id`, `client_id`, `nom`, `statut` (`brouillon`\|`active`\|`archivee`) | Un gabarit de campagne, reutilisable. |
| `SequenceEtape` | `id`, `sequence_id`, `ordre`, `delai_jours`, `sujet`, `corps`, `condition_branche` (ex: si pas de reponse) | Contenu editorial de chaque etape. Le `sujet`/`corps` portes ici sont le contenu par defaut (variante unique) ; cf. `SequenceEtapeVariante` ci-dessous et section 9 quand l'etape teste plusieurs variantes A/B. |
| `SequenceEtapeVariante` | `id`, `sequence_etape_id`, `nom` (`A`\|`B`\|`C`...), `sujet`, `corps`, `champs_personnalisation_requis[]` (ex: `["prenom","entreprise","dernier_post"]`), `statut` (`en_test`\|`gagnante`\|`perdante`) | Cf. section 9 : variante generee a partir des colonnes du CSV client uniquement, jamais de donnee scrapee. |
| `Campagne` | `id`, `client_id`, `sequence_id`, `liste_id` (FK vers `ListeImportee`, 3.2), `mailbox_ids[]`, `fuseau_horaire`, `fenetre_envoi` (ex: 9h-17h local contact), `statut` | Une execution concrete d'une sequence sur une liste. |
| `Enrollment` | `id`, `campagne_id`, `contact_id`, `etape_courante`, `statut` (`en_attente`\|`envoye`\|`repondu`\|`stoppe_suppression`\|`stoppe_reponse`) | Le lien contact <-> avancement dans la sequence. **Verifie le registre de suppression (3.3) avant chaque envoi d'etape**, pas seulement a la creation. |
| `EnvoiEvenement` | `id`, `enrollment_id`, `mailbox_id`, `variante_id` (nullable, FK vers `SequenceEtapeVariante` — cf. section 9), `horodatage`, `statut_smtp`, `message_id` | Trace technique d'un envoi individuel, source du diagnostic (3.4) et du scoring de variante (section 9). |

### 3.2 Module Verification

Applique a la liste du client au moment de l'import, jamais a une
base que le produit possederait.

| Entite | Champs cles | Notes |
|---|---|---|
| `ListeImportee` | `id`, `client_id`, `nom`, `source_declaree` (texte libre, ex: "export CRM interne"), `nb_contacts`, `statut_verification` | La liste brute apportee par le client. |
| `Contact` | `id`, `client_id`, `liste_id`, `email`, `donnees_additionnelles_json` (prenom, entreprise, etc. — schema libre) | Rattache au client, jamais partage entre clients. |
| `VerificationResultat` | `id`, `contact_id`, `resultat_smtp` (`valide`\|`invalide`\|`catch_all`\|`inconnu`), `mx_valide` (bool), `age_domaine_jours`, `pattern_domaine_suspect` (bool), `score_risque` (0-100), `score_explication_json` (liste des facteurs et leur poids) | Le score est **explique**, pas juste affiche : `score_explication_json` doit permettre d'afficher "catch-all + domaine cree il y a 12 jours -> risque eleve" plutot qu'un chiffre nu. |

### 3.3 Module Conformite

Value-add pour le client (pas une obligation de collecte, puisqu'il
n'y a pas de collecte cote produit).

| Entite | Champs cles | Notes |
|---|---|---|
| `SuppressionEntree` | `id`, `client_id`, `email` (ou hash de l'email), `origine` (`desinscription`\|`plainte`\|`bounce_dur`\|`import_manuel`), `campagne_origine_id`, `horodatage` | **Unifiee a travers toutes les campagnes et toutes les listes d'un meme client.** Index unique sur (`client_id`, `email`). C'est la table que `Enrollment` (3.1) interroge avant chaque envoi. |
| `NotificationTemplate` | `id`, `client_id` (nullable si gabarit systeme fourni par le produit), `langue` (`fr`\|`en`, extensible), `contenu`, `variables_disponibles[]` | Genere un texte de notification conforme ; multilingue des le depart. |
| `AuditExport` | `id`, `client_id`, `contact_email_hash`, `campagnes_json` (liste des campagnes ayant contacte ce contact, avec date), `statut_opposition`, `genere_at`, `genere_par` (user) | Export par contact en cas de demande d'acces (droit d'acces RGPD) : quelle campagne, quelle date, quel statut d'opposition. |

### 3.4 Module Delivrabilite et Boucle

| Entite | Champs cles | Notes |
|---|---|---|
| `DomaineAuthRecord` | voir `Domaine` en 3.1 | Meme entite, ce module en est le second lecteur/ecrivain (verification periodique SPF/DKIM/DMARC). |
| `IPDediee` | `id`, `client_id` (nullable si mutualisee), `adresse_ip`, `statut_reputation`, `fournisseur` | Portee et fournisseur a trancher, cf. section 7. |
| `WarmupPlan` | `id`, `domaine_id` ou `ip_id`, `jour_courant`, `palier_volume_jour`, `statut` | Planificateur de rechauffement. |
| `DiagnosticPerformance` | `id`, `campagne_id`, `cause_racine` (`delivrabilite`\|`contenu`\|`ciblage`), `metriques_json`, `recommandation` | Le coeur du trou #3 : classer la sous-performance par cause, pas juste afficher des taux. |
| `ReponseEvenement` | `id`, `enrollment_id`, `type` (`reponse_positive`\|`reponse_negative`\|`conversion`), `source` (`webhook_provider`\|`detection_automatique`), `horodatage` | Alimente le recalcul de score. |
| `SegmentScore` | `id`, `liste_id`, `segment_critere_json`, `score_recalcule`, `suggestion_priorisation` | Recalcul de score par segment de la liste du client, pour prioriser la prochaine campagne. |

### 3.5 Relations cles entre modules

```
Client 1---N Mailbox
Client 1---N Domaine
Client 1---N ListeImportee 1---N Contact
Contact 1---1 VerificationResultat
Client 1---N Sequence 1---N SequenceEtape 1---N SequenceEtapeVariante
Client 1---N Campagne --- (1 ListeImportee, N Mailbox, 1 Sequence)
Campagne 1---N Enrollment N---1 Contact
Enrollment 1---N EnvoiEvenement
Client 1---N SuppressionEntree  (verifiee par Enrollment avant chaque envoi)
Campagne 1---N ReponseEvenement
ListeImportee 1---N SegmentScore
```

---

## 4. Flux complet : d'une liste importee a une campagne envoyee et analysee

1. **Onboarding client** : creation de compte, signature electronique
   du DPA (bloquant : `Client.dpa_signed_at` doit etre renseigne avant
   toute autre action), connexion d'au moins une `Mailbox` (OAuth
   Google Workspace / Microsoft 365, ou SMTP/IMAP generique) et d'au
   moins un `Domaine`.
2. **Verification du domaine** : check SPF/DKIM/DMARC au moment de la
   connexion, puis periodiquement (module Delivrabilite). Un domaine
   non conforme bloque l'activation d'une campagne dessus (avec
   message explicite, pas un blocage silencieux).
3. **Import de liste** : le client televerse sa `ListeImportee` (CSV
   ou connecteur). A l'import :
   a. dedoublonnage intra-liste ;
   b. **verification immediate contre `SuppressionEntree` du client**
      (un contact deja desinscrit d'une autre campagne du meme client
      est marque et exclu par defaut, jamais reimporte silencieusement
      comme "nouveau") ;
   c. lancement du module Verification sur chaque `Contact` restant
      (resultat SMTP, MX, age et pattern du domaine) -> `score_risque`
      explique.
4. **Construction de la sequence** : le client cree ou reutilise une
   `Sequence` avec ses `SequenceEtape` (contenu, delais, branches).
5. **Creation de la campagne** : association `Sequence` + `ListeImportee`
   (filtree par score de risque si le client choisit un seuil) +
   `Mailbox(es)` + fenetre d'envoi multi-fuseaux. Un `Enrollment` est
   cree par contact retenu.
6. **Programmation et envoi** : le moteur d'envoi respecte la fenetre
   horaire par fuseau du contact, le quota par mailbox, et **revalide
   `SuppressionEntree` juste avant l'envoi de chaque etape** (pas
   seulement a la creation de l'`Enrollment` — un contact peut se
   desinscrire d'une autre campagne du meme client entre-temps).
7. **Reception et boucle** : les webhooks de reponses/bounces/
   conversions alimentent `EnvoiEvenement` et `ReponseEvenement`. Une
   reponse "desinscription" cree immediatement une `SuppressionEntree`
   qui coupe l'`Enrollment` courant et tous les futurs, sur toutes
   les campagnes du client.
8. **Diagnostic** : le module Delivrabilite calcule un
   `DiagnosticPerformance` par campagne (cause racine : delivrabilite
   vs contenu vs ciblage) et un `SegmentScore` par segment de liste,
   avec suggestion de priorisation pour la campagne suivante.
9. **Audit / droit d'acces** : a la demande, generation d'un
   `AuditExport` par contact (quelle campagne, quelle date, quel
   statut d'opposition) — utilisable par le client comme preuve de
   conformite envers ses propres clients (positionnement argument de
   vente, pas contrainte).

---

## 5. Modele tarifaire

Decision retenue : **palier par volume d'emails envoyes par mois**
(pas au siege, pas a la boite mail connectee).

Points a fixer avant mise en prod (proposition de structure, chiffres
a valider) :

| Palier (exemple) | Volume envoye/mois | Mailboxes | Notes |
|---|---|---|---|
| Starter | jusqu'a 5 000 | illimitees | Cible solo/petite agence |
| Growth | jusqu'a 25 000 | illimitees | Cible agence en croissance |
| Scale | jusqu'a 100 000 | illimitees | Cible agence multi-clients |
| Custom | au-dela | illimitees | IP dediee incluse ou en option (cf. section 7) |

A trancher avant implementation (voir aussi section 7) :
- Definition exacte d'un "email envoye" facturable : chaque etape de
  sequence compte-t-elle une unite, y compris les relances
  automatiques ? Un envoi bloque par le registre de suppression
  compte-t-il (reponse : non, il ne doit jamais etre facture puisqu'il
  n'est pas envoye) ?
- Palier de depassement en cours de mois : blocage dur ou facturation
  a l'unite au-dela du palier ?
- Est-ce que le nombre de contacts uniques geres (dedoublonnes par le
  registre de suppression, argument #1) doit apparaitre comme
  metrique affichee au client meme si elle n'est pas facturante — pour
  renforcer la valeur percue de la conformite sans revenir sur le
  choix "volume" ?

---

## 6. Perimetre MVP (V1) retenu

**V1 = Module Envoi + Module Verification + Module Conformite basique.**

- Module Envoi : connexion mailbox, constructeur de sequences,
  programmation multi-fuseaux, **generation automatique de variantes
  A/B (objet + corps) a partir des colonnes du CSV importe par le
  client** (cf. section 9 — decision tranchee). Coeur du produit.
- Module Verification : score de risque explique a l'import.
- Module Conformite (basique) : registre de suppression unifie
  inter-campagnes + export d'audit minimal. **Le generateur de texte
  de notification multilingue est repousse en V2** (le registre et
  l'export d'audit suffisent a porter l'argument de vente #1 en V1 ;
  le generateur de texte est un raffinement, pas un bloquant).

**V2 = Module Delivrabilite et Boucle**, moins l'IP dediee (retiree du
perimetre V2 par defaut elle-meme, cf. ci-dessous) : warmup, diagnostic
par cause, webhooks de conversion, recalcul de score par segment +
generateur de notification multilingue du module Conformite +
**integration optionnelle avec des fournisseurs d'enrichissement tiers
deja conformes (Clay, Apollo, Cognism) pour la personnalisation
avancee** (cf. section 9 — pas de scraping interne).

**IP dediee : retiree du MVP, tranche.** Le trou concurrentiel #4
n'est pas construit en V1 ni promis en V2 par defaut. Il sera
reevalue en V2 uniquement sur demande client explicite — c'est-a-dire
qu'aucun second chemin d'envoi (relais SMTP propre, fournisseur d'IP
dediee) n'est developpe tant qu'un client n'en fait pas la demande.
Consequence directe : le produit n'a pas besoin en V1 d'evaluer ou de
contracter avec un fournisseur d'infrastructure d'envoi tiers — tout
l'envoi V1 passe par les mailboxes du client (OAuth Google Workspace
/ Microsoft 365, ou SMTP/IMAP generique), dont l'IP d'envoi reste
celle du fournisseur du client. Ancienne decision bloquante #1/#2
(ci-dessous) fermee par ce choix.

Justification : les modules V1 ne dependent plus d'aucun fournisseur
d'infrastructure d'envoi tiers, et couvrent deja le trou concurrentiel
le plus differenciant (#1, conformite comme argument de vente) et le
moins couteux techniquement. Le suivi SPF/DKIM/DMARC de base (lecture
seule, sans warmup ni IP dediee) peut migrer en V1 si le temps le
permet, car il est un prerequis de fiabilite de l'Envoi, pas une
fonctionnalite V2 a part entiere — a confirmer en cours de sprint
plutot qu'a trancher ici.

---

## 7. Decisions bloquantes avant la premiere ligne de code

1. ~~Mode de connexion des mailboxes et consequence sur l'IP dediee~~
   — **tranche** : OAuth Google Workspace + Microsoft 365 (Graph API)
   comme chemins principaux, SMTP/IMAP generique en repli ; IP dediee
   retiree du MVP et du perimetre V2 par defaut, reevaluee en V2
   uniquement sur demande client (cf. section 6). Aucun second chemin
   d'envoi ni fournisseur d'infrastructure d'envoi tiers a evaluer
   pour l'instant.
2. ~~Fournisseur d'IP dediee~~ — **sans objet pour l'instant**, a
   rouvrir seulement si un client demande l'option IP dediee en V2.
3. **Chiffres exacts des paliers de volume** (section 5) et definition
   facturable d'un "email envoye".
4. **Scope exact du "SMTP generique"** : jusqu'ou va-t-on dans la
   verification de la configuration SMTP/IMAP fournie par le client
   (test de connexion seul, ou validation SPF/DKIM sur son domaine
   avant activation) ?
5. **Hebergement et residence des donnees** : le DPA (section 2) doit
   nommer un lieu d'hebergement et des sous-traitants ulterieurs
   (l'hebergeur, le fournisseur d'email le cas echeant) — a arreter
   avant de faire valider le DPA par l'avocat, pas apres.
6. **Duree de conservation** des `EnvoiEvenement`, `SuppressionEntree`
   et `AuditExport` — necessaire pour remplir le DPA et le registre
   des traitements, non fixee dans ce document.
7. **Seuil de significativite statistique pour declarer une variante
   A/B gagnante** (cf. section 9) — a definir avant l'implementation
   du module de scoring, et deliberement plus eleve qu'un seuil
   calibre sur du DM (taux de reponse email structurellement plus
   faible que sur LinkedIn/DM, donc echantillon requis plus grand
   pour la meme confiance statistique).

---

## 8. Documents lies

- Modele de DPA (contrat de sous-traitance, article 28 RGPD) :
  [`legal/DPA-template.md`](./legal/DPA-template.md) — **brouillon,
  a faire valider par un avocat avant toute signature client.**
- Arborescence de projet : voir `src/`, `db/`, `legal/`, `docs/` a la
  racine du repo. Chaque dossier de module contient un `README.md`
  expliquant la responsabilite de sa couche (`domain` / `integration`
  / `presentation`) ; le MVP V1 (Envoi, Verification, Conformite
  basique) y est deja code, cf. PASSATION.md pour l'etat exact.
- Suivi d'avancement et journal de decisions : [`PASSATION.md`](./PASSATION.md).

---

## 9. Personnalisation et generation de variantes A/B (module Envoi)

Decision tranchee, integree au perimetre V1.

### 9.1 Pas de scraping LinkedIn — position tranchee

Le produit ne scrape jamais LinkedIn, ni directement (recuperation
automatisee de profils), ni indirectement via un lien de profil
LinkedIn depose dans une colonne du CSV importe. Deux raisons, qui se
renforcent :

1. **Risque juridique et de ToS trop eleve pour un SaaS package.**
   Le contentieux LinkedIn vs hiQ Labs a montre que la legalite du
   scraping de donnees publiques reste disputee et dependante de la
   juridiction ; construire une fonctionnalite qui en depend expose le
   produit a une action de LinkedIn (blocage technique, mise en
   demeure, contentieux) des lors qu'il opere a l'echelle d'un SaaS
   multi-client plutot qu'un usage individuel ponctuel.
2. **Incompatible avec le positionnement sous-traitant deja retenu**
   (section 2). Le montage juridique entier du produit repose sur une
   frontiere nette : le client apporte sa liste, le produit ne collecte
   rien lui-meme. Si le produit scrapait LinkedIn pour enrichir cette
   liste, il deciderait lui-meme de collecter une nouvelle categorie de
   donnees non fournie par le client — il redeviendrait responsable de
   traitement pour cette donnee-la, en contradiction directe avec le
   DPA (legal/DPA-template.md, Article 3) qui place toute decision de
   collecte du cote du client. Une seule fonctionnalite de scraping
   suffirait a invalider la position "sous-traitant pur" du produit.

Cette regle s'applique aussi indirectement : un lien de profil
LinkedIn present dans une colonne du CSV client n'est **jamais** suivi
ni scrape par le produit pour en extraire du contenu. La colonne est
traitee comme une donnee opaque parmi d'autres (cf. 9.2).

### 9.2 Perimetre V1 : variantes A/B a partir des colonnes du CSV client uniquement

La personnalisation automatique V1 genere des variantes d'objet et de
corps (`SequenceEtapeVariante`, cf. section 3.1) en utilisant
**exclusivement les colonnes presentes dans le CSV importe par le
client** (`Contact.donnees_additionnelles_json`, section 3.2) : nom,
entreprise, poste, et toute colonne libre que le client choisit
d'ajouter (ex : dernier post, actualite d'entreprise). Que ces colonnes
soient remplies a la main par le client ou via un outil d'enrichissement
tiers de son choix (Clay, Apollo, ou autre) ne change rien pour le
produit : il consomme la colonne, il ne va jamais la chercher lui-meme.

Consequence sur le modele de donnees (3.1) : `SequenceEtapeVariante`
porte un champ `champs_personnalisation_requis[]` qui declare les
colonnes attendues pour cette variante. Point a trancher au moment de
l'implementation (pas bloquant pour cette decision de perimetre) :
comportement si un contact n'a pas la colonne requise pour une
variante — repli sur une variante sans cette donnee, ou exclusion du
contact de la variante concernee.

### 9.3 Reutilisation de l'architecture du generateur A/B (outboundDM-max) — implemente

Le repository `outboundDM-max` a ete attache a la session et lu :
skill `.claude/skills/dm-prospecting/SKILL.md`, `src/utils/generator.ts`,
`src/utils/copywritingRules.ts`, `src/utils/metrics.ts`,
`src/components/Queue.tsx`, `shared/types.ts`. Le generateur de
variantes est porte et adapte du format DM (message unique) au format
email (**objet + corps** generes ensemble) dans
`src/modules/envoi/domain/personnalisation/` :

- `generator.ts` : mêmes 5 combinaisons structure x longueur x ton
  qu'en DM (jamais le ton seul), objet variant en parallele du corps
  (ex: structure "reference_activite" prefixe l'objet par la colonne
  detectee, ex: `{dernier_post} — <objet de reference>`).
- `copywriting-rules.ts` : regles ported (jargon, flatterie, urgence,
  prix hors ouverture, CTA unique a faible friction, rejet des
  demandes d'appel/rdv au premier contact) + regles specifiques a
  l'email (`lintSujet` : majuscules, exclamation, longueur, prix dans
  l'objet). Registre par defaut **vouvoiement** (norme du cold email
  B2B francais), contre le tutoiement par defaut du skill DM — l'axe
  ton bascule dans les deux sens (`formel`/`familier`).
- `variante-selection.ts` : rotation equilibree entre variantes
  actives par compteur d'envois (adapte du round-robin
  `buildQueue()`), plus resilient qu'un simple `i % n` a un traitement
  par lots interrompu.
- `scoring.ts` : cf. 9.4.

Aucune donnee n'est inventee : la colonne de personnalisation utilisee
par la structure "reference_activite" est detectee dans le texte de
reference lui-meme (`{colonne}`), jamais fabriquee ni recuperee par
scraping.

`SequenceEtapeVariante` (section 3.1) est persistee et assignee a
l'envoi via `EnrollmentService` : rotation equilibree si des variantes
actives existent pour l'etape, repli sur le contenu par defaut de
l'etape sinon ; `EnvoiEvenement.variante_id` trace la variante
effectivement envoyee.

### 9.4 Seuil de significativite statistique — fonction ecrite, seuils non tranches

outboundDM-max ne fait **aucun test de significativite** :
`src/utils/metrics.ts` declare "meilleur script" le taux de reponse
brut le plus eleve parmi les scripts ayant depasse un minimum fixe
d'envois (`MIN_DM_FOR_ELIGIBILITY = 10`). Adopter ce seuil tel quel
pour l'email declarerait des variantes "gagnantes" par bruit
statistique plutot que par effet reel, le taux de reponse email etant
structurellement plus faible que le DM.

`scoring.ts` (module Envoi, `personnalisation/scoring.ts`) implemente
donc un vrai test de significativite (z-test bilateral de comparaison
de deux proportions, approximation d'Abramowitz-Stegun de la fonction
d'erreur, sans dependance externe) plutot que le comptage minimal
d'outboundDM-max. **Les valeurs `SEUIL_SIGNIFICATIVITE_PROVISOIRE`
(alpha = 0.01) et `ENVOIS_MIN_PROVISOIRE` (200 par variante) sont des
placeholders explicitement marques comme tels dans le code — ce ne
sont pas la decision bloquante #7 de la section 7**, qui reste
entiere. Le test lui-meme (`comparerVariantes`) est correct et
utilisable des que ces deux constantes seront validees.

Ce module n'est pas encore branche a un tableau de bord : il depend
des evenements de reponse du module Delivrabilite (`ReponseEvenement`,
section 3.4), qui est V2 et n'est pas encore code (cf. PASSATION.md).
`comparerVariantes` est une fonction pure, testable independamment,
prete a etre branchee des que `ReponseEvenement` existe.

### 9.5 V2 (non developpe maintenant) : integration avec des fournisseurs d'enrichissement tiers conformes

Plutot que de construire un scraping interne (ecarte en 9.1), le
produit documente une option d'integration future — non developpee
dans le perimetre actuel — avec des fournisseurs d'enrichissement tiers
deja conformes et positionnes sur ce marche : **Clay, Apollo, Cognism**.
Le produit resterait sous-traitant pur : c'est le client qui choisit,
configure et autorise l'appel a son propre compte chez ces
fournisseurs (ou en important directement leur export dans son CSV,
deja possible en V1 sans aucun developpement specifique) ; le produit
ne fait que consommer les colonnes resultantes, exactement comme en
9.2. A trancher au moment de la V2 : integration API directe
(connexion du compte Clay/Apollo/Cognism du client) versus simple
documentation d'usage (le client exporte lui-meme et importe le CSV
enrichi, deja fonctionnel des V1).

### 9.6 Relances (follow-up) — implemente

Une `SequenceEtape` de rang (`ordre`) 0 est le premier contact ; toute
etape suivante est une relance (`typeEtape()`, derive de `ordre`,
jamais stocke separement). Le generateur de variantes traite les deux
cas differemment, avec une fonction dediee
`genererVariantesRelance()` distincte de `genererVariantesEmail()` :

- **Objet fixe, jamais varie entre les 5 variantes** : toujours
  `Re : {objet du premier contact}`. Contrairement au premier contact
  (ou l'objet varie selon la structure de la variante), faire varier
  l'objet d'une relance casserait le fil de conversation cote client
  mail et se lirait comme un nouveau cold open plutot qu'un suivi —
  l'objet du premier contact fait donc autorite, jamais celui de
  l'etape immediatement precedente (les clients mail threadent sur
  l'objet d'origine).
- **Ouverture systematiquement "relance"** (banque `RELANCE_OPENERS`,
  distincte de la banque de premier contact) : toute variante de
  relance reconnait explicitement qu'il s'agit d'un suivi, jamais une
  ouverture de cold open recyclee.
- **Lint anti-relance-vide** (`lintRelance`, port de la regle du skill
  `dm-prospecting` — "juste pour remonter dans ta boite" ne donne
  aucune raison de repondre) : signale une relance qui ne fait que
  reprendre une formule de remontee ("je me permets de relancer",
  "petit rappel"...) sans ajouter d'angle, de preuve, ou l'offre
  volontairement ecartee du premier message. Purement indicatif.
- **Case a cocher "inclure l'offre/le prix"** : desactive le retrait
  automatique du prix pour cette generation — la relance est
  precisement l'endroit designe pour reveler un detail volontairement
  absent du premier contact (meme principe que la regle CTA du skill
  DM : prix/offre jamais dans l'ouverture, reserves a une relance
  dediee).
- **Cadence indicative, jamais bloquante** : `CADENCE_SUGGEREE_JOURS`
  (0, 3, 7, 12, 18 jours) pre-remplit le delai suggere a l'ajout d'une
  etape ; `TOUCHES_RECOMMANDEES_MAX` (5) declenche un avertissement
  textuel au-dela de 5 touches au total — a l'inverse du DM (skill
  dm-prospecting plafonne a 1-2 relances, soit 2-3 touches), le cold
  email supporte des sequences de 3 a 5 touches sans schema de
  plafond dur impose.

Aucune nouvelle decision bloquante : ces choix (banque d'ouvertures,
seuils de cadence/lint) sont des parametres de produit revisables,
pas des points juridiques ou d'architecture.
