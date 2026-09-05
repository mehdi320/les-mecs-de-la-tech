# Copy landing page — Facturation électronique BTP

Statut : brouillon pour validation avec l'associé. Rien n'est codé tant que cette copy n'est pas validée.

Notes de lecture avant validation :

- Les variables `{{BETA_SEATS}}`, `{{BETA_PRICE}}` et `{{REGULAR_PRICE}}` ne sont pas tranchées. Elles resteront des variables dans le code, jamais du texte en dur.
- Aucun chiffre inventé, aucun compte à rebours, aucun faux logo. Ce qui manque encore (preuve sociale, chiffres d'usage) est traité par de la transparence, pas comblé par du bluff.
- Les sigles réglementaires (PDP, PA, e-reporting) n'apparaissent qu'en toute fin de FAQ, jamais avant.

---

## 1. Hero

**Titre**

> Vos situations de travaux, vos acomptes, vos retenues de garantie.
> Transformés en factures conformes, sans que vous ayez à y penser.

**Sous-titre**

> La facturation électronique devient obligatoire pour toutes les entreprises du bâtiment d'ici 2027. On branche votre façon de facturer sur les nouvelles règles, vous gardez la tête sur le chantier.

**CTA (unique)**

> Réserver ma place en bêta

---

## 2. Problème

*(Introduction courte, avant les trois scénarios)*

> Trois choses qui vous font perdre du temps ou de l'argent, et qu'on entend chez tous les artisans qu'on a interrogés.

**Scénario 1 — Le virement qui n'arrive pas**

> Vous envoyez votre facture de fin de chantier. Trois jours plus tard, le client vous rappelle : sa plateforme l'a rejetée, un champ ne correspond pas. Le temps de comprendre pourquoi, de la refaire, de la renvoyer, votre paiement a pris deux semaines de retard. Et c'est votre trésorerie qui encaisse le coup, pas la sienne.

**Scénario 2 — La situation de travaux refaite trois fois**

> Votre logiciel de facturation sait faire une facture simple. Une situation de travaux avec avancement, retenue de garantie et acompte déjà versé, il ne sait pas. Vous la montez à la main dans un tableur, ou vous l'envoyez à votre comptable qui la refacture à chaque fois. Ça revient cher, et ça vous prend une soirée que vous n'avez pas.

**Scénario 3 — Le client qui ne sait pas où vous trouver**

> Un nouveau client vous demande sur quelle plateforme lui envoyer ses règlements, ou par où passer pour recevoir vos factures. Vous ne savez pas quoi répondre. Résultat : des échanges de mails à rallonge pour un détail administratif, pendant que le chantier attend.

---

## 3. Solution

*(Description du flux vu par l'artisan, pas du schéma technique)*

> Vous continuez à travailler comme avant : vous saisissez une situation de travaux, un acompte, une retenue de garantie. On s'occupe de la transformer en facture qui passe, et de l'envoyer au bon endroit chez votre client.

**Bénéfice 1 — Une facture qui passe du premier coup**
*(répond au scénario du virement bloqué)*

> Votre facture arrive dans le bon format chez le client, sans rejet, sans aller-retour. Le paiement suit son cours normal.

**Bénéfice 2 — Vos situations de travaux prêtes sans ressaisie**
*(répond au scénario de la situation de travaux refaite)*

> Situation de travaux, acompte, retenue de garantie : vous les saisissez une fois, dans votre langage de chantier. On les transforme, vous ne les retapez pas ailleurs.

**Bénéfice 3 — Vos clients savent où vous trouver**
*(répond au scénario de l'invisibilité)*

> Une fois raccordé, vos clients savent automatiquement où vous envoyer leurs règlements et par où vous joindre. Plus d'échange de mails pour ça.

---

## 4. Comment ça marche

*(3 à 4 étapes, verbes d'action, aucun terme réglementaire)*

1. **Vous saisissez** votre situation de travaux, votre acompte ou votre facture comme vous le faites déjà.
2. **On transforme** votre saisie en facture prête à envoyer, dans les règles.
3. **Elle part** directement chez votre client, au bon endroit.
4. **Vous suivez** si elle est bien arrivée et bien reçue, sans courir après un accusé de réception.

---

## 5. Confiance

*(Pas de client existant, pas de faux témoignage : transparence assumée)*

> On construit cet outil maintenant, avec un petit groupe d'artisans du bâtiment qui vivent les mêmes chantiers que vous. On n'a pas de logo client à vous montrer, et on ne va pas en inventer un.
>
> La bêta est limitée volontairement : on préfère accompagner chaque artisan inscrit un par un plutôt que d'en prendre mille et de mal répondre à tout le monde. Une question, un blocage : vous tombez sur nous directement, pas sur un service client.

---

## 6. Offre bêta

*(Les valeurs exactes ne sont pas tranchées avec l'associé — voir variables ci-dessous)*

> **Places limitées à `{{BETA_SEATS}}` artisans.**
> Les premiers inscrits verrouillent leur tarif à `{{BETA_PRICE}}` à vie. Une fois la bêta terminée, le tarif normal passe à `{{REGULAR_PRICE}}`.
>
> Pas de carte bancaire à ce stade. On valide d'abord que l'outil vous fait gagner du temps, ensuite seulement il y a un abonnement.

**CTA**

> Réserver ma place au tarif bêta

---

## 7. FAQ

**Est-ce que je dois faire une démarche moi-même de mon côté ?**

> Non. Une fois raccordé, tout se fait automatiquement. Vous continuez à facturer comme avant, on gère la partie technique derrière.

**Mes données sont-elles sécurisées ?**

> Oui. Vos factures et vos données clients restent chez vous et chez les prestataires qu'on utilise pour les transmettre, personne d'autre n'y a accès.

**Que se passe-t-il si une facture est rejetée ?**

> On vous prévient tout de suite et on vous dit ce qui bloque, pour que vous puissiez corriger en quelques minutes au lieu de le découvrir deux semaines plus tard par un client qui n'a pas payé.

**Dois-je changer mon logiciel de facturation actuel ?**

> Non, dans la plupart des cas on se branche sur ce que vous utilisez déjà. On vous le confirme au moment de l'inscription si votre cas est différent.

**FAQ technique** *(pour les lecteurs qui connaissent déjà le sujet)*

> On est une Solution Compatible : on ne remplace pas votre Plateforme Agréée (PA), on transforme vos objets métier de chantier en facture conforme et on se raccorde à la PA de votre choix. Pas de démarche d'immatriculation ou d'e-reporting à gérer de votre côté, tout ça passe par nous et par la plateforme agréée.

---

## 8. CTA final

**Titre**

> On vous garde une place ?

**Texte**

> Laissez votre email, on vous recontacte pour vous faire entrer dans la bêta et vous montrer l'outil sur vos propres documents.

**Formulaire**

> Champ email + bouton [Réserver ma place]
> *(canal de capture — email vs DM — à trancher selon le canal de lancement retenu, non figé dans cette copy)*

---

## Points à valider avec l'associé avant mise en code

1. `{{BETA_SEATS}}`, `{{BETA_PRICE}}`, `{{REGULAR_PRICE}}` — les trois valeurs.
2. Canal de capture du CTA final : email direct, ou DM (et sur quel canal — Instagram, WhatsApp, autre).
3. Service de stockage du formulaire : Airtable, Resend, ou table SQLite locale.
4. Le sous-titre du hero mentionne "d'ici 2027" — à confirmer que c'est la date qu'on veut afficher, plutôt qu'une formulation encore plus vague si l'associé préfère ne rien dater du tout.
