// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EarlyWarningEmailRequest {
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  riskLevel?: string;
  riskScore?: number;
  interventionType?: string;
  department?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as EarlyWarningEmailRequest;
    const {
      recipientEmail,
      recipientName,
      title,
      message,
      riskLevel = "critical",
      riskScore,
      department = "Academic Affairs",
    } = payload;

    if (!recipientEmail || !title || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required email parameters" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`[EarlyWarningEmail] Delivering retention notice to ${recipientEmail} (${recipientName})`);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("[EarlyWarningEmail] Missing SMTP configuration in environment. Simulating successful queue.");
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: "Email queued (SMTP credentials not configured in local environment)",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
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

    const isUrgent = riskLevel === "critical" || riskLevel === "high";
    const headerColor = isUrgent ? "#dc2626" : "#2563eb";
    const portalUrl = "https://eduspaceacademy.online/student-login";

    const formattedMessage = message
      .split("\n")
      .map((paragraph) => `<p style="margin: 0 0 14px 0; line-height: 1.6;">${paragraph}</p>`)
      .join("");

    const mailOptions = {
      from: `"Eduspace Academic Affairs" <${smtpUser}>`,
      to: recipientEmail,
      subject: isUrgent ? `[ACTION REQUIRED] ${title}` : title,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 620px; margin: 24px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid ${headerColor}; }
            .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; background-color: ${
              isUrgent ? "#fee2e2" : "#dbeafe"
            }; color: ${isUrgent ? "#991b1b" : "#1e40af"}; margin-top: 12px; }
            .content { padding: 32px 28px; color: #1e293b; font-size: 14px; }
            .salutation { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
            .message-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid ${headerColor}; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button-wrapper { text-align: center; margin: 32px 0 16px; }
            .cta-button { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(37,99,235,0.2); }
            .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Eduspace Academic Affairs</h1>
              <div class="badge">Official Academic Notice · ${department}</div>
            </div>
            
            <div class="content">
              <div class="salutation">Dear ${recipientName},</div>
              
              <div class="message-box">
                ${formattedMessage}
              </div>

              <div class="button-wrapper">
                <a href="${portalUrl}" class="cta-button" target="_blank">Access Your Student Portal & Catch Up</a>
              </div>

              <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
                If you have questions or require extension accommodations, please reply to this email or connect with your course lecturer during office hours.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 4px;">This is an automated retention notice issued by the Eduspace Academic Early Warning System.</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} Eduspace Learning Management. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EarlyWarningEmail] Email delivered successfully. MessageId: ${info.messageId}`);

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("[EarlyWarningEmail] Error sending email:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to deliver email" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
