# Automated Backup Email System with SendGrid for Supabase Edge Functions

This guide explains how to set up automated database backups in Supabase, send them as ZIP attachments to admins/IT via email using SendGrid, and trigger the process with GitHub Actions.

---

## 1. Why Use SendGrid?

Supabase Edge Functions (Deno Deploy) **do not support SMTP**. SendGrid's HTTP API is fully supported, reliable, and makes sending attachments easy.

---

## 2. Prerequisites

- A [SendGrid](https://sendgrid.com/) account
- A verified sender email or domain in SendGrid
- A Supabase project with Edge Functions enabled
- GitHub repository connected to your Supabase project

---

## 3. SendGrid Setup

1. **Sign up** at [sendgrid.com](https://sendgrid.com/).
2. **Verify your sender identity**:
   - Go to [Sender Authentication](https://app.sendgrid.com/settings/sender_auth).
   - Add and verify your sender email or domain.
3. **Create an API Key**:
   - Go to [API Keys](https://app.sendgrid.com/settings/api_keys).
   - Click "Create API Key", give it a name, and select "Full Access" or at least "Mail Send" permissions.
   - Copy the API key (you'll need it for Supabase).

---

## 4. Supabase Environment Variables

In your Supabase dashboard:
- Go to **Project Settings → Environment Variables**.
- Add the following:

```
SENDGRID_API_KEY=your_actual_sendgrid_api_key
SENDER_EMAIL=your_verified_sender@email.com
SENDER_NAME=Your Company Name   # (optional)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> **Note:** `SENDER_EMAIL` must match a verified sender in SendGrid.

---

## 5. Edge Function: `scheduled-backup`

- The function fetches data from your Supabase tables, zips it, and emails it as an attachment to all admins and department officers.
- Uses SendGrid's API for email delivery.

**Key code snippet:**

```ts
async function sendBackupWithSendGrid({ to, subject, body, zipContent, filename }) {
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
  const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");
  const SENDER_NAME = Deno.env.get("SENDER_NAME") || "Caava Group";
  const base64Zip = uint8ArrayToBase64(zipContent);

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        { to: [{ email: to }], subject },
      ],
      from: { email: SENDER_EMAIL, name: SENDER_NAME },
      content: [ { type: "text/plain", value: body } ],
      attachments: [
        {
          content: base64Zip,
          filename,
          type: "application/zip",
          disposition: "attachment",
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(await response.text());
}
```

---

## 6. GitHub Actions Workflow Example

This workflow triggers the backup Edge Function on a schedule and notifies on success/failure:

```yaml
name: Automatic Backup

on:
  schedule:
    # Runs every day at 2:00 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allows manual trigger from GitHub UI

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Supabase Edge Function
        run: |
          echo "🔄 Starting automatic backup..."
          response=$(curl -s -w "\n%{http_code}" -X POST "https://<your-project>.supabase.co/functions/v1/scheduled-backup" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json")
          http_code=$(echo "$response" | tail -n1)
          response_body=$(echo "$response" | head -n -1)
          echo "📊 Response Status: $http_code"
          echo "📄 Response Body: $response_body"
          if [ "$http_code" -eq 200 ]; then
            echo "✅ Backup completed successfully!"
          else
            echo "❌ Backup failed with status code: $http_code"
            echo "Error details: $response_body"
            exit 1
          fi
        env:
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - name: Notify on Success
        if: success()
        run: |
          echo "🎉 Automatic backup completed successfully!"
          echo "📧 Backup emails should have been sent to admins and IT officers."
      - name: Notify on Failure
        if: failure()
        run: |
          echo "💥 Automatic backup failed!"
          echo "Please check the logs above for error details."
```

---

## 7. Troubleshooting

- **"The from address does not match a verified Sender Identity"**
  - Make sure `SENDER_EMAIL` matches a verified sender in SendGrid.
- **No email received?**
  - Check Supabase Edge Function logs for errors.
  - Check your spam folder.
- **Attachment not opening?**
  - Ensure the ZIP is encoded as base64 and sent with `type: "application/zip"`.
- **500 Internal Server Error?**
  - Check logs for missing env vars or SendGrid errors.

---

## 8. References
- [SendGrid Sender Identity Docs](https://sendgrid.com/docs/for-developers/sending-email/sender-identity/)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference/mail-send/mail-send)

---

## 9. Support
If you need help, check your Supabase Edge Function logs, review this guide, or ask your team for assistance.
