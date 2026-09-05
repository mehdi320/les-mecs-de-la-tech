# PASSATION.md

Journal de suivi et document de passation entre sessions de travail
sur ce projet. A mettre a jour a chaque session, pas seulement en fin
de projet.

---

## Etat actuel

Phase : cadrage, aucune ligne de code applicatif ecrite.

Livrables produits a ce stade :
- `SPEC.md` — modele de donnees des quatre modules, flux complet
  liste importee -> campagne envoyee et analysee, perimetre MVP.
- `legal/DPA-template.md` — brouillon de contrat de sous-traitance,
  **non valide par un avocat**.
- Arborescence de projet par module (`src/modules/*/{domain,integration,presentation}`),
  documentee via des `README.md`, sans code applicatif.

## Decisions prises

| Decision | Choix retenu | Reference |
|---|---|---|
| Perimetre MVP (V1) | Envoi + Verification + Conformite basique (registre de suppression + export d'audit, sans generateur de notification) | SPEC.md section 6 |
| Modele tarifaire | Palier par volume d'emails envoyes/mois | SPEC.md section 5 |
| Connexion des mailboxes | OAuth Google Workspace + Microsoft 365 (Graph API), SMTP/IMAP generique en repli | SPEC.md section 7, point 1 |
| Position juridique | Client = responsable de traitement sur sa liste ; produit = sous-traitant art. 28 RGPD | SPEC.md section 2 |

## Decisions bloquantes en attente (a trancher avant code)

Liste complete et a jour dans `SPEC.md` section 7. Resume :

1. **Chemin d'envoi propre / IP dediee** — non tranche. La connexion
   par mailbox client (Google/Microsoft) implique que l'IP d'envoi
   n'est pas la notre ; l'option IP dediee (trou concurrentiel #4)
   suppose un second chemin d'envoi que le produit devrait operer
   (relais SMTP marque blanche vs partenaire cold-outreach vs
   self-hosted). Sans ce choix, le trou #4 n'a pas d'implementation.
2. Fournisseur d'IP dediee — depend du point 1.
3. Chiffres exacts des paliers de volume et definition facturable
   d'un "email envoye".
4. Scope exact de la verification SMTP/IMAP generique.
5. Hebergement et residence des donnees (necessaire pour finaliser le
   DPA, Annexe 3).
6. Duree de conservation des `EnvoiEvenement`, `SuppressionEntree`,
   `AuditExport` (necessaire pour le DPA Article 8 et les CGU).

## Prochaines etapes

1. Trancher les decisions bloquantes ci-dessus (session de decision,
   pas de code).
2. Faire valider `legal/DPA-template.md` par un avocat, et rediger la
   clause miroir dans les CGU en parallele.
3. Une fois 1 et 2 avances : premiere implementation du module Envoi
   (connexion mailbox OAuth, modele de donnees SQLite section 3.1),
   puis Verification, puis Conformite basique — dans cet ordre,
   conformement au perimetre MVP retenu.

## Journal de session

### Session 1 — cadrage initial
- Production de `SPEC.md`, `legal/DPA-template.md`, arborescence de
  projet documentee, et de ce `PASSATION.md`.
- Trois questions de cadrage posees a l'utilisateur (perimetre MVP,
  structure tarifaire, mode de connexion des mailboxes) — reponses
  integrees ci-dessus. Le fournisseur d'IP dediee reste ouvert : la
  reponse recue portait sur le mode de connexion des mailboxes, pas
  sur le choix d'un fournisseur d'IP dediee — voir decision bloquante
  #1 ci-dessus.
