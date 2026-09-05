-- Suivi d'ouverture (pixel de tracking) et statut visuel d'envoi.
-- Cf. SPEC.md section 9.7 (statut visuel) et 9.8 (diagnostic).

ALTER TABLE envoi_evenements ADD COLUMN ouvert_at TEXT;
