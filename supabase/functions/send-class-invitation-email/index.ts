import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface ClassInvitationEmailRequest {
    studentEmail: string;
    studentName: string;
    lecturerName: string;
    courseCode: string;
    className?: string;
    semester?: string;
    academicYear?: string;
}

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Verify request has authorization
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

        const {
            studentEmail,
            studentName,
            lecturerName,
            courseCode,
            className,
            semester,
            academicYear
        } = await req.json() as ClassInvitationEmailRequest;

        console.log(`Preparing to send class invitation email to: ${studentEmail} for ${courseCode}`);

        const smtpHost = Deno.env.get("SMTP_HOST");
        const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
        const smtpUser = Deno.env.get("SMTP_USER");
        const smtpPass = Deno.env.get("SMTP_PASS");
        const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";

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

        // Build class details
        const classDetails = [];
        if (className) classDetails.push(className);
        if (semester) classDetails.push(semester);
        if (academicYear) classDetails.push(academicYear);
        const classDetailsText = classDetails.length > 0 ? ` (${classDetails.join(' • ')})` : '';

        const mailOptions = {
            from: `"EduSpace - ${lecturerName}" <${smtpUser}>`,
            to: studentEmail,
            subject: `You've Been Invited to Join ${courseCode} on EduSpace`,
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
            .class-card { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .class-card h2 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 24px; }
            .class-info { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
            .info-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #475569; }
            .info-label { font-weight: 600; color: #1e40af; }
            .button { display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; margin-top: 20px; font-size: 16px; }
            .button:hover { background-color: #1d4ed8; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Class Invitation</h1>
            </div>
            <div class="content">
              <h2>Hello ${studentName},</h2>
              <p>Great news! <strong>${lecturerName}</strong> has invited you to join their class on <strong>EduSpace</strong>.</p>
              
              <div class="class-card">
                <h2>${courseCode}</h2>
                ${classDetailsText ? `<p style="margin: 0; color: #64748b;">${classDetailsText}</p>` : ''}
                <div class="class-info">
                  <div class="info-item">
                    <span class="info-label">Instructor:</span>
                    <span>${lecturerName}</span>
                  </div>
                  ${semester ? `
                  <div class="info-item">
                    <span class="info-label">Semester:</span>
                    <span>${semester}</span>
                  </div>
                  ` : ''}
                  ${academicYear ? `
                  <div class="info-item">
                    <span class="info-label">Academic Year:</span>
                    <span>${academicYear}</span>
                  </div>
                  ` : ''}
                </div>
              </div>

              <p>To accept this invitation and access your class materials, you'll need to:</p>
              <ol style="line-height: 1.8;">
                <li>Create your <span class="highlight">EduSpace account</span> (if you haven't already)</li>
                <li>Log in with this email address: <strong>${studentEmail}</strong></li>
                <li>Accept the pending class invitation from your dashboard</li>
              </ol>

              <p>Once enrolled, you'll have access to:</p>
              <ul style="line-height: 1.8;">
                <li>📚 <strong>Assignments</strong> and course materials</li>
                <li>📅 <strong>Class schedules</strong> and important dates</li>
                <li>💬 <strong>Direct messaging</strong> with your instructor</li>
                <li>🔔 <strong>Real-time notifications</strong> for updates</li>
                <li>📊 <strong>Grade tracking</strong> and progress reports</li>
              </ul>
              
              <center>
                <a href="${appUrl}/student/register" class="button" style="color: white;">Get Started</a>
              </center>

              <p style="margin-top: 30px; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <strong>Note:</strong> This invitation is specifically for <strong>${studentEmail}</strong>. 
                Make sure to use this email address when creating your account to automatically link to this class.
              </p>
              
              <p>If you have any questions, please contact ${lecturerName} directly.</p>
              
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
        console.log("Class invitation email sent successfully:", info.messageId);

        return new Response(
            JSON.stringify({ success: true, message: "Class invitation email sent successfully", messageId: info.messageId }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error sending class invitation email:", errorMessage);
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
