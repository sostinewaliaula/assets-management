## Supabase Edge Functions – Setup and Deployment (Windows)

This guide documents how to create, configure, deploy, and test Supabase Edge Functions for this project. It captures the exact steps we used for `admin_create_user`.

### Prerequisites
- Supabase project reference (example: `myvmqncragvxfmwztnml`)
- Access token: create at your Supabase Dashboard → Account → Tokens
- Windows PowerShell

### 1) Install Supabase CLI
```powershell
choco install supabase -y
# Or download from Supabase docs: https://supabase.com/docs/guides/cli
```

### 2) Login and link your project
```powershell
supabase login
# Paste access token when prompted

supabase link --project-ref myvmqncragvxfmwztnml
```

### 3) Create or verify function structure
Project root must contain: `supabase/functions/<function_name>/index.ts`
```powershell
# Scaffold a function (if not already present)
supabase functions new admin_create_user --no-verify-jwt

# Verify the entrypoint exists
dir supabase\functions\admin_create_user
# Expect: index.ts
```

### 4) Configure function secrets
- Do not use names starting with `SUPABASE_` when setting secrets via CLI (reserved).
- `SUPABASE_URL` is auto-injected by the platform.
- We set a single secret used by the function:
```powershell
supabase secrets set SERVICE_ROLE_KEY="<YOUR_SERVICE_ROLE_KEY>"
```

In your function code, read them as:
```ts
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");       // provided by platform
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
```

### 5) Deploy
```powershell
# If your local .env has invalid lines, either fix it or bypass it:
# Option A: Temporarily rename it
ren .env .env.bak
supabase functions deploy admin_create_user --no-verify-jwt
ren .env.bak .env

# Option B: Use an empty env file
New-Item -Path . -Name ".env.deploy" -ItemType "file" -Force | Out-Null
supabase functions deploy admin_create_user --no-verify-jwt --env-file .env.deploy
```

### 6) Invoke (smoke test)
```powershell
supabase functions invoke admin_create_user --no-verify-jwt --body '{
  "email":"new.user@example.com",
  "name":"New User",
  "role":"user",
  "department_id":null,
  "position":null,
  "phone":null,
  "password":"Password123!"
}'
```

### 7) Frontend integration
- The Admin → Users → Add New User form calls `admin_create_user` and passes the payload above.
- The Edge Function creates the auth user with a password and upserts their profile in `public.users`.

### Common errors and fixes
- Docker warning during deploy: safe to ignore for Edge Functions.
- Entrypoint path does not exist: ensure `supabase/functions/<name>/index.ts` exists and matches the deploy name.
- Env parse error ("unexpected character" in `.env`): ensure lines are `KEY=VALUE` only, or bypass using `--env-file`.
- Secrets rejected ("Env name cannot start with SUPABASE_"): use `SERVICE_ROLE_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`.

### Updating a function
```powershell
# Edit code in supabase\functions\admin_create_user\index.ts
supabase functions deploy admin_create_user --no-verify-jwt
```

### Notes
- If you prefer verifying JWTs, remove `--no-verify-jwt` and configure the appropriate headers/secrets for invocation.
- Ensure your service role has the necessary table permissions for any writes performed by the function.


