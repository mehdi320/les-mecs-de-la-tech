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

## Decisions prises

| Decision | Choix retenu | Reference |
|---|---|---|
| Perimetre MVP (V1) | Envoi + Verification + Conformite basique (registre de suppression + export d'audit, sans generateur de notification) | SPEC.md section 6 |
| Modele tarifaire | Palier par volume d'emails envoyes/mois | SPEC.md section 5 |
| Connexion des mailboxes | OAuth Google Workspace + Microsoft 365 (Graph API), SMTP/IMAP generique en repli | SPEC.md section 7, point 1 |
| IP dediee | Retiree du MVP et du perimetre V2 par defaut ; reevaluee en V2 uniquement sur demande client explicite | SPEC.md section 6 |
| Position juridique | Client = responsable de traitement sur sa liste ; produit = sous-traitant art. 28 RGPD | SPEC.md section 2 |

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

Aucune de ces decisions ne bloque le code du MVP (V1) : elles sont
necessaires avant la mise en prod / signature client, pas avant la
premiere ligne de code. Le codage V1 demarre donc maintenant.

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
