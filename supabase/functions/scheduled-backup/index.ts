import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import JSZip from "https://esm.sh/jszip@3.10.1"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

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

  // --- Send email with ZIP attachment ---
  const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
  const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
  const smtpUsername = Deno.env.get('SMTP_USERNAME')
  const smtpPassword = Deno.env.get('SMTP_PASSWORD')
  const senderEmail = Deno.env.get('SENDER_EMAIL')
  const senderName = Deno.env.get('SENDER_NAME') || 'Caava Group'

  if (!smtpUsername || !smtpPassword || !senderEmail) {
    return new Response(JSON.stringify({ error: 'Missing SMTP configuration' }), { status: 500 })
  }

  const client = new SmtpClient()
  await client.connectTLS({
    hostname: smtpHost,
    port: smtpPort,
    username: smtpUsername,
    password: smtpPassword,
  })

  const subject = `New System Backup Created - ${name}`
  const body = `A new backup has been created and is attached as a ZIP file.\n\nDescription: ${description}\n\nDate: ${now.toISOString()}`

  for (const email of recipientEmails) {
    await client.send({
      from: `${senderName} <${senderEmail}>`,
      to: email,
      subject,
      content: body,
      attachments: [
        {
          content: zipContent,
          filename: `${name}.zip`,
          contentType: 'application/zip',
        },
      ],
    })
  }

  await client.close()

  return new Response(JSON.stringify({ message: 'Backup created and emailed successfully' }), { status: 200 })
})
