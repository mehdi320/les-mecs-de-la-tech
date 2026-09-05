-- Personnalisation / generation de variantes A/B (SPEC.md section 9).
-- Architecture adaptee du generateur A/B d'outboundDM-max (skill
-- dm-prospecting), format email (objet + corps) au lieu du format DM.

CREATE TABLE IF NOT EXISTS sequence_etape_variantes (
  id TEXT PRIMARY KEY,
  sequence_etape_id TEXT NOT NULL REFERENCES sequence_etapes(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  sujet TEXT NOT NULL,
  corps TEXT NOT NULL,
  structure TEXT NOT NULL CHECK (structure IN ('question_ouverte', 'affirmation_directe', 'reference_activite')),
  longueur TEXT NOT NULL CHECK (longueur IN ('courte', 'developpee')),
  tone TEXT NOT NULL CHECK (tone IN ('neutre', 'formel', 'familier')),
  champs_personnalisation_requis_json TEXT NOT NULL DEFAULT '[]',
  statut TEXT NOT NULL DEFAULT 'en_test' CHECK (statut IN ('en_test', 'gagnante', 'perdante')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (sequence_etape_id, nom)
);
CREATE INDEX IF NOT EXISTS idx_variantes_etape ON sequence_etape_variantes(sequence_etape_id);

ALTER TABLE envoi_evenements ADD COLUMN variante_id TEXT REFERENCES sequence_etape_variantes(id);
CREATE INDEX IF NOT EXISTS idx_envoi_evenements_variante ON envoi_evenements(variante_id);
