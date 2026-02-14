// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface FeedbackEmailRequest {
    rating: number;
    message?: string;
    userName: string;
    userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
            );
        }

        const { rating, message, userName, userEmail } = await req.json() as FeedbackEmailRequest;

        console.log(`Sending feedback email: ${rating} stars from ${userName} (${userEmail})`);

        const smtpHost = Deno.env.get("SMTP_HOST");
        const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
        const smtpUser = Deno.env.get("SMTP_USER");
        const smtpPass = Deno.env.get("SMTP_PASS");
        const targetEmail = "eduspacelearning8@gmail.com";

        if (!smtpHost || !smtpUser || !smtpPass) {
            throw new Error("SMTP configuration missing");
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
            from: `"EduSpace Feedback" <${smtpUser}>`,
            to: targetEmail,
            replyTo: userEmail,
            subject: `New Feedback Received: ${rating} Stars from ${userName}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background: #1e3a8a; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">EduSpace Feedback</h1>
          </div>
          <div style="padding: 30px; line-height: 1.6; color: #334155;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Feedback Details</h2>
            <div style="margin-bottom: 20px;">
              <strong style="display: inline-block; width: 100px;">User:</strong> ${userName}<br>
              <strong style="display: inline-block; width: 100px;">Email:</strong> ${userEmail}<br>
              <strong style="display: inline-block; width: 100px;">Rating:</strong> 
              <span style="color: #fbbf24; font-size: 20px;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span> (${rating}/5)
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #1e3a8a;">
              <h3 style="margin-top: 0; font-size: 16px;">Message:</h3>
              <p style="margin: 0; white-space: pre-wrap;">${message || "No written feedback provided."}</p>
            </div>
          </div>
          <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            This email was sent automatically from the EduSpace Feedback System.
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
    } catch (error) {
        console.error("Error sending feedback email:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
};

serve(handler);
