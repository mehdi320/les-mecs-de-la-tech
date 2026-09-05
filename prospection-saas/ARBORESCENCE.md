# Arborescence de projet

Statut : reflète le code réel après implémentation du MVP (Extraction + Vérification + Conformité, marché US — Délivrabilité et Boucle restent à l'état de plan, V2).

Règle de cloisonnement : un module ne référence jamais directement le `domain/` ou l'`integration/` d'un autre module. La composition entre modules se fait explicitement dans `app/api/*` (un route handler peut importer plusieurs modules), jamais par un `eventBus` process-wide.

**Correction actée pendant l'implémentation** : la première version de ce document prévoyait un `kernel/events.ts` (EventEmitter) + un `instrumentation.ts` pour découpler les modules par événements. Testé en conditions réelles (`next build` + `next start`), ça ne fonctionne pas de façon fiable : Next.js ne garantit pas que `instrumentation.ts` et les route handlers partagent la même instance de module en mémoire — l'abonnement enregistré au démarrage ne recevait jamais les événements publiés depuis une route (vérifié : l'opt-out s'enregistrait, mais l'entrée de journal d'audit correspondante n'apparaissait jamais). `kernel/events.ts`, `instrumentation.ts` et `modules/conformite/integration/subscribers.ts` ont été supprimés. À la place, chaque route API qui doit déclencher une action dans un autre module le fait par un appel direct (ex. `app/api/extraction/batches/route.ts` appelle `recordProvenance` et `writeAuditLog` du module Conformité après une insertion) ou par un callback passé en paramètre (ex. `runExtraction({ onContactInserted })`). C'est toujours la route qui compose, jamais un module qui importe un autre module — seule la mécanique de liaison a changé.

```
prospection-saas/
├── SPEC.md
├── ARBORESCENCE.md
├── DECISIONS-BLOQUANTES.md
├── PASSATION.md
├── package.json / tsconfig.json / next.config.mjs / tailwind.config.ts / postcss.config.mjs
├── .env.example
│
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── (dashboard)/                      # app connectée, une route par module MVP
│   │   ├── layout.tsx                    # nav Extraction / Vérification / Conformité
│   │   ├── extraction/page.tsx
│   │   ├── verification/page.tsx
│   │   └── conformite/page.tsx
│   └── api/                              # c'est ICI que les modules se composent entre eux
│       ├── extraction/
│       │   ├── batches/route.ts          # POST lance une extraction + appelle Conformité (provenance, audit)
│       │   └── contacts/route.ts         # GET liste les contacts
│       ├── verification/
│       │   ├── run/route.ts              # POST vérifie un contact + appelle Conformité (audit)
│       │   └── results/route.ts          # GET liste les résultats
│       └── conformite/
│           ├── opt-out/route.ts          # GET/POST liste de suppression
│           ├── audit-log/route.ts        # GET journal d'audit
│           └── purge/route.ts            # POST déclenche la purge des contacts expirés
│
├── modules/
│   │
│   ├── extraction/
│   │   ├── domain/
│   │   │   ├── company.ts                # + normalizeDomain
│   │   │   ├── contact.ts
│   │   │   ├── extraction-batch.ts
│   │   │   └── dedupe.ts                 # isSameContact, deduplicateContacts
│   │   ├── integration/
│   │   │   ├── apollo-client.ts          # POST /mixed_people/api_search (voir décision 1)
│   │   │   ├── company-repository.ts
│   │   │   ├── contact-repository.ts
│   │   │   ├── extraction-batch-repository.ts
│   │   │   └── run-extraction.ts         # orchestrateur : Apollo -> dédup -> insert -> onContactInserted()
│   │   └── presentation/
│   │       ├── extraction-batch-form.tsx
│   │       └── extraction-batch-list.tsx
│   │
│   ├── verification/
│   │   ├── domain/
│   │   │   ├── verification-result.ts
│   │   │   ├── risk-scoring.ts           # computeRiskAssessment — le score nuancé, différenciateur n°1
│   │   │   ├── waterfall-policy.ts       # shouldTriggerSecondaryVerification
│   │   │   └── pattern-heuristics.ts     # estimatePatternMatchConfidence
│   │   ├── integration/
│   │   │   ├── millionverifier-client.ts # fournisseur primaire (voir décision 2)
│   │   │   ├── bouncer-client.ts         # fournisseur secondaire, waterfall
│   │   │   ├── verification-result-repository.ts
│   │   │   └── verify-contact.ts         # orchestrateur : primaire -> waterfall si besoin -> score -> insert
│   │   └── presentation/
│   │       ├── risk-score-badge.tsx
│   │       └── verification-explanation-panel.tsx
│   │
│   ├── deliverabilite/                   # V2 — non construit, structure indicative seulement
│   │   ├── domain/{sending-domain,sending-mailbox,deliverability-alert,warmup-policy}.ts
│   │   ├── integration/{dns-check-client,sending-domain-repository,alert-notifier}.ts
│   │   └── presentation/{domain-health-dashboard,alert-list}.tsx
│   │
│   ├── conformite/                       # adapté marché US : pas de "base légale RGPD", voir PASSATION.md
│   │   ├── domain/
│   │   │   ├── data-provenance-record.ts # remplace le LegalBasisRecord du SPEC.md initial (pensé RGPD)
│   │   │   ├── opt-out-record.ts
│   │   │   ├── audit-log-entry.ts
│   │   │   └── retention-policy.ts       # DEFAULT_RETENTION_DAYS = 180 (défaut opérationnel, pas légal)
│   │   ├── integration/
│   │   │   ├── data-provenance-repository.ts
│   │   │   ├── opt-out-repository.ts     # isOptedOut() — vérification bloquante avant tout envoi
│   │   │   ├── audit-log-repository.ts
│   │   │   └── purge-scheduler.ts        # purgeExpiredContacts() — ne purge jamais les opt-out
│   │   └── presentation/
│   │       ├── opt-out-registry-view.tsx
│   │       └── audit-log-export.tsx
│   │
│   └── boucle/                           # V2 — non construit, structure indicative seulement
│       ├── domain/{sending-campaign,engagement-event,source-performance-score,next-query-proposal}.ts
│       ├── integration/{instantly,smartlead,lemlist}-webhook-handler.ts, campaign-repository.ts, performance-aggregator.ts
│       └── presentation/{performance-by-source-chart,next-query-review}.tsx
│
├── kernel/
│   ├── ids.ts                            # types brandés (ContactId, CompanyId...) + fabriques newXId()
│   └── db.ts                             # connexion SQLite unique (node:sqlite) + exécution des migrations
│
└── db/
    └── migrations/001_init.sql           # tables des 3 modules MVP uniquement
```

## Notes de cohérence et écarts connus avec le SPEC.md initial

- Pattern domain/integration/presentation respecté dans les trois modules construits.
- FastAPI n'apparaît pas : tout reste dans le monolithe Next.js au MVP, `node:sqlite` (expérimental sur Node 22, avertissement sans impact fonctionnel) sert de couche SQLite plutôt qu'un package tiers, pour éviter une dépendance native à compiler.
- `Article14NoticeRecord` (SPEC.md section 1.4/5.4) n'a pas été codé : le pivot marché US décidé pour cette V1 met la question RGPD de côté (voir PASSATION.md). Si le produit s'ouvre un jour à l'Europe, c'est le premier ajout à faire au module Conformité, pas un détail.
- Les clients Apollo/MillionVerifier/Bouncer sont écrits à partir de la documentation publique consultée le 2026-09-05, pas testés contre de vraies clés API (aucune clé fournie à ce stade) — à revalider avant le premier appel réel.
