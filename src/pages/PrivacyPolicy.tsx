import { motion } from "framer-motion";
import {
  Shield,
  Mail,
  Lock,
  UserCheck,
  Eye,
  Database,
  Share2,
  Cookie,
  Globe,
  HelpCircle,
  CheckCircle2
} from "lucide-react";
import SEO from "@/components/SEO";
import { LegalHeader } from "@/components/layout/LegalHeader";
import { LegalFooter } from "@/components/layout/LegalFooter";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <LegalHeader />
      <SEO
        title="Privacy Policy"
        description="EduSpace Privacy Policy - Transparent data practices, encryption, FERPA/GDPR compliance, and user privacy rights."
        keywords={["Privacy Policy", "Data Protection", "Privacy", "EduSpace", "GDPR", "FERPA", "COPPA"]}
      />

      <main className="max-w-4xl mx-auto py-16 px-6 md:px-12 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-12 border-b border-border/50 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-4 border border-teal-500/20">
              <Shield className="size-3.5" />
              <span>Data Protection & Privacy Policy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Version 2026.1 &bull; Last Revised: March 15, 2026 &bull; Compliant with GDPR, FERPA, COPPA, and CCPA
            </p>
          </header>

          <div className="space-y-12 leading-relaxed text-muted-foreground">
            {/* 1. Introduction */}
            <section className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <Shield className="size-6 text-teal-500 shrink-0" />
                1. Privacy Commitment & Scope
              </h2>
              <p>
                Eduspace Inc. is committed to protecting the privacy and security of students, educators, and institutions. This Privacy Policy explains what personal data we gather, how it is processed and secured, with whom it is shared under strict sub-processor agreements, and the enforceable rights users hold over their digital educational records.
              </p>
            </section>

            {/* 2. Data Collection Practices */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <Database className="size-6 text-teal-500 shrink-0" />
                2. Categories of Personal Information Gathered
              </h2>
              <p>We gather only the minimum data required to facilitate personalized academic learning and institutional governance:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-card p-4 rounded-xl border border-border/60">
                  <strong className="block text-foreground mb-1 text-sm">Account & Identity</strong>
                  <span className="text-xs text-muted-foreground">Name, verified institutional email, avatar, role (Student, Lecturer, Administrator), and student ID.</span>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border/60">
                  <strong className="block text-foreground mb-1 text-sm">Academic Records</strong>
                  <span className="text-xs text-muted-foreground">Course enrollments, assignment submissions, quiz results, attendance logs, and educator evaluations.</span>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border/60">
                  <strong className="block text-foreground mb-1 text-sm">Technical Telemetry</strong>
                  <span className="text-xs text-muted-foreground">IP address, device characteristics, browser type, authentication timestamps, and security audit traces.</span>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border/60">
                  <strong className="block text-foreground mb-1 text-sm">AI Tutor Interactions</strong>
                  <span className="text-xs text-muted-foreground">Questions submitted to AI tutors and practice session metrics (processed under zero model-training retention terms).</span>
                </div>
              </div>
            </section>

            {/* 3. Usage Purposes */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <CheckCircle2 className="size-6 text-teal-500 shrink-0" />
                3. Purposes of Data Processing
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Service Delivery:</strong> Organizing classes, calculating grades, providing analytics, and enabling collaboration.</li>
                <li><strong className="text-foreground">Platform Security:</strong> Protecting student data from unauthorized intrusion, phishing, or abuse.</li>
                <li><strong className="text-foreground">Institutional Reporting:</strong> Satisfying accreditation criteria and institutional administrative audits.</li>
                <li><strong className="text-foreground">Zero Commercial Sale:</strong> We strictly NEVER sell, rent, or monetize personal information.</li>
              </ul>
            </section>

            {/* 4. Data Storage & Security Measures */}
            <section className="space-y-3 pt-6 border-t border-border/50 bg-teal-500/5 p-6 rounded-2xl border border-teal-500/15">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <Lock className="size-6 text-teal-500 shrink-0" />
                4. Data Storage, Retention & Security Safeguards
              </h2>
              <p className="text-sm">
                Eduspace uses enterprise cryptographic controls: TLS 1.3 encryption in transit and AES-256 encryption at rest. Databases operate across SOC 2 Type II certified cloud environments with multi-factor access isolation. Data is retained only for active academic lifecycles and purged securely upon contract expiration.
              </p>
            </section>

            {/* 5. Third-Party Sharing */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <Share2 className="size-6 text-teal-500 shrink-0" />
                5. Third-Party Sharing & Sub-Processors
              </h2>
              <p>
                We share data solely with vetted infrastructure sub-processors (e.g. AWS, Supabase, transactional email delivery) bound by enforceable Data Processing Agreements (DPAs). We never disclose records to third parties except when compelled by lawful subpoenas with prior institutional notice.
              </p>
            </section>

            {/* 6. Cookie Usage */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <Cookie className="size-6 text-teal-500 shrink-0" />
                6. Cookie Usage & Tracking
              </h2>
              <p>
                We use strictly necessary cookies for session authentication and functional cookies for theme preferences (Dark/Light mode). We do not deploy third-party advertising tracking pixels or marketing cookies.
              </p>
            </section>

            {/* 7. User Rights */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <UserCheck className="size-6 text-teal-500 shrink-0" />
                7. User Rights & Data Control
              </h2>
              <p>
                Users have the right to access, rectify, export, and request deletion of their personal information under GDPR, CCPA, and FERPA standards. You can manage profile data directly in account settings or submit formal Data Subject Access Requests (DSARs) to <a href="mailto:privacy@eduspaceacademy.online" className="text-teal-600 dark:text-teal-400 underline">privacy@eduspaceacademy.online</a>.
              </p>
            </section>

            {/* 8. Contact Information */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <HelpCircle className="size-6 text-teal-500 shrink-0" />
                8. Data Protection Officer (DPO) & Contact
              </h2>
              <p>
                For privacy inquiries or compliance assistance, contact our Data Protection Officer:
                <br />
                <strong>Eduspace Data Protection Office</strong> &bull; Email: <a href="mailto:privacy@eduspaceacademy.online" className="text-teal-600 dark:text-teal-400 underline">privacy@eduspaceacademy.online</a> &bull; Phone: +91-7670895485
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      <LegalFooter />
    </div>
  );
};

export default PrivacyPolicy;
