-- Zero-knowledge account model. db/init runs only on a fresh Postgres volume,
-- so re-initialising locally requires `docker compose down -v` then `docker compose up`.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    auth_hash VARCHAR(255) NOT NULL,
    user_salt VARCHAR(255) NOT NULL,
    totp_secret VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
