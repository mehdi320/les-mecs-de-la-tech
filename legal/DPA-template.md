# Modele de DPA (Data Processing Agreement) — brouillon

**AVERTISSEMENT : ce document est un brouillon de travail destine a
etre revu, corrige et valide par un avocat specialise en protection
des donnees avant toute utilisation contractuelle reelle. Aucune
clause ci-dessous ne doit etre presentee a un client comme definitive
avant cette validation. Les references legales (articles RGPD) sont
indicatives et doivent etre verifiees.**

---

## Contrat de sous-traitance de donnees a caractere personnel

Entre :

**[NOM DU CLIENT]**, ci-apres "le Responsable de traitement",

Et :

**[NOM DE LA SOCIETE EDITRICE DU PRODUIT]**, ci-apres "le Sous-traitant",

Il est convenu ce qui suit, en application de l'article 28 du
Reglement General sur la Protection des Donnees (RGPD).

### Article 1 — Objet

Le present contrat encadre le traitement de donnees a caractere
personnel effectue par le Sous-traitant pour le compte du Responsable
de traitement, dans le cadre de l'utilisation de la plateforme
[NOM DU PRODUIT] (ci-apres "la Plateforme") pour l'envoi de campagnes
de prospection par email (cold email).

### Article 2 — Description du traitement

- **Nature du traitement** : hebergement, envoi, mesure de la
  performance, verification technique (score de risque email) et
  gestion du registre de suppression des donnees de contact fournies
  par le Responsable de traitement.
- **Finalite** : execution des campagnes d'emailing de prospection
  commandees par le Responsable de traitement, et protection de la
  delivrabilite associee.
- **Categories de personnes concernees** : contacts professionnels
  ou particuliers figurant dans les listes importees par le
  Responsable de traitement.
- **Categories de donnees** : adresse email, et le cas echeant
  prenom, nom, fonction, entreprise, et toute autre donnee que le
  Responsable de traitement choisit d'inclure dans sa liste importee.
  Le Sous-traitant ne collecte, n'enrichit et ne complete lui-meme
  aucune de ces donnees a partir d'une source tierce.
- **Duree du traitement** : duree du contrat commercial entre les
  parties, plus la duree de conservation post-resiliation prevue a
  l'Article 8 [DUREE A FIXER].

### Article 3 — Origine et licite des donnees (clause centrale)

Le Responsable de traitement declare et garantit que :

1. il est seul decisionnaire du contenu de ses listes de contacts,
   quelle qu'en soit la source (base propre, CRM, fournisseur tiers,
   export manuel) ;
2. il dispose d'une base legale valide au sens de l'article 6 du RGPD
   pour contacter chacune des personnes figurant dans ses listes
   (interet legitime documente, consentement, ou autre base
   applicable selon la juridiction concernee) ;
3. il est seul responsable du respect des obligations d'information
   des personnes concernees prealables a l'envoi, lorsque la base
   legale retenue l'exige ;
4. le Sous-traitant n'a pas d'obligation de verifier la licite de la
   collecte initiale des donnees importees par le Responsable de
   traitement, et n'engage pas sa responsabilite a ce titre.

Cette clause doit avoir une clause miroir dans les Conditions
Generales d'Utilisation (CGU) de la Plateforme, redigee avec le meme
avocat.

### Article 4 — Instructions documentees

Le Sous-traitant ne traite les donnees que sur instruction documentee
du Responsable de traitement, telle que formalisee par :
(a) la configuration de campagnes via l'interface de la Plateforme,
et (b) le present contrat. Le Sous-traitant informe le Responsable de
traitement si une instruction lui parait contraire au RGPD ou a un
autre texte applicable.

### Article 5 — Obligations du Sous-traitant

Le Sous-traitant s'engage a :

- traiter les donnees dans le respect strict des instructions du
  Responsable de traitement (Article 4) ;
- garantir la confidentialite des donnees, y compris en interne
  (acces restreint au personnel en ayant besoin, journalisation des
  acces) ;
- mettre en oeuvre les mesures de securite techniques et
  organisationnelles appropriees, incluant a minima : chiffrement des
  donnees au repos et en transit, isolation des donnees entre
  Responsables de traitement distincts (chaque tenant/client est
  cloisonne, y compris pour le registre de suppression qui ne
  s'applique jamais qu'aux propres campagnes du Responsable de
  traitement concerne), gestion des acces par role ;
