import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import JSZip from "https://esm.sh/jszip@3.10.1"

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function sendBackupWithSendGrid({ to, subject, body, zipContent, filename }: {
  to: string,
  subject: string,
  body: string,
  zipContent: Uint8Array,
  filename: string,
}) {
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
  const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "your@email.com";
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
        {
          to: [{ email: to }],
          subject,
        },
      ],
      from: {
        email: SENDER_EMAIL,
        name: SENDER_NAME,
      },
      content: [
        { type: "text/plain", value: body },
      ],
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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error: ${error}`);
  }
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // Generate backup name and description
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const name = `Scheduled Backup - ${dateStr} ${timeStr}`
    const description = `Automatic backup from scheduled Edge Function`

    // Fetch all data (adjust table names as needed)
    const [assets, users, departments, issues, assetRequests, notifications, userPrefs] = await Promise.all([
      supabase.from('assets').select('*'),
      supabase.from('users').select('*'),
      supabase.from('departments').select('*'),
      supabase.from('issues').select('*'),
      supabase.from('asset_requests').select('*'),
      supabase.from('notifications').select('*'),
      supabase.from('user_notification_preferences').select('*')
    ])

    // Compose backup data
    const backupData = {
      timestamp: now.toISOString(),
      version: '1.0.0',
      name,
      description,
      tables: {
        assets: assets.data || [],
        users: users.data || [],
        departments: departments.data || [],
        issues: issues.data || [],
        asset_requests: assetRequests.data || [],
        notifications: notifications.data || [],
        user_notification_preferences: userPrefs.data || []
      },
      metadata: {
        totalAssets: assets.data?.length || 0,
        totalUsers: users.data?.length || 0,
        totalIssues: issues.data?.length || 0,
        backupSize: JSON.stringify(assets.data || []).length // crude size
      }
    }

    // Store backup in the backups table
    const { error } = await supabase.from('backups').insert({
      name,
      description,
      timestamp: now.toISOString(),
      version: '1.0.0',
      metadata: backupData.metadata,
      backup_data: backupData,
      created_by: 'system'
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    // --- ZIP the backup JSON ---
    const zip = new JSZip()
    zip.file(`${name}.json`, JSON.stringify(backupData, null, 2))
    const zipContent = await zip.generateAsync({ type: 'uint8array' })

    // --- Fetch admin and department_officer emails ---
    const { data: userRows, error: userError } = await supabase
      .from('users')
      .select('email,role')
      .in('role', ['admin', 'department_officer'])

    if (userError) {
      return new Response(JSON.stringify({ error: userError.message }), { status: 500 })
    }
    const recipientEmails = (userRows || []).map(u => u.email).filter(Boolean)

    // --- Send email with ZIP attachment via SendGrid ---
    const subject = `New System Backup Created - ${name}`
    const body = `A new backup has been created and is attached as a ZIP file.\n\nDescription: ${description}\n\nDate: ${now.toISOString()}`
    const filename = `${name}.zip`

    for (const email of recipientEmails) {
      await sendBackupWithSendGrid({
        to: email,
        subject,
        body,
        zipContent,
        filename,
      })
    }

    return new Response(JSON.stringify({ message: 'Backup created and emailed successfully' }), { status: 200 })
  } catch (error) {
    console.error('❌ Backup error:', error)
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
