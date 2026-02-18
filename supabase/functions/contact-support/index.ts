// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json() as SupportRequest;

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    // Standardize support email destination
    const supportEmail = "eduspacelearning8@gmail.com";

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error("Server configuration error: Missing SMTP credentials");
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log(`Sending support request from ${email} to ${supportEmail}`);

    const mailOptions = {
      from: `"Eduspace Academy Support" <${smtpUser}>`, // MUST be the authenticated user
      to: supportEmail,
      replyTo: email, // Allow replying directly to the user
      subject: `New Support Request: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; background-color: #f4f4f5; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h2 { color: #1e3a8a; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #64748b; font-size: 0.9em; }
            .value { color: #334155; margin-top: 5px; }
            .message-box { background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>New Support Request</h2>
            
            <div class="field">
              <div class="label">From</div>
              <div class="value">${name} (${email})</div>
            </div>

            <div class="field">
              <div class="label">Subject</div>
              <div class="value">${subject}</div>
            </div>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

            <div class="field">
              <div class="label">Message</div>
              <div class="message-box">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center;">
              This email was sent via the Eduspace Academy Contact Form.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Support email sent:", info.messageId);

    return new Response(
      JSON.stringify({ success: true, message: "Support request sent successfully", messageId: info.messageId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error sending support email:", errorMessage);

    // Return 200 with error property for easier client-side debugging
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
};

serve(handler);
