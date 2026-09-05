# SPEC.md — SaaS B2B de cold email

Statut : brouillon de cadrage, avant premiere ligne de code.
Perimetre : ce document couvre le modele de donnees, le flux produit
de bout en bout, et un renvoi vers le modele de DPA. Les decisions
bloquantes non tranchees sont listees en section 7.

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
| `SequenceEtape` | `id`, `sequence_id`, `ordre`, `delai_jours`, `sujet`, `corps`, `condition_branche` (ex: si pas de reponse) | Contenu editorial de chaque etape. |
| `Campagne` | `id`, `client_id`, `sequence_id`, `liste_id` (FK vers `ListeImportee`, 3.2), `mailbox_ids[]`, `fuseau_horaire`, `fenetre_envoi` (ex: 9h-17h local contact), `statut` | Une execution concrete d'une sequence sur une liste. |
| `Enrollment` | `id`, `campagne_id`, `contact_id`, `etape_courante`, `statut` (`en_attente`\|`envoye`\|`repondu`\|`stoppe_suppression`\|`stoppe_reponse`) | Le lien contact <-> avancement dans la sequence. **Verifie le registre de suppression (3.3) avant chaque envoi d'etape**, pas seulement a la creation. |
| `EnvoiEvenement` | `id`, `enrollment_id`, `mailbox_id`, `horodatage`, `statut_smtp`, `message_id` | Trace technique d'un envoi individuel, source du diagnostic (3.4). |

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
Client 1---N Sequence 1---N SequenceEtape
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
  programmation multi-fuseaux. Coeur du produit.
- Module Verification : score de risque explique a l'import.
- Module Conformite (basique) : registre de suppression unifie
  inter-campagnes + export d'audit minimal. **Le generateur de texte
  de notification multilingue est repousse en V2** (le registre et
  l'export d'audit suffisent a porter l'argument de vente #1 en V1 ;
  le generateur de texte est un raffinement, pas un bloquant).

**V2 = Module Delivrabilite et Boucle**, moins l'IP dediee (retiree du
perimetre V2 par defaut elle-meme, cf. ci-dessous) : warmup, diagnostic
par cause, webhooks de conversion, recalcul de score par segment +
generateur de notification multilingue du module Conformite.

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

---

## 8. Documents lies

- Modele de DPA (contrat de sous-traitance, article 28 RGPD) :
  [`legal/DPA-template.md`](./legal/DPA-template.md) — **brouillon,
  a faire valider par un avocat avant toute signature client.**
- Arborescence de projet : voir `src/`, `db/`, `legal/`, `docs/` a la
  racine du repo. Chaque dossier de module contient un `README.md`
  expliquant la responsabilite de sa couche (`domain` / `integration`
  / `presentation`), sans code applicatif a ce stade.
- Suivi d'avancement et journal de decisions : [`PASSATION.md`](./PASSATION.md).
