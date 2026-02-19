// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
// @ts-ignore
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
    classId: string;
    type: 'assignment' | 'quiz' | 'schedule' | 'update';
    title: string;
    body: string;
    link: string;
    lecturerName: string;
}

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response('ok', { status: 200, headers: corsHeaders });
    }

    try {
        const DenoEnv = (globalThis as any).Deno?.env;
        if (!DenoEnv) {
            throw new Error("Deno environment not available");
        }

        const supabaseUrl = DenoEnv.get("SUPABASE_URL") || "";
        const supabaseKey = DenoEnv.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const smtpHost = DenoEnv.get("SMTP_HOST");
        const smtpPort = parseInt(DenoEnv.get("SMTP_PORT") || "587");
        const smtpUser = DenoEnv.get("SMTP_USER");
        const smtpPass = DenoEnv.get("SMTP_PASS");

        console.log("Checking environment variables...");
        const missingVars = [];
        if (!supabaseUrl) missingVars.push("SUPABASE_URL");
        if (!supabaseKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
        if (!smtpHost) missingVars.push("SMTP_HOST");
        if (!smtpUser) missingVars.push("SMTP_USER");
        if (!smtpPass) missingVars.push("SMTP_PASS");

        if (missingVars.length > 0) {
            console.error("Missing environment variables:", missingVars.join(", "));
            throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
        }

        // Initialize Supabase client
        let supabase;
        try {
            supabase = createClient(supabaseUrl, supabaseKey);
        } catch (clientError: any) {
            console.error("Failed to initialize Supabase client:", clientError);
            throw new Error(`Supabase client init failed: ${clientError.message}`);
        }

        let body;
        try {
            body = await req.json();
            console.log("Received payload:", JSON.stringify(body));
        } catch (jsonError) {
            console.error("Failed to parse request JSON:", jsonError);
            return new Response(
                JSON.stringify({ success: false, error: "Invalid JSON body" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        const { classId, type, title, body: emailBody, link, lecturerName } = body as EmailRequest; // Renamed body to emailBody to avoid conflict

        if (!classId || !title || !emailBody) {
            console.error("Missing required fields");
            return new Response(
                JSON.stringify({ success: false, error: "Missing required fields: classId, title, or body" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // 1. Fetch Students in Class
        console.log(`Fetching students for class ${classId}`);
        const { data: classStudents, error: studentsError } = await supabase
            .from('class_students')
            .select('email, student_name')
            .eq('class_id', classId)
            .not('email', 'is', null);

        if (studentsError) {
            console.error("Database error fetching students:", studentsError);
            throw new Error(`DB Error (students): ${studentsError.message}`);
        }

        console.log("Raw classStudents:", JSON.stringify(classStudents));

        if (!classStudents || classStudents.length === 0) {
            console.log("No students found in class");
            return new Response(
                JSON.stringify({ success: true, message: "No students in class" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const profiles = classStudents.map((s: any) => ({
            email: s.email,
            full_name: s.student_name || 'Student'
        }));

        console.log(`Found ${profiles.length} valid recipients`);

        // 3. Setup Nodemailer
        console.log("Initializing Nodemailer...");
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        // Verify connection configuration
        try {
            await transporter.verify();
            console.log("SMTP connection verified");
        } catch (smtpError: any) {
            console.error("SMTP verification failed:", smtpError);
            throw new Error(`SMTP Error: ${smtpError.message}`);
        }

        // 4. Send Emails
        console.log(`Sending emails to ${profiles.length} recipients...`);
        const emailPromises = profiles.map(async (student: any) => {
            if (!student.email) return;

            const mailOptions = {
                from: `"EduSpace" <${smtpUser}>`,
                to: student.email,
                subject: `[${type.toUpperCase()}] ${title} - ${lecturerName}`,
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 20px; text-align: center; color: white; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
              .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
              .card { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 4px; }
              .button { display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-top: 20px; text-align: center; }
              .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>EduSpace Notification</h1>
              </div>
              <div class="content">
                <h2>Hello ${student.full_name || 'Student'},</h2>
                <p><strong>${lecturerName}</strong> has posted a new update in your class.</p>
                
                <div class="card">
                  <h3 style="margin-top: 0; color: #1e293b;">${title}</h3>
                  <p style="margin-bottom: 0;">${emailBody}</p>
                </div>

                <p>Click the button below to view the details directly:</p>
                
                <center>
                  <a href="${link}" class="button" style="color: white;">View ${type === 'schedule' ? 'Schedule' : type === 'quiz' ? 'Quiz' : 'Assignment'}</a>
                </center>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} EduSpace. All rights reserved.<br>
                You are receiving this email because you are enrolled in this class.
              </div>
            </div>
          </body>
          </html>
        `,
            };

            try {
                await transporter.sendMail(mailOptions);
                return { email: student.email, status: 'sent' };
            } catch (error) {
                console.error(`Failed to send email to ${student.email}:`, error);
                return { email: student.email, status: 'failed', error };
            }
        });

        const results = await Promise.all(emailPromises);
        console.log("Email sending completed:", results);

        return new Response(
            JSON.stringify({ success: true, results }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        console.error("Error sending class emails (RAW):", error);

        let errorMessage = "Unknown error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
            try {
                errorMessage = JSON.stringify(error);
            } catch (e) {
                errorMessage = String(error);
            }
        } else {
            errorMessage = String(error);
        }

        console.error("Error sending class emails (Processed):", errorMessage);

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
