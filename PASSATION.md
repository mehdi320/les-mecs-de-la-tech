# PASSATION.md

Journal de suivi et document de passation entre sessions de travail
sur ce projet. A mettre a jour a chaque session, pas seulement en fin
de projet.

---

## Etat actuel

Phase : MVP (V1) code et fonctionnel en local — Envoi + Verification +
Conformite basique, cf. golden path teste ci-dessous. Non deploye,
pas d'authentification, plusieurs decisions de la section suivante
restent a trancher avant mise en prod.

### Comment lancer le projet en local

```
cp .env.example .env.local   # puis renseigner APP_SECRET_KEY au minimum
npm install
npm run db:migrate
npm run db:seed              # cree le client "demo-client"
npm run dev
```

Toutes les pages operent sur `demo-client` (cf.
`src/shared/integration/current-client.ts`) : l'authentification
multi-client n'est pas dans le perimetre code cette session.

### Ce qui est code (V1)

- **Module Envoi** : mailboxes (connexion SMTP generique fonctionnelle
  avec test de connexion reel ; OAuth Google Workspace/Microsoft 365
  ecrits mais non testables sans identifiants applicatifs, cf. risques
  ci-dessous), domaines (verification SPF/DMARC par requete DNS reelle,
  DKIM laisse "inconnu"), sequences et etapes, campagnes, enrollments
  avec revalidation du registre de suppression avant chaque envoi
  (`EnrollmentService.envoyerProchaineEtape`).
- **Module Verification** : import de liste avec dedoublonnage et
  exclusion immediate des contacts deja supprimes, verification MX
  (DNS reel) et SMTP (handshake reel EHLO/MAIL FROM/RCPT TO, detection
  catch-all), score de risque explique. Age de domaine (whois) non
  implemente — decision fournisseur toujours ouverte (SPEC.md section
  7, point 4) : `AucunDomaineAgeChecker` renvoie toujours `null`.
- **Module Conformite** : registre de suppression unifie par client,
  export d'audit par contact (hash email, historique de campagnes via
  jointure en lecture seule vers le module Envoi, statut d'opposition).
  Generateur de notification multilingue non code (V2, cf. SPEC.md
  section 6).
- **Personnalisation / variantes A/B** (SPEC.md section 9) : generateur
  d'objet+corps porte depuis outboundDM-max (`src/modules/envoi/domain/personnalisation/`),
  rotation equilibree a l'envoi, template `{colonne}` rendu depuis
  `Contact.donnees_additionnelles_json`. Module de scoring
  (`scoring.ts`, z-test de proportions) ecrit mais pas encore
  branche a un tableau de bord dedie — les taux d'ouverture/reponse
  existent desormais (cf. ci-dessous) mais rien n'agrege encore par
  variante ; seuils provisoires clairement marques comme tels dans le
  code, decision bloquante #7 toujours ouverte.
