# API Testing Guide (User and Vault Endpoints)

How to run and manually test the backend for the password manager. Covers the account/session endpoints and the encrypted vault endpoints. Everything runs locally with Docker. You do not need the frontend for any of this.

## What this covers

- User and session endpoints under `/api/v1/auth` (register, salt, login, session, logout)
- Encrypted vault endpoints under `/api/v1/vault` (create, list, get by id)

The design is zero-knowledge. The server only ever stores an argon2 hash of a client-derived key plus opaque encrypted blobs. It never sees a master password or any plaintext vault contents.

## Prerequisites

- Docker Desktop with Docker Compose. That is the only requirement.
- No local Node, database, or frontend needed. Everything runs in containers, and only the `db` and `api` services are required here.

## 1. Run the API and database

From the repo root, start only the database and API on a fresh volume so the schema migrations run:

```bash
docker compose down -v
docker compose up --build -d db api
```

Wait a few seconds, then confirm the API is up:

```bash
curl http://localhost:5001/api/health
# {"status":"ok"}
```

Endpoints and connection details:

- API at `http://localhost:5001`
- Postgres at `localhost:5433` (user `app`, password `app`, database `app`)

If registration ever returns a 500 or a column error, you are on an old schema. Re-run the two commands above. `docker compose down -v` wipes the volume so the migrations re-apply on the next start.

## 2. What to send when testing

In the real product a client derives `authKey` from the user master password and salt, and produces `encryptedData` by encrypting the vault fields with AES-256-GCM. That client code is separate and is not needed to test the API. For manual testing:

- `authKey` is any string that stands in for a password. It must match between register and login for the same account.
- `salt` is any string. The server stores it and hands it back.
- `encryptedData` is any string. The server stores and returns it verbatim and never inspects it. For a realistic value you can send a base64 blob. Just remember the server is not encrypting it, it only stores what you send.

## 3. User and session endpoints

Base URL `http://localhost:5001/api/v1/auth`.

| Method | Path | Body or query | Success | Notes |
|--------|------|---------------|---------|-------|
| POST | `/register` | `{ email, authKey, salt }` | 201 `{ id, email }` | 409 if the email exists, 400 if a field is missing or invalid |
| GET | `/salt` | `?email=...` | 200 `{ salt }` | Unknown emails get a stable decoy salt so accounts cannot be enumerated |
| POST | `/login` | `{ email, authKey }` | 200 `{ token, tokenType, expiresIn }` | 401 with the same message for a wrong key or an unknown email |
| GET | `/me` | `Authorization` header | 200 `{ id, email, mfaEnabled }` | 401 without a valid token |
| POST | `/logout` | `Authorization` header | 204 | The token is blocked afterward and stops working |

Protected routes expect the token as a header `Authorization: Bearer <token>`.

### Walkthrough

```bash
AUTH=http://localhost:5001/api/v1/auth
EMAIL=me@example.com
AUTHKEY=my-test-key
SALT=my-test-salt

# register a new account, expect 201
curl -i -X POST $AUTH/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"authKey\":\"$AUTHKEY\",\"salt\":\"$SALT\"}"

# register again with the same email, expect 409
curl -i -X POST $AUTH/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"authKey\":\"$AUTHKEY\",\"salt\":\"$SALT\"}"

# missing a field, expect 400
curl -i -X POST $AUTH/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"authKey\":\"$AUTHKEY\"}"

# salt for a known email, expect the stored salt
curl -i "$AUTH/salt?email=$EMAIL"

# salt for an unknown email, expect a different decoy salt, stable across calls
curl -i "$AUTH/salt?email=nobody@example.com"

# login with the wrong key, expect 401 Invalid credentials
curl -i -X POST $AUTH/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"authKey\":\"wrong-key\"}"

# login correctly, expect 200 with a token
curl -i -X POST $AUTH/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"authKey\":\"$AUTHKEY\"}"
```

Grab a token for the protected routes. With `jq` installed:

```bash
TOKEN=$(curl -s -X POST $AUTH/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"authKey\":\"$AUTHKEY\"}" | jq -r .token)

curl -i $AUTH/me -H "Authorization: Bearer $TOKEN"     # identity, expect 200
curl -i $AUTH/me                                       # no token, expect 401
curl -i -X POST $AUTH/logout -H "Authorization: Bearer $TOKEN"  # expect 204
curl -i $AUTH/me -H "Authorization: Bearer $TOKEN"     # reused after logout, expect 401
```

No `jq`? Copy the `token` value out of the login response by hand and paste it where `$TOKEN` goes.

## 4. Vault endpoints

Base URL `http://localhost:5001/api/v1/vault`. Every route requires `Authorization: Bearer <token>`.

