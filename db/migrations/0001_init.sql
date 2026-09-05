-- Schema V1 (Envoi + Verification + Conformite basique).
-- Cf. SPEC.md section 3 pour le modele de donnees et section 6 pour
-- le perimetre. NotificationTemplate (module Conformite, generateur
-- de texte multilingue) est V2 et n'a pas de table ici.

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  plan_id TEXT NOT NULL DEFAULT 'starter',
  dpa_signed_at TEXT,
  dpa_version TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mailboxes (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_workspace', 'microsoft_365', 'smtp_generique')),
  email TEXT NOT NULL,
  oauth_tokens_ref TEXT,
  smtp_config_ref TEXT,
  statut_connexion TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut_connexion IN ('en_attente', 'connecte', 'erreur')),
  quota_jour INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mailboxes_client ON mailboxes(client_id);

CREATE TABLE IF NOT EXISTS domaines (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nom_domaine TEXT NOT NULL,
  spf_statut TEXT NOT NULL DEFAULT 'inconnu' CHECK (spf_statut IN ('inconnu', 'valide', 'invalide')),
  dkim_statut TEXT NOT NULL DEFAULT 'inconnu' CHECK (dkim_statut IN ('inconnu', 'valide', 'invalide')),
  dmarc_statut TEXT NOT NULL DEFAULT 'inconnu' CHECK (dmarc_statut IN ('inconnu', 'valide', 'invalide')),
  dernier_check_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (client_id, nom_domaine)
);
CREATE INDEX IF NOT EXISTS idx_domaines_client ON domaines(client_id);

CREATE TABLE IF NOT EXISTS sequences (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'active', 'archivee')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sequences_client ON sequences(client_id);

CREATE TABLE IF NOT EXISTS sequence_etapes (
  id TEXT PRIMARY KEY,
  sequence_id TEXT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  ordre INTEGER NOT NULL,
  delai_jours INTEGER NOT NULL DEFAULT 0,
  sujet TEXT NOT NULL,
  corps TEXT NOT NULL,
  condition_branche TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (sequence_id, ordre)
);
CREATE INDEX IF NOT EXISTS idx_sequence_etapes_sequence ON sequence_etapes(sequence_id);

CREATE TABLE IF NOT EXISTS listes_importees (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  source_declaree TEXT,
  nb_contacts INTEGER NOT NULL DEFAULT 0,
  statut_verification TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut_verification IN ('en_attente', 'en_cours', 'terminee')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_listes_client ON listes_importees(client_id);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  liste_id TEXT NOT NULL REFERENCES listes_importees(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  donnees_additionnelles_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (liste_id, email)
);
CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_liste ON contacts(liste_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(client_id, email);

CREATE TABLE IF NOT EXISTS verification_resultats (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,
  resultat_smtp TEXT NOT NULL CHECK (resultat_smtp IN ('valide', 'invalide', 'catch_all', 'inconnu')),
  mx_valide INTEGER NOT NULL DEFAULT 0,
  age_domaine_jours INTEGER,
  pattern_domaine_suspect INTEGER NOT NULL DEFAULT 0,
  score_risque INTEGER NOT NULL,
  score_explication_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campagnes (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sequence_id TEXT NOT NULL REFERENCES sequences(id),
  liste_id TEXT NOT NULL REFERENCES listes_importees(id),
  mailbox_ids_json TEXT NOT NULL DEFAULT '[]',
  fuseau_horaire TEXT NOT NULL DEFAULT 'Europe/Paris',
  fenetre_envoi_debut TEXT NOT NULL DEFAULT '09:00',
  fenetre_envoi_fin TEXT NOT NULL DEFAULT '17:00',
  seuil_score_risque_min INTEGER,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'active', 'en_pause', 'terminee')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_campagnes_client ON campagnes(client_id);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  campagne_id TEXT NOT NULL REFERENCES campagnes(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  etape_courante INTEGER NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'envoye', 'repondu', 'stoppe_suppression', 'stoppe_reponse')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (campagne_id, contact_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_campagne ON enrollments(campagne_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_contact ON enrollments(contact_id);

CREATE TABLE IF NOT EXISTS envoi_evenements (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  mailbox_id TEXT NOT NULL REFERENCES mailboxes(id),
  horodatage TEXT NOT NULL DEFAULT (datetime('now')),
  statut_smtp TEXT NOT NULL,
  message_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_envoi_evenements_enrollment ON envoi_evenements(enrollment_id);

-- Module Conformite (V1 : registre de suppression + export d'audit).
CREATE TABLE IF NOT EXISTS suppression_entrees (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  origine TEXT NOT NULL CHECK (origine IN ('desinscription', 'plainte', 'bounce_dur', 'import_manuel')),
  campagne_origine_id TEXT REFERENCES campagnes(id),
  horodatage TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (client_id, email)
);
CREATE INDEX IF NOT EXISTS idx_suppression_client_email ON suppression_entrees(client_id, email);

CREATE TABLE IF NOT EXISTS audit_exports (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_email_hash TEXT NOT NULL,
  campagnes_json TEXT NOT NULL DEFAULT '[]',
  statut_opposition TEXT NOT NULL DEFAULT 'aucune' CHECK (statut_opposition IN ('aucune', 'opposee')),
  genere_at TEXT NOT NULL DEFAULT (datetime('now')),
  genere_par TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_exports_client ON audit_exports(client_id);
