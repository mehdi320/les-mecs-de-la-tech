# Arborescence de projet — sans code applicatif

Statut : squelette de dossiers uniquement. Aucun fichier ci-dessous ne contient de logique, seulement la structure à respecter une fois le code démarré.

Règle de cloisonnement : un module ne référence jamais directement le `domain/` ou l'`integration/` d'un autre module. Toute communication inter-modules passe par `kernel/events.ts` (événements) ou par une interface de lecture explicite exposée en `presentation/` ou en `app/api/`. C'est ce qui permet de retirer ou remplacer un module (ex. Délivrabilité en V2) sans toucher aux autres.

```
prospection-saas/
├── SPEC.md
├── ARBORESCENCE.md
├── DECISIONS-BLOQUANTES.md
├── PASSATION.md
│
├── app/                                  # Next.js App Router — présentation globale et routage
│   ├── (marketing)/                      # landing produit si besoin, séparée de l'app connectée
│   ├── (dashboard)/                      # app authentifiée, une route par module
│   │   ├── extraction/
│   │   ├── verification/
│   │   ├── deliverabilite/
│   │   ├── conformite/
│   │   └── boucle/
│   └── api/                              # route handlers, un dossier par module
│       ├── extraction/
│       ├── verification/
│       ├── deliverabilite/
│       ├── conformite/
│       └── boucle/
│
├── modules/
│   │
│   ├── extraction/
│   │   ├── domain/                       # règles métier pures, pas d'I/O
│   │   │   ├── contact.ts
│   │   │   ├── company.ts
│   │   │   ├── extraction-batch.ts
│   │   │   └── extraction-rules.ts       # dédoublonnage, normalisation
│   │   ├── integration/                  # adapters externes et accès données
│   │   │   ├── apollo-client.ts
│   │   │   ├── apify-client.ts
│   │   │   ├── contact-repository.sqlite.ts
│   │   │   └── company-repository.sqlite.ts
│   │   └── presentation/
│   │       ├── extraction-batch-form.tsx
│   │       └── extraction-batch-list.tsx
│   │
│   ├── verification/
│   │   ├── domain/
│   │   │   ├── verification-result.ts
│   │   │   ├── risk-scoring.ts           # calcul du score, jamais un verdict binaire seul
│   │   │   └── waterfall-policy.ts       # règle de déclenchement du second fournisseur
│   │   ├── integration/
│   │   │   ├── verification-provider-primary-client.ts
│   │   │   ├── verification-provider-secondary-client.ts
│   │   │   └── verification-result-repository.sqlite.ts
│   │   └── presentation/
│   │       ├── risk-score-badge.tsx
│   │       └── verification-explanation-panel.tsx
│   │
│   ├── deliverabilite/
│   │   ├── domain/
│   │   │   ├── sending-domain.ts
│   │   │   ├── sending-mailbox.ts
│   │   │   ├── deliverability-alert.ts
│   │   │   └── warmup-policy.ts
│   │   ├── integration/
│   │   │   ├── dns-check-client.ts       # lecture SPF/DKIM/DMARC
│   │   │   ├── sending-domain-repository.sqlite.ts
│   │   │   └── alert-notifier.ts
│   │   └── presentation/
│   │       ├── domain-health-dashboard.tsx
│   │       └── alert-list.tsx
│   │
│   ├── conformite/
│   │   ├── domain/
│   │   │   ├── legal-basis-record.ts
│   │   │   ├── article14-notice.ts       # entité candidate, cf. SPEC.md section 5.4
│   │   │   ├── opt-out-record.ts
│   │   │   ├── audit-log-entry.ts
│   │   │   └── retention-policy.ts
│   │   ├── integration/
│   │   │   ├── legal-basis-repository.sqlite.ts
│   │   │   ├── opt-out-repository.sqlite.ts
│   │   │   ├── audit-log-repository.sqlite.ts
│   │   │   └── purge-scheduler.ts
│   │   └── presentation/
│   │       ├── audit-log-export.tsx
│   │       └── opt-out-registry-view.tsx
│   │
│   └── boucle/
│       ├── domain/
│       │   ├── sending-campaign.ts
│       │   ├── engagement-event.ts
│       │   ├── source-performance-score.ts
│       │   └── next-query-proposal.ts
│       ├── integration/
│       │   ├── instantly-webhook-handler.ts
│       │   ├── smartlead-webhook-handler.ts
│       │   ├── lemlist-webhook-handler.ts
│       │   ├── campaign-repository.sqlite.ts
│       │   └── performance-aggregator.ts
│       └── presentation/
│           ├── performance-by-source-chart.tsx
│           └── next-query-review.tsx
│
├── kernel/                               # le seul point de couplage autorisé entre modules
│   ├── ids.ts                            # ContactId, CompanyId, CampaignId... types partagés
│   ├── events.ts                         # ex: "contact.purged", "contact.opted_out", "verification.completed"
│   └── db.ts                             # connexion SQLite unique, point d'entrée des migrations
│
└── db/
    └── migrations/                       # une migration par entité ajoutée, jamais de modification destructive en place
```

## Notes de cohérence avec les projets existants

- Pattern domain/integration/presentation répété identiquement dans les cinq modules : un nouveau contributeur qui comprend un module comprend la structure des quatre autres.
- FastAPI n'apparaît pas dans cette arborescence : au MVP, tout reste dans le monolithe Next.js. Si le module Vérification demande un traitement asynchrone lourd (gros batch, files d'attente), il recevra son propre dossier `services/verification-worker/` à la racine, hors de `modules/`, pour ne pas mélanger un service Python dans l'arborescence TypeScript. Ne pas créer ce dossier avant que le besoin soit réel.
- SQLite au MVP : chaque module a son propre repository (`*.sqlite.ts`), mais tous pointent vers la même base fichier via `kernel/db.ts`. La migration vers Postgres (si volume ou multi-tenant l'exige) se fera en remplaçant les repositories un par un, jamais en réécrivant le domaine.