- ne recourir a un sous-traitant ulterieur qu'avec autorisation
  prealable, ecrite, generale ou specifique, du Responsable de
  traitement, et repercuter sur ce sous-traitant ulterieur les memes
  obligations que celles du present contrat [LISTE DES SOUS-TRAITANTS
  ULTERIEURS A ANNEXER — hebergeur, fournisseur d'infrastructure
  d'envoi le cas echeant] ;
- assister le Responsable de traitement pour repondre aux demandes
  d'exercice des droits des personnes concernees (acces, effacement,
  opposition), notamment via l'export d'audit prevu par la
  Plateforme ;
- notifier le Responsable de traitement de toute violation de
  donnees dans un delai de [DELAI A FIXER, ex : 48h] apres en avoir
  eu connaissance, et l'assister dans ses propres obligations de
  notification a l'autorite de controle et, le cas echeant, aux
  personnes concernees ;
- mettre a disposition du Responsable de traitement toute
  documentation necessaire pour demontrer le respect du present
  contrat, et permettre des audits ou inspections raisonnables
  [MODALITES A FIXER — frequence, preavis, prise en charge des couts].

### Article 6 — Obligations du Responsable de traitement

Le Responsable de traitement s'engage a :

- garantir la licite de ses listes et de sa base legale de contact
  (Article 3) ;
- fournir des instructions licites et documentees ;
- traiter sans delai toute demande d'exercice de droits transmise par
  une personne concernee directement au Sous-traitant, celui-ci
  n'ayant pas vocation a repondre en son nom propre ;
- utiliser le registre de suppression et les outils de conformite mis
  a sa disposition par la Plateforme de bonne foi.

### Article 7 — Sort des donnees en fin de contrat

A l'issue du contrat commercial, le Sous-traitant, au choix du
Responsable de traitement formule par ecrit : restitue l'integralite
des donnees dans un format exploitable, ou les detruit, sous reserve
des obligations legales de conservation qui s'imposeraient
(notamment pour le registre de suppression, dont la conservation
post-resiliation peut etre necessaire pour continuer a proteger les
personnes ayant demande a ne plus etre contactees — [POINT A
CONFIRMER AVEC L'AVOCAT : la conservation du registre de suppression
au-dela de la resiliation sert l'interet des personnes concernees,
mais sa base legale et sa duree doivent etre explicitement
qualifiees]).

### Article 8 — Duree de conservation

[A FIXER — voir SPEC.md section 7, point 6 : duree de conservation
des evenements d'envoi, du registre de suppression, et des exports
d'audit, a arreter avant validation par l'avocat.]

### Article 9 — Responsabilite

Repartition de responsabilite conforme a l'article 82 du RGPD : le
Sous-traitant repond des dommages causes par un traitement qui ne
respecte pas ses obligations propres au titre du present contrat ou
qui meconnait les instructions licites du Responsable de traitement ;
le Responsable de traitement demeure seul responsable de la licite de
sa liste et de sa base legale de contact (Article 3). [CLAUSE DE
LIMITATION/PLAFOND DE RESPONSABILITE A REDIGER AVEC L'AVOCAT.]

### Article 10 — Signature electronique

Le present contrat est signe electroniquement lors de la creation du
compte client sur la Plateforme, avant tout acces aux fonctionnalites
d'envoi. Sa date de signature (`Client.dpa_signed_at`) est un
prerequis technique bloquant l'activation de toute campagne (cf.
SPEC.md section 4, etape 1). [VALIDITE JURIDIQUE DE LA SIGNATURE
ELECTRONIQUE RETENUE A CONFIRMER AVEC L'AVOCAT SELON LES JURIDICTIONS
CIBLEES.]

---

**Annexes a produire avant validation finale :**
- Annexe 1 : liste des sous-traitants ulterieurs (hebergeur, et
  fournisseur d'infrastructure d'envoi si un chemin d'envoi propre au
  produit est mis en place — cf. SPEC.md section 7).
- Annexe 2 : mesures de securite techniques et organisationnelles
  detaillees.
- Annexe 3 : lieu(x) d'hebergement et, le cas echeant, garanties de
  transfert hors UE (clauses contractuelles types ou equivalent).
