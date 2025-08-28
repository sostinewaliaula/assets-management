import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  notificationId: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const smtpUsername = Deno.env.get('SMTP_USERNAME')
    const smtpPassword = Deno.env.get('SMTP_PASSWORD')
    const senderEmail = Deno.env.get('SENDER_EMAIL')
    const senderName = Deno.env.get('SENDER_NAME') || 'Turnkey Africa'

    // Validate required environment variables
    if (!smtpUsername || !smtpPassword || !senderEmail) {
      throw new Error('Missing required SMTP configuration')
    }

    // Parse request body
    const emailData: EmailRequest = await req.json()
    
    // Validate request data
    if (!emailData.to || !emailData.subject || !emailData.htmlBody) {
      throw new Error('Missing required email data')
    }

    // Create SMTP client
    const client = new SmtpClient()

    // Configure SMTP connection
    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUsername,
      password: smtpPassword,
    })

    // Send email
    await client.send({
      from: `${senderName} <${senderEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      content: emailData.htmlBody,
      html: emailData.htmlBody,
      text: emailData.textBody,
    })

    // Close SMTP connection
    await client.close()

    // Log successful email
    console.log(`✅ Email sent successfully to ${emailData.to} for notification ${emailData.notificationId}`)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        notificationId: emailData.notificationId,
        recipient: emailData.to
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error sending email:', error)

    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
