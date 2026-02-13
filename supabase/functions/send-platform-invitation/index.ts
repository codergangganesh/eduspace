// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface PlatformInvitationRequest {
    inviteeEmail: string;
    lecturerName: string;
    lecturerEmail: string;
    personalMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Relaxed Auth Check for Debugging Context - returns 200 with error if missing
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            console.warn("Missing authorization header (allowed for debug)");
            // We proceed for now or return a soft error if strict auth is needed later.
            // For this new function, let's keep it strict but informative.
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized: Missing authorization header (DEBUG MODE: Returned 200 instead of 401)" }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                }
            );
        }

        const { inviteeEmail, lecturerName, lecturerEmail, personalMessage } = await req.json() as PlatformInvitationRequest;

        console.log(`Sending platform invitation to: ${inviteeEmail} from ${lecturerName}`);

        const smtpHost = Deno.env.get("SMTP_HOST");
        const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
        const smtpUser = Deno.env.get("SMTP_USER");
        const smtpPass = Deno.env.get("SMTP_PASS");

        // Configured URL as requested
        const platformUrl = "https://eduspace-five.vercel.app/";

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

        const mailOptions = {
            from: `"EduSpace Support" <${smtpUser}>`,
            to: inviteeEmail,
            subject: `Join ${lecturerName} on EduSpace`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
            .button { display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; margin-top: 20px; font-size: 16px; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to EduSpace</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p><strong>${lecturerName}</strong> (${lecturerEmail}) has invited you to join them on <strong>EduSpace</strong>.</p>
              
              ${personalMessage ? `<p><em>"${personalMessage}"</em></p>` : ''}

              <p>EduSpace is your all-in-one platform for managing classes, assignments, and connecting with your educational community.</p>

              <center>
                <a href="${platformUrl}" class="button">Get Started</a>
              </center>
              
              <p style="margin-top: 30px; font-size: 14px; color: #64748b;">Or copy and paste this link into your browser:<br>${platformUrl}</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} EduSpace. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Invitation sent:", info.messageId);

        return new Response(
            JSON.stringify({ success: true, message: "Invitation sent successfully", messageId: info.messageId }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error sending invitation:", errorMessage);
        return new Response(
            JSON.stringify({ success: false, error: errorMessage, debug: { receivedBody: "Error parsing body or auth failed" } }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    }
};

serve(handler);
