# Self-hosting Supabase for Assets Management

This guide walks you through deploying Supabase on your VM at 192.0.1.129, migrating your schema/data, wiring the frontend to it, and enabling audit trails. It assumes Ubuntu 22.04+ (or any Linux with systemd).

## 0) Prerequisites
- Root or sudo access to 192.0.1.129
- Docker and Docker Compose (via Docker Engine)
- Supabase CLI
- Git and Node.js (for the frontend)

## 1) Install Docker and Supabase CLI
```bash
# Update apt
sudo apt-get update -y

# Install Docker Engine
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
# Re-login for group to take effect (or run `newgrp docker`)

# Install Supabase CLI (Linux x64)
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm i -g supabase

# Verify
docker --version
supabase --version
```

## 2) Initialize and start Supabase locally
On your VM (in a dedicated directory, e.g., /opt/supabase-local):
```bash
sudo mkdir -p /opt/supabase-local
sudo chown $USER:$USER /opt/supabase-local
cd /opt/supabase-local

# Initialize supabase project scaffolding (creates supabase/config, docker, etc.)
supabase init

# Start all services (Postgres, GoTrue, Realtime, PostgREST, Storage, etc.)
supabase start
```
When it finishes, note the printed endpoints and keys, e.g.:
- API: http://localhost:54321
- Studio: http://localhost:54323
- anon key, service_role key (printed by CLI)

From a remote machine, you will access via the VM IP: `http://192.0.1.129:54321` and `:54323` (ensure firewall allows it).

### Optional: open required ports
```bash
# Example with ufw
sudo ufw allow 54321/tcp   # Supabase API
sudo ufw allow 54323/tcp   # Studio
```

## 3) Apply database schema and migrations
From your app repo on the VM (e.g., /opt/assets-management), run the SQL files to create tables, functions, and policies.

Recommended order:
1. Base schema (tables and relationships). If you have a consolidated schema, apply it first. Example files in this repo:
   - `supabase-schema.sql` (base tables)
   - `supabase-tables-only.sql` (subset if you prefer smaller chunks)
2. Feature-specific schema:
   - `supabase_asset_requests.sql`
   - Any domain-specific SQL you have
3. Audit logs schema and policies:
   - `database_migrations/create_audit_logs_table.sql`

Apply via Supabase Studio (SQL editor) or psql from the VM:
```bash
# Using psql container through supabase CLI
supabase db connect
# This prints a psql connection string. Example usage:
# psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
# Then \i each file:
# \i /absolute/path/to/supabase-schema.sql
# \i /absolute/path/to/supabase_asset_requests.sql
# \i /absolute/path/to/database_migrations/create_audit_logs_table.sql
```

Ensure the audit table policies allow inserts for both anon and authenticated (already in the migration). This is required so login failures (no session) and authenticated events can write audit logs.

## 4) (Optional) Import existing data from cloud to local
If you have an existing Supabase Cloud project and want to migrate data:

- Obtain a dump from cloud (via Backups or psql/pg_dump if you have a connection string):
```bash
# Example (adjust host, db, user, and sslmode)
pg_dump "postgresql://USER:PASSWORD@CLOUD_HOST:6543/postgres?sslmode=require" \
  --format=custom --no-owner --no-acl --file=cloud_backup.dump
```

- Restore into your local Postgres:
```bash
# Get local psql connection from: supabase db connect
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  cloud_backup.dump
```

- If schemas conflict, apply schema first then restore data only (use `--schema` / `--table` filters as needed).

## 5) Configure Auth (email/password flows)
- In Supabase Studio → Authentication → Settings, set:
  - Site URL: `http://192.0.1.129:5000` (example frontend URL)
  - Redirects: include `http://192.0.1.129:5000/reset-password`
- SMTP: configure your SMTP provider for password reset emails, or disable email confirmations for testing.

## 6) Point the frontend to your local Supabase
In the frontend `.env` (Vite):
```
VITE_SUPABASE_URL=http://192.0.1.129:54321
VITE_SUPABASE_ANON_KEY=PASTE_LOCAL_ANON_KEY
```
Restart the frontend app. If you use a reverse proxy (Nginx/Caddy), map a domain to 192.0.1.129 and update the URL accordingly (e.g., `https://api.yourdomain.com`).

## 7) Verify audit logs
- Sign in/out, try a failed login (wrong password), perform CRUD actions.
- Visit Admin → Audit Logs; use Refresh and export.
- If empty, re-check `audit_logs` policies (read and insert), and ensure the frontend is pointing to the local API.

## 8) Run on boot (systemd)
Create a systemd service to auto-start Supabase:
```bash
sudo tee /etc/systemd/system/supabase-local.service > /dev/null <<'UNIT'
[Unit]
Description=Supabase Local via supabase CLI
After=docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/opt/supabase-local
ExecStart=/usr/bin/supabase start
ExecStop=/usr/bin/supabase stop
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now supabase-local
```

## 9) Security hardening (recommended)
- Put Supabase behind a reverse proxy (Nginx/Caddy) with HTTPS.
- Restrict exposed ports to only those needed; keep Postgres port internal.
- Rotate JWT secret (Auth settings) and database passwords.
- Backup strategy: daily `pg_dump` to secure storage.

## 10) Troubleshooting
- CORS: Add your frontend origin in Auth settings.
- RLS: If inserts fail silently, check Row Level Security policies.
- Keys: Ensure the frontend uses the local anon key printed by `supabase start`.
- Time sync: For MFA (TOTP), device time must be accurate (NTP).

## 11) Quick commands reference
```bash
# Start/Stop
supabase start
supabase stop

# Show status
supabase status

# Connect to DB
supabase db connect    # prints psql connection string

# Apply SQL via psql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f /path/to/file.sql

# Backup local DB
pg_dump "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  --format=custom --file=local_backup.dump

# Restore
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  local_backup.dump
```

## 12) What’s included in this repo
- `database_migrations/create_audit_logs_table.sql`: Creates `audit_logs` with RLS read/insert policies for anon/authenticated and helpful indexes.
- Other SQL files: base tables and feature-specific schema.
- Frontend code already integrated with local Supabase via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

If you want, I can also generate a single consolidated SQL that merges all the current schema into one file for easier one-shot application.