| Method | Path | Body | Success | Notes |
|--------|------|------|---------|-------|
| POST | `/items` | `{ encryptedData }` | 201 `{ id, encryptedData, createdAt, updatedAt }` | `encryptedData` is 1 to 8192 chars, stored verbatim. 400 if missing |
| GET | `/items` | none | 200 `{ items: [...] }` | Only the caller's own items |
| GET | `/items/:id` | none | 200 `{ item }` | 404 if the id is missing or owned by another user, 400 if the id is not a UUID |

### Walkthrough (single user)

Reusing `$TOKEN` from a fresh login above:

```bash
V=http://localhost:5001/api/v1/vault

# create an item, expect 201 with encryptedData echoed back unchanged
curl -i -X POST $V/items -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"encryptedData":"BLOB-1234"}'

# copy the returned id, then
ITEM=<paste-the-id-here>

curl -i $V/items -H "Authorization: Bearer $TOKEN"           # list, expect 200 with the item
curl -i $V/items/$ITEM -H "Authorization: Bearer $TOKEN"     # get by id, expect 200
curl -i $V/items                                            # no token, expect 401
curl -i $V/items/not-a-uuid -H "Authorization: Bearer $TOKEN"  # malformed id, expect 400
```

### Walkthrough (two users, the important isolation check)

This proves one user can never read another user's items, which is the core security property of the vault.

```bash
AUTH=http://localhost:5001/api/v1/auth
V=http://localhost:5001/api/v1/vault

# user A
curl -s -X POST $AUTH/register -H 'Content-Type: application/json' \
  -d '{"email":"a@example.com","authKey":"ka","salt":"sa"}' >/dev/null
TA=$(curl -s -X POST $AUTH/login -H 'Content-Type: application/json' \
  -d '{"email":"a@example.com","authKey":"ka"}' | jq -r .token)

# user B
curl -s -X POST $AUTH/register -H 'Content-Type: application/json' \
  -d '{"email":"b@example.com","authKey":"kb","salt":"sb"}' >/dev/null
TB=$(curl -s -X POST $AUTH/login -H 'Content-Type: application/json' \
  -d '{"email":"b@example.com","authKey":"kb"}' | jq -r .token)

# A creates an item and we capture its id
ITEM=$(curl -s -X POST $V/items -H "Authorization: Bearer $TA" \
  -H 'Content-Type: application/json' -d '{"encryptedData":"A-SECRET"}' | jq -r .id)

curl -i $V/items/$ITEM -H "Authorization: Bearer $TA"   # A reads own item, expect 200
curl -i $V/items/$ITEM -H "Authorization: Bearer $TB"   # B reads A's id, expect 404 not 403
curl -i $V/items -H "Authorization: Bearer $TB"         # B lists, expect {"items":[]}
```

The cross-user get returns 404 rather than 403 on purpose, so B cannot even tell that A's item exists.

## 5. Inspect the database

```bash
docker compose exec db psql -U app -d app
```

Useful queries once inside:

```sql
\dt                          -- list tables (users, vault_items)
SELECT email, left(auth_hash, 20) AS hash, user_salt, totp_secret FROM users;
SELECT substring(id::text,1,8) AS id, substring(user_id::text,1,8) AS owner, encrypted_data FROM vault_items;
\q
```

`auth_hash` should start with `$argon2id$` and never be a plaintext key. `encrypted_data` should be exactly the blob you sent. `totp_secret` stays empty until MFA is added later.

A GUI such as TablePlus, DBeaver, or pgAdmin also works. Connect to host `localhost`, port `5433`, database `app`, user `app`, password `app`.

## 6. Expected results at a glance

| Step | Expected |
|------|----------|
| register new | 201 `{ id, email }` |
| register duplicate | 409 |
| register missing field | 400 |
| salt known email | 200 with the stored salt |
| salt unknown email | 200 with a stable decoy salt |
| login wrong key or unknown email | 401, same generic message |
| login correct | 200 with a token and `expiresIn` 900 |
| me with token | 200 `{ id, email, mfaEnabled }` |
| me without token | 401 |
| logout | 204, then the same token fails on `/me` |
| vault create | 201, `encryptedData` echoed unchanged |
| vault list | 200, only the caller's items |
| vault get own item | 200 |
| vault get another user's item | 404 |
| vault get non-existent UUID | 404 |
| vault get malformed id | 400 |
| any vault call without a token | 401 |

## 7. Stop and clean up

```bash
docker compose down        # stop, keep the data volume
docker compose down -v     # stop and wipe the database
```

## Troubleshooting

- Registration returns a 500 or a column error. You are on an old schema. Run `docker compose down -v` then `docker compose up --build -d db api`.
- Connection refused on 5001. The API is still starting or not running. Check `docker compose ps` and the api logs, then retry the health check.
- Login returns 401 with the right email. The `authKey` must match the one used at register exactly.
- Token rejected right after login. The header must be `Authorization: Bearer <token>` with a space after `Bearer`.
- A token stopped working. Tokens expire after 15 minutes, and logout blocks a token immediately. Log in again for a fresh one.
