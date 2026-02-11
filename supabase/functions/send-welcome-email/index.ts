// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  fullName: string;
  role: string;
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

    const { email, fullName, role } = await req.json() as WelcomeEmailRequest;

    console.log(`Preparing to send welcome email to: ${email} (${role})`);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("Missing SMTP configuration environment variables");
      throw new Error("Server configuration error: Missing SMTP credentials");
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log("SMTP Transporter configured");

    const mailOptions = {
      from: `"EduSpace Support" <${smtpUser}>`,
      to: email,
      subject: "Welcome to EduSpace! 🚀",
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
            .button { display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to EduSpace!</h1>
            </div>
            <div class="content">
              <h2>Hello ${fullName},</h2>
              <p>We are thrilled to have you join our academic community as a <strong>${role}</strong>!</p>
              
              <p>EduSpace is designed to streamline your educational journey. Here are some of the key features you can explore:</p>
              
              <ul class="feature-list">
                <li><strong>Class Management:</strong> Organize and access all your courses in one place.</li>
                <li><strong>Assignments:</strong> Keep track of tasks, deadlines, and submissions effortlessly.</li>
                <li><strong>Schedules:</strong> View your personalized timetable and never miss a class.</li>
                <li><strong>Real-time Messaging:</strong> Collaborate with peers and instructors instantly.</li>
                <li><strong>Notifications:</strong> Stay updated with important announcements and alerts.</li>
              </ul>

              <p>To get started, simply log in to your dashboard and complete your profile.</p>
              <center>
                <a href="https://eduspace-five.vercel.app${role === 'lecturer' ? '/lecturer-dashboard' : '/dashboard'}" class="button" style="color: white;">Get Started</a>
              </center>
              <p>If you have any questions, our support team is always here to help.</p>
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
    console.log("Email sent successfully:", info.messageId);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", messageId: info.messageId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error sending email:", errorMessage);
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
