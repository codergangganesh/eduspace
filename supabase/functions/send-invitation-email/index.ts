// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
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
    // Verify request has authorization (anon key or user token)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized: Missing authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const { inviteeEmail, lecturerName, lecturerEmail, personalMessage } = await req.json() as InvitationEmailRequest;

    console.log(`Preparing to send invitation email to: ${inviteeEmail} from ${lecturerName}`);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const appUrl = Deno.env.get("APP_URL") || "https://eduspace-five.vercel.app";

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("Missing SMTP configuration environment variables");
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

    console.log("SMTP Transporter configured");

    const mailOptions = {
      from: `"EduSpace Support" <${smtpUser}>`,
      to: inviteeEmail,
      subject: `You're Invited to Join EduSpace by ${lecturerName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
            .feature-list { margin: 20px 0; padding-left: 20px; }
            .feature-list li { margin-bottom: 10px; }
            .personal-message { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; font-style: italic; }
            .button { display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            .sender-info { background-color: #eff6ff; padding: 12px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited to EduSpace!</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p><strong>${lecturerName}</strong> has invited you to join <strong>EduSpace</strong>, a comprehensive academic platform designed to streamline your educational journey.</p>
              
              <div class="sender-info">
                <strong>Invited by:</strong> ${lecturerName}<br>
                <strong>Email:</strong> ${lecturerEmail}
              </div>

              ${personalMessage ? `
              <div class="personal-message">
                <strong>Personal Message:</strong><br>
                "${personalMessage}"
              </div>
              ` : ''}

              <p>EduSpace provides powerful tools to help you succeed:</p>
              
              <ul class="feature-list">
                <li><strong>Class Management:</strong> Organize and access all your courses in one place.</li>
                <li><strong>Assignments:</strong> Keep track of tasks, deadlines, and submissions effortlessly.</li>
                <li><strong>Schedules:</strong> View your personalized timetable and never miss a class.</li>
                <li><strong>Real-time Messaging:</strong> Collaborate with peers and instructors instantly.</li>
                <li><strong>Notifications:</strong> Stay updated with important announcements and alerts.</li>
              </ul>

              <p>Ready to get started? Click the button below to create your account and join the EduSpace community!</p>
              
              <center>
                <a href="https://eduspace-five.vercel.app" class="button" style="color: white;">Get Started</a>
              </center>

              <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If you have any questions, feel free to reach out to ${lecturerName} at ${lecturerEmail} or contact our support team.</p>
              
              <p>Best regards,<br>The EduSpace Team</p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} EduSpace. All rights reserved.<br>
              <a href="#" style="color: #64748b; text-decoration: underline;">Privacy Policy</a> | <a href="#" style="color: #64748b; text-decoration: underline;">Terms of Service</a>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Invitation email sent successfully:", info.messageId);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation email sent successfully", messageId: info.messageId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error sending invitation email:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