- **Module Delivrabilite (V2) : deux tranches codees en avance de
  perimetre** (SPEC.md sections 9.7/9.8, sur demande explicite) :
  suivi d'ouverture par pixel de tracking (`EnvoiEvenement.ouvert_at`,
  route `/api/tracking/pixel/[eventId]`, necessite `APP_BASE_URL` —
  non fonctionnel en local, seul un deploiement avec URL publique le
  rend actif), marquage manuel de reponse (pas de detection
  automatique, meme logique qu'outboundDM-max), statut visuel en
  smiley (`statutVisuelEnrollment()`), et diagnostic de
  sous-performance par cause (`diagnostiquer()`, regles a seuils
  provisoires — decision bloquante #8). Reste V2 non code : `IPDediee`,
  `WarmupPlan`, `SegmentScore`, persistance du diagnostic.
- Chiffrement au repos des secrets de mailbox (AES-256-GCM,
  `src/shared/integration/secrets.ts`), requiert `APP_SECRET_KEY`.
- Composition root unique : `src/shared/integration/container.ts` —
  aucune page n'instancie une classe SQLite directement.

### Golden path teste (Playwright, en local, pas commite)

Connexion mailbox SMTP -> ajout domaine + verif SPF/DMARC -> creation
sequence + etape -> import liste (dedup + suppression) -> lancement
verification -> creation campagne (avec enrollments filtres par
score) -> traitement des envois en attente -> ajout suppression
manuelle -> generation export d'audit. Les neuf etapes passent de
bout en bout sur le dev server local.

### Risques et limites connus, a traiter avant mise en prod

1. **Next.js 14.2.35 a des vulnerabilites hautes non patchees dans
   cette branche majeure** (postcss bundle, Server Actions/RSC —
   `npm audit`). Le correctif complet impose une migration vers
   Next 16 (breaking : APIs async, config), non faite cette session
   car hors scope et risque de regression sans tests d'ecran plus
   larges. A planifier avant tout deploiement expose.
2. OAuth Google Workspace et Microsoft 365 sont ecrits (auth URL,
   echange de code, refresh, envoi) mais **jamais executes** faute
   d'identifiants d'application (`GOOGLE_CLIENT_ID`/`MICROSOFT_CLIENT_ID`
   etc., cf. `.env.example`) — a tester des l'enregistrement des apps
   OAuth aupres de Google/Microsoft.
3. Pas de planificateur d'envoi temps reel ni de respect de fenetre
   horaire/quota au moment de l'envoi : `traiterCampagne` (page
   Campagnes) declenche manuellement l'envoi de tous les enrollments
   en attente d'un coup. La fenetre horaire et le quota par mailbox
   sont stockes en donnees mais pas encore appliques par un moteur de
   planification.
4. Verification SMTP par handshake reel sur le port 25 : de nombreux
   reseaux (dont potentiellement l'hebergeur retenu) bloquent ce port
   sortant, auquel cas le resultat retombe sur `inconnu` — comportement
   voulu, mais a valider sur l'infra de production cible.
5. Aucune authentification / session utilisateur : toutes les pages
   utilisent le client de demo. Bloquant pour tout usage multi-client
   reel.
6. Rotation A/B non testee sous forte charge : `choisirVarianteEquilibree`
   lit les compteurs a chaque envoi (pas de verrou), une course entre
   deux envois strictement simultanes pour la meme etape peut
   deconnecter tres legerement l'equilibre — negligeable au volume du
   MVP, a revisiter si le planificateur temps reel (risque #3) envoie
   en parallele.
7. Les regles de vouvoiement/tutoiement du generateur de variantes
   (`generator.ts`) ne couvrent qu'un nombre limite de tournures a
   objet direct/indirect ("vous dire" -> "te dire") — une variante
   generee reste **a relire avant activation**, comme le rappelle le
   README d'outboundDM-max pour l'original DM.
8. **`EnrollmentService` fait progresser l'etape et passe l'enrollment
   a `envoye` meme quand l'envoi SMTP a effectivement echoue** — le
   badge de statut d'enrollment peut afficher `envoye` alors que le
   smiley de la meme ligne affiche `echec` (cf. SPEC.md section 9.7).
   Trouve en testant le statut visuel, pas corrige (changement de
   comportement distinct — retry ou blocage sur echec — hors
   perimetre de la demande qui a introduit le smiley).
9. Suivi d'ouverture non fonctionnel en local (`APP_BASE_URL` non
   joignable depuis internet) — code correct, a valider une fois
   deploye. Le taux d'ouverture, meme une fois actif, sous-estimera
   toujours le taux reel (blocage d'images cote client mail) : signal
   relatif, jamais un chiffre absolu.

## Decisions prises

| Decision | Choix retenu | Reference |
|---|---|---|
| Perimetre MVP (V1) | Envoi + Verification + Conformite basique (registre de suppression + export d'audit, sans generateur de notification) | SPEC.md section 6 |
| Modele tarifaire | Palier par volume d'emails envoyes/mois | SPEC.md section 5 |
| Connexion des mailboxes | OAuth Google Workspace + Microsoft 365 (Graph API), SMTP/IMAP generique en repli | SPEC.md section 7, point 1 |
| IP dediee | Retiree du MVP et du perimetre V2 par defaut ; reevaluee en V2 uniquement sur demande client explicite | SPEC.md section 6 |
| Position juridique | Client = responsable de traitement sur sa liste ; produit = sous-traitant art. 28 RGPD | SPEC.md section 2 |
| Personnalisation V1 | Variantes A/B (objet + corps) generees uniquement a partir des colonnes du CSV client, jamais de scraping LinkedIn (direct ou via lien profil) | SPEC.md section 9 |
| Enrichissement tiers | Pas de scraping interne ; integration optionnelle Clay/Apollo/Cognism documentee pour la V2, non developpee maintenant | SPEC.md section 9.5 |

## Decisions bloquantes en attente (a trancher avant mise en prod)

Liste complete et a jour dans `SPEC.md` section 7. Resume (points 1
et 2 fermes par la decision IP dediee ci-dessus) :

3. Chiffres exacts des paliers de volume et definition facturable
   d'un "email envoye".
4. Scope exact de la verification SMTP/IMAP generique.
5. Hebergement et residence des donnees (necessaire pour finaliser le
   DPA, Annexe 3).
6. Duree de conservation des `EnvoiEvenement`, `SuppressionEntree`,
   `AuditExport` (necessaire pour le DPA Article 8 et les CGU).
7. Seuil de significativite statistique pour declarer une variante
   A/B gagnante (module de scoring, personnalisation) — doit etre
   plus eleve qu'un seuil calibre sur du DM, cf. SPEC.md section 9.4.
   Bloquant pour l'implementation du scoring, pas pour le reste du
   generateur de variantes.

Aucune de ces decisions ne bloque le code du MVP (V1) deja livre.
Le point 7 bloque specifiquement le module de scoring de variantes
(section suivante), pas la generation de variantes elle-meme.

## Prochaines etapes

1. Enregistrer les applications OAuth Google Workspace et Microsoft
   365 et tester la connexion mailbox de bout en bout (risque #2
   ci-dessus).
2. Decider et implementer un planificateur d'envoi respectant la
   fenetre horaire multi-fuseaux et le quota par mailbox (risque #3).
3. Trancher les decisions bloquantes de mise en prod (SPEC.md section
   7, points 3 a 6) et faire valider `legal/DPA-template.md` par un
   avocat.
4. Planifier la migration Next.js 14 -> 16 (risque #1) avant tout
   deploiement expose a un reseau non controle.
5. Authentification multi-client (risque #5), puis modules
   Delivrabilite complet et generateur de notification (V2).
6. Trancher le seuil de significativite statistique (decision
   bloquante #7, SPEC.md section 9.4) puis brancher `scoring.ts` a un
   tableau de bord une fois `ReponseEvenement` (module Delivrabilite,
   V2) code — le generateur de variantes lui-meme est deja livre.

## Journal de session

### Session 1 — cadrage initial
- Production de `SPEC.md`, `legal/DPA-template.md`, arborescence de
  projet documentee, et de ce `PASSATION.md`.
- Trois questions de cadrage posees a l'utilisateur (perimetre MVP,
  structure tarifaire, mode de connexion des mailboxes) — reponses
  integrees ci-dessus.

### Session 2 — code du MVP (V1)
- IP dediee tranchee : retiree du MVP et du perimetre V2 par defaut,
  reevaluee en V2 sur demande client (SPEC.md sections 6-7 mises a
  jour).
- Bootstrap Next.js 14 (App Router) + TypeScript + Tailwind + SQLite
  (better-sqlite3), architecture domain/integration/presentation par
  module conformement a l'arborescence de la session 1.
- Implementation complete des modules Envoi, Verification, Conformite
  (basique) : entites, repositories SQLite, services de domaine
  (`EnrollmentService`, `VerificationService`, `ImporterListeService`,
  `AuditExportService`), connecteurs reels (SMTP generique, MX/SPF/
  DMARC par DNS, handshake SMTP), pages et server actions.
- Golden path valide de bout en bout via Playwright en local (details
  ci-dessus) ; `npm run build` et `npm run typecheck` passent sans
  erreur.
- Vulnerabilite nodemailer <=9 corrigee (bump vers v10). Vulnerabilite
  Next.js 14.x restante documentee comme risque #1 ci-dessus, non
  corrigee cette session (migration majeure hors scope).

### Session 3 — decision personnalisation / variantes A/B (pas de code)
- Nouvelle section `SPEC.md` 9 : pas de scraping LinkedIn (direct ou
  via lien profil CSV), personnalisation V1 limitee aux colonnes du
  CSV client (manuelles ou via enrichissement tiers de son choix),
  reutilisation prevue de l'architecture du generateur A/B
  d'outboundDM-max (skill `dm-prospecting`) adaptee au format email,
  seuil de significativite statistique a definir avant le scoring
  (decision bloquante #7), integration Clay/Apollo/Cognism documentee
  pour la V2 uniquement.
- Modele de donnees etendu (SPEC.md 3.1) : nouvelle entite
  `SequenceEtapeVariante`, `EnvoiEvenement.variante_id`.
- Pas de code ecrit cette session : `outboundDM-max` n'est pas dans le
  perimetre des repos attaches — l'ajouter ou fournir une description
  precise de son interface avant de porter le generateur.

### Session 4 — port du generateur A/B vers l'email
- Repository `mehdi320/outboundDM-max-` attache et clone dans
  `/home/user/outbounddm-max-` (`add_repo` + `register_repo_root`).
  Lecture du skill `dm-prospecting`, de `generator.ts`,
  `copywritingRules.ts`, `metrics.ts`, `Queue.tsx`, `shared/types.ts`.
- Port complet dans `src/modules/envoi/domain/personnalisation/`
  (entites, `copywriting-rules.ts`, `generator.ts`, `scoring.ts`,
  `repositories.ts`, `variante-selection.ts`) + `shared/domain/template.ts`
  (rendu `{colonne}`, partage avec le contenu par defaut des etapes).
  Migration `0002_variantes.sql` (`sequence_etape_variantes`,
  `envoi_evenements.variante_id`). `EnrollmentService` etendu :
  rotation equilibree + rendu de template avant envoi (comblait un
  trou existant — aucun rendu de template n'etait fait avant cette
  session, meme pour le contenu par defaut d'une etape).
  UI : generation de variantes et changement de statut dans la page
  Sequences.
- Deux bugs reels trouves et corriges pendant le test manuel
  (Playwright) : (1) les ouvertures de recentrage "reference-activite"
  reintroduisaient un pronom auto-centre ("mon attention") sans
  compenser par du "vous", annulant leur propre effet ; (2) le swap
  vouvoiement<->tutoiement generique cassait la grammaire sur les
  verbes a objet ("tu aider" au lieu de "t'aider") — ajout de cas
  specifiques traites avant le remplacement generique, comme le fait
  deja l'original DM pour "avec vous"/"pour vous"/"chez vous".
- `npm run build` et `npm run typecheck` passent sans erreur ; flux
  manuel valide en local (creation etape -> generation de 5 variantes
  -> filtrage effectif du CTA a forte friction de la reference ->
  changement de statut gagnante/perdante).
- Module de scoring (z-test) ecrit avec seuils explicitement
  provisoires (risque/decision bloquante #7 toujours ouverte) ; non
  branche a un tableau de bord (depend de `ReponseEvenement`, V2).

### Session 5 — design system UI/UX
- Kit UI partage (`src/shared/ui/`) : `Button`/`SubmitButton` (etat de
  chargement via `useFormStatus` — avant cette session, aucun clic ne
  donnait de retour visuel pendant qu'une Server Action tournait),
  `Field`/`Input`/`Textarea`/`Select`, `Card`, `Badge` (mapping
  centralise statut -> couleur), `EmptyState`, `PageHeader`,
  `StatCard`, `RiskScore` (score de risque toujours colore par palier,
  jamais un chiffre nu), icones ligne dessinees a la main (pas de
  dependance externe).
  Palette `brand` (indigo, `tailwind.config.ts`), police Inter avec
  fallback systeme.
- Sidebar reconstruite (`src/shared/presentation/nav.tsx`, client
  component) : etat actif par route, icone par module, panneau client
  (nom, palier, statut DPA) — `sticky top-0 h-screen` pour rester
  visible sur les pages longues (bug trouve en testant : sans ca, la
  sidebar defilait avec le contenu et disparaissait sur la page
  Sequences des qu'il y a plusieurs variantes).
- Accueil transforme en vrai tableau de bord (compteurs mailboxes/
  domaines/sequences/contacts/campagnes/suppressions, alerte DPA non
  signe, message si aucune mailbox). Les 6 autres pages retravaillees
  avec le kit UI : formulaires structures (`Field`), etats vides
  distincts d'un tableau réellement vide, garde-fou "prerequis
  manquants" sur Campagnes (les selects sequence/liste/mailbox vides
  affichaient un formulaire inutilisable) plutot qu'un formulaire
  silencieusement casse.
- Bug de build trouve et corrige : le layout racine lit desormais le
  client en base (panneau sidebar), ce qui faisait echouer
  `npm run build` sur `/_not-found` avant toute migration (prerendu
  statique tentant une requete SQL sur une base non encore migree) —
  `export const dynamic = "force-dynamic"` ajoute au layout.
- Validation visuelle par captures d'ecran (Playwright, donnees de
  demo, pas commitees) sur les 7 pages ; `npm run build` et
  `npm run typecheck` passent sans erreur.
- Non fait cette session (a signaler, pas oublie) : pas de mode
  sombre, pas de responsive mobile (dashboard interne desktop, comme
  outboundDM-max) ; les toasts de succes/erreur restent a faire —
  seul l'etat de chargement des boutons a ete traite pour le retour
  d'action.

### Session 6 — suppression (CRUD complet sur les entites principales)
- Aucune entite n'etait supprimable depuis l'UI avant cette session
  (seul "exclure de la rotation" existait pour les variantes, un
  statut, pas une suppression). Ajout de `delete()`/`supprimer()` aux
  repositories SQLite et d'un bouton de suppression (avec confirmation
  navigateur) pour : mailboxes, domaines, sequences (cascade etapes +
  variantes en base), etapes (cascade variantes), variantes A/B (en
  plus du statut "perdante", qui reste utile pour exclure sans
  perdre l'historique), listes importees (cascade contacts,
  resultats de verification, et enrollments de campagne bases sur ces
  contacts — signale dans le message de confirmation), campagnes
  (cascade enrollments + evenements d'envoi), entrees du registre de
  suppression (confirmation renforcee : le contact redevient
  contactable par toutes les campagnes du client).
- `src/shared/ui/delete-button.tsx` (client component) : appelle
  l'action serveur directement (pas de `<form action>`), ce qui permet
  de lire son retour et d'afficher "suppression bloquee" quand une
  contrainte de cle etrangere empeche la suppression (mailbox ou
  campagne encore reference par des envois/suppressions historiques,
  cf. `src/shared/integration/delete-guard.ts`) — premiere brique de
  retour d'erreur cote UI, avant le systeme de toast general qui reste
  a construire.
- Bug de test trouve en verifiant (pas dans l'app) : mes premiers
  scripts Playwright ciblaient les cartes par classes Tailwind
  generiques (`div.rounded-lg.border`) partagees entre le conteneur
  d'etape et les cartes de variantes, menant a des suppressions
  ambigues dans le test lui-meme. Reproduit avec des selecteurs
  precis (classes completes) : suppression d'une seule variante
  laisse les autres intactes, suppression d'une etape ne supprime que
  ses variantes, suppression d'une sequence supprime tout — confirme
  correct cote application.
- Volontairement laisse de cote : pas de suppression au niveau d'un
  contact individuel dans une liste (seule la liste entiere se
  supprime) — ajouter une ligne d'action par contact dans un tableau
  potentiellement long n'apportait pas assez de valeur pour le temps
  investi cette session ; a reconsiderer si le besoin se confirme.
- `npm run build` et `npm run typecheck` passent sans erreur.

### Session 7 — relances (follow-up) et variantes de relance
- Une `SequenceEtape` de rang 0 est le premier contact, toute etape
  suivante une relance (`typeEtape()`, derive de `ordre`). Nouvelle
  fonction `genererVariantesRelance()` (distincte de
  `genererVariantesEmail()`, cf. SPEC.md section 9.6) : objet fixe
  "Re : {objet du premier contact}" jamais varie entre les 5 variantes
  (contrairement au premier contact), banque d'ouvertures de relance
  dediee, case a cocher pour inclure volontairement le prix/l'offre
  (reserve normalement a une relance), lint `relance_vide` portant la
  regle du skill dm-prospecting ("jamais une simple remontee sans
  element nouveau"). Cadence indicative (0/3/7/12/18 jours) et seuil
  de 5 touches recommandees (non bloquant), a l'inverse du plafond dur
  de 1-2 relances du DM.
- Trois bugs reels trouves et corriges en testant (Playwright,
  scenarios premier contact + relance) :
  1. Grammaire cassee au swap tutoiement sur les verbes introduits par
     la relance ("vous relancer" -> "tu relancer" au lieu de "te
     relancer", "vers vous" -> non traite) — ajout des cas manquants
     dans les tables de swap (meme categorie de bug que la session 4,
     nouveaux verbes introduits par le vocabulaire de relance).
  2. Le lint anti-relance-vide ne detectait les formules-declencheurs
     ("je me permets de vous relancer"...) qu'en vouvoiement : une
     variante tutoyee par le swap de ton echappait au lint. Regex
     desormais a double registre (`phraseRegexRegistres`).
  3. **Regenerer des variantes pour une etape qui en a deja 5
     provoquait un crash serveur** (contrainte d'unicite
     `sequence_etape_id + nom` violee : le nommage A-E rebouclait via
     un modulo au lieu de continuer en V6, V7...). Corrige — un
     second cycle de generation ajoute desormais des variantes plutot
     que d'entrer en collision. Bug preexistant (pas introduit cette
     session), trouve en testant le flux de relance en conditions
     repetees.
- `pricing_in_opener` (lint general) filtre sur les variantes de
  relance : ce signal part du principe qu'un premier contact ne doit
  jamais porter de prix, ce qui n'a pas lieu d'etre sur une relance
  (l'endroit designe pour le reveler).
- `npm run build` et `npm run typecheck` passent sans erreur ; verifie
  manuellement (Playwright) : badge de type d'etape correct, objet
  identique entre les 5 variantes de relance et prefixe "Re : ",
  lint relance_vide se declenche sur un corps bump-only et pas sur un
  corps substantiel, case "inclure l'offre" preserve effectivement un
  prix normalement retire.

### Session 8 — statut visuel (smiley) et diagnostic de sous-performance
- Sur demande, avance de perimetre sur deux tranches du module
  Delivrabilite (V2, SPEC.md sections 9.7/9.8) plutot que d'attendre :
  1. **Suivi d'ouverture par pixel** : migration 0003
     (`envoi_evenements.ouvert_at`), route
     `/api/tracking/pixel/[eventId]` (toujours 200 + GIF transparent,
     y compris sur un id inconnu — un pixel ne doit jamais faire
     echouer l'affichage cote destinataire), `APP_BASE_URL` requis
     (non fonctionnel en local). L'id de l'evenement d'envoi est
     desormais genere avant l'envoi (`crypto.randomUUID()` dans
     `EnrollmentService`, plus par le repository a l'insertion) pour
     pouvoir construire l'URL du pixel et l'injecter dans le corps
     avant meme d'envoyer.
  2. **Reponse : marquage manuel** (`marquerEnrollmentRepondu`,
     bouton par ligne d'enrollment) — pas de detection automatique
     (demanderait IMAP ou un webhook fournisseur, aucun des deux
     construit), meme logique que le marquage manuel d'outboundDM-max.
- **Statut visuel en smiley** (`statutVisuelEnrollment()` +
  4 icones SVG dessinees a la main dans le style du reste du kit UI,
  pas des emoji unicode) : echelle choisie par l'utilisateur —
  envoye = content, repondu = tres content, ouvert = normal, echec =
  pas content (pas un score d'engagement croissant). Affiche par
  ligne d'enrollment sur la page Campagnes.
- **Diagnostic de sous-performance par cause**
  (`delivrabilite/domain/diagnostic-performance.ts`, `diagnostiquer()`) :
  regles a seuils (delivrabilite / contenu / ciblage / aucune),
  croisant taux d'echec, taux d'ouverture, taux de reponse, score de
  risque moyen de la liste (deja existant), validite SPF/DMARC du
  domaine de la mailbox (deja existant). Seuils explicitement
  provisoires (nouvelle decision bloquante #8, SPEC.md section 7).
  Calcule a la volee sur la page Campagnes, pas persiste.
- Bug reel observe en testant (pas corrige, documente comme risque
  #8) : `EnrollmentService` avance l'enrollment a `envoye` meme quand
  l'envoi a echoue — le smiley (qui lit le dernier `EnvoiEvenement`)
  est dans ce cas le signal fiable, le badge de statut d'enrollment
  un peu trompeur. Corriger l'avancement sur echec est un changement
  de comportement distinct de cette demande.
- `npm run build` et `npm run typecheck` passent sans erreur ; verifie
  manuellement (Playwright + curl direct sur la route pixel) :
  pixel repond 200/GIF meme sur id inconnu, diagnostic affiche "pas
  assez d'envois" en dessous du seuil, marquage manuel de reponse
  fonctionne et se reflete immediatement dans le smiley.
