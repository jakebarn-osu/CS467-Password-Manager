-- Adds the MFA enabled flag. db/init only runs on a fresh Postgres volume,
-- so re-initialising locally requires `docker compose down -v` then `docker compose up`.
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;
