import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "info@capitalmotorsandtours.com";
const SENDER_NAME = Deno.env.get("SENDER_NAME") || "Caava Group";
async function sendEmailWithSendGrid(emailData) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [
            {
              email: emailData.to
            }
          ],
          subject: emailData.subject
        }
      ],
      from: {
        email: SENDER_EMAIL,
        name: SENDER_NAME
      },
      content: [
        {
          type: "text/plain",
          value: emailData.textBody || ""
        },
        {
          type: "text/html",
          value: emailData.htmlBody
        }
      ]
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error: ${error}`);
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const emailData = await req.json();
    if (!emailData.to || !emailData.subject || !emailData.htmlBody) {
      throw new Error('Missing required email data');
    }
    await sendEmailWithSendGrid(emailData);
    return new Response(JSON.stringify({
      success: true,
      message: 'Email sent successfully',
      notificationId: emailData.notificationId,
      recipient: emailData.to
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
