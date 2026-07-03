CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO users (name, email)
VALUES ('Ada Lovelace', 'ada@example.com')
ON CONFLICT (email) DO NOTHING;
