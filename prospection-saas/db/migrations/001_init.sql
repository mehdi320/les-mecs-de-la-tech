-- MVP: Extraction + Vérification + Conformité.
-- Délivrabilité et Boucle sont en V2, pas de tables ici pour elles.

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  industry TEXT,
  size_range TEXT,
  country TEXT,
  linkedin_url TEXT
);

CREATE TABLE IF NOT EXISTS extraction_batches (
  id TEXT PRIMARY KEY,
  query_params TEXT NOT NULL, -- JSON
  provider TEXT NOT NULL CHECK (provider IN ('apollo_api', 'apify_actor', 'manual_upload')),
  provider_run_id TEXT,
  requested_by_user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  contact_count INTEGER NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  source_query_origin TEXT
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id),
  job_title TEXT,
  email_guessed TEXT,
  phone TEXT,
  source TEXT NOT NULL CHECK (source IN ('linkedin_public', 'apollo_api', 'apify_actor', 'company_website', 'directory')),
  source_url TEXT,
  extraction_batch_id TEXT NOT NULL REFERENCES extraction_batches(id),
  extracted_at TEXT NOT NULL,
  raw_payload TEXT NOT NULL -- JSON brut du fournisseur
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_batch ON contacts(extraction_batch_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email_guessed);

CREATE TABLE IF NOT EXISTS verification_results (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  email_checked TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  verdict_label TEXT NOT NULL CHECK (verdict_label IN ('valide', 'risque', 'catch_all_incertain', 'invalide')),
  signals TEXT NOT NULL, -- JSON
  primary_provider TEXT NOT NULL,
  secondary_provider TEXT,
  explanation_text TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  verification_cost REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_verification_contact ON verification_results(contact_id);

-- Conformité, adaptée au marché US (CAN-SPAM) : pas de "base légale RGPD" ici,
-- voir PASSATION.md pour le pivot de marché et ce que ça change par rapport au SPEC.md initial.

CREATE TABLE IF NOT EXISTS data_provenance_records (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  source_cited TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  retention_deadline TEXT NOT NULL,
  purge_status TEXT NOT NULL CHECK (purge_status IN ('active', 'scheduled', 'purged')),
  purged_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_provenance_contact ON data_provenance_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_provenance_deadline ON data_provenance_records(retention_deadline);

CREATE TABLE IF NOT EXISTS opt_out_records (
  id TEXT PRIMARY KEY,
  email_or_domain TEXT NOT NULL,
  contact_id TEXT REFERENCES contacts(id),
  opted_out_at TEXT NOT NULL,
  opt_out_source TEXT NOT NULL CHECK (opt_out_source IN ('unsubscribe_link', 'reply_detected', 'manual_entry', 'imported_list')),
  scope TEXT NOT NULL CHECK (scope IN ('contact_only', 'domain_wide'))
);

CREATE INDEX IF NOT EXISTS idx_optout_email ON opt_out_records(email_or_domain);

CREATE TABLE IF NOT EXISTS audit_log_entries (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  details TEXT NOT NULL, -- JSON
  exportable INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log_entries(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS retention_policies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  default_retention_days INTEGER NOT NULL,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('contacts_non_convertis', 'tous_les_contacts'))
);
