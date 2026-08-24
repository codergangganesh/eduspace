import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Shield,
  Scale,
  Lock,
  BookOpen,
  UserCheck,
  Building,
  HelpCircle
} from "lucide-react";
import SEO from "@/components/SEO";
import { LegalHeader } from "@/components/layout/LegalHeader";
import { LegalFooter } from "@/components/layout/LegalFooter";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <LegalHeader />
      <SEO
        title="Terms of Service"
        description="EduSpace Terms of Service - Comprehensive rules, user eligibility, intellectual property, and institutional governance."
        keywords={["Terms of Service", "Conditions of Use", "Legal Terms", "EduSpace", "FERPA", "GDPR"]}
      />

      <main className="max-w-4xl mx-auto py-16 px-6 md:px-12 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-12 border-b border-border/50 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
              <Scale className="size-3.5" />
              <span>Legal Governance Agreement</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3">Terms of Service</h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              Version 2026.1 &bull; Last Revised: March 15, 2026 &bull; Global Institutional Applicability
            </p>
          </header>

          <div className="space-y-12 leading-relaxed text-muted-foreground">
            {/* 1. Acceptance & Eligibility */}
            <section className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <CheckCircle2 className="size-6 text-primary shrink-0" />
                1. Acceptance of Terms & Eligibility
              </h2>
              <p>
                By accessing, registering for, or utilizing the Eduspace platform, applications, or institutional services, you enter into a legally binding agreement with Eduspace Inc. You represent and warrant that you possess the requisite legal capacity to form a binding contract. If acting on behalf of an educational institution, school district, or organization, you certify that you have express authority to bind said entity. Users must be at least 18 years old or the age of legal majority in their jurisdiction to register independent accounts; students under the age of majority may only participate under authorized school or parental supervision in compliance with FERPA, COPPA, and GDPR-K.
              </p>
            </section>

            {/* 2. Account Registration & Security */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <Lock className="size-6 text-primary shrink-0" />
                2. Account Responsibilities & Security
              </h2>
              <p>
                Users agree to provide accurate, truthful, and complete profile information during registration. You are solely responsible for maintaining the confidentiality of your authentication credentials, session tokens, and passwords. You agree to notify Eduspace security immediately at <a href="mailto:security@eduspaceacademy.online" className="text-primary underline">security@eduspaceacademy.online</a> upon suspecting any unauthorized access or compromise of your account. Eduspace disclaims all liability for losses arising from credential sharing or unauthorized delegation.
              </p>
            </section>

            {/* 3. Acceptable Use & Prohibited Conduct */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <AlertCircle className="size-6 text-primary shrink-0" />
                3. Acceptable Use & Prohibited Conduct
              </h2>
              <p>
                Eduspace is dedicated to fostering an ethical, secure, and collaborative learning environment. You expressly agree not to:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4 rounded-xl border border-border/60 bg-card">
                  <p className="text-xs sm:text-sm font-medium text-foreground">Disrupt, reverse engineer, decompile, or overload server infrastructure or APIs.</p>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-card">
                  <p className="text-xs sm:text-sm font-medium text-foreground">Engage in academic misconduct, unauthorized examination compromises, or cheating automation.</p>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-card">
                  <p className="text-xs sm:text-sm font-medium text-foreground">Harass, bully, impersonate, or violate the privacy rights of educators or fellow learners.</p>
                </div>
                <div className="p-4 rounded-xl border border-border/60 bg-card">
                  <p className="text-xs sm:text-sm font-medium text-foreground">Scrape, crawl, or harvest proprietary curriculum or quiz data using automated bots.</p>
                </div>
              </div>
            </section>

            {/* 4. Intellectual Property Rights */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <Scale className="size-6 text-primary shrink-0" />
                4. Intellectual Property & License Grants
              </h2>
              <p>
                All proprietary algorithms, source code, UI elements, trademarks, and educational diagnostic engines are the exclusive intellectual property of Eduspace Inc. Users retain ownership of original educational submissions, granting Eduspace a limited, worldwide, non-exclusive license solely to host, cache, and process materials for delivering educational services.
              </p>
            </section>

            {/* 5. Limitation of Liability & Warranty Disclaimers */}
            <section className="space-y-3 pt-6 border-t border-border/50 bg-primary/5 p-6 rounded-2xl border border-primary/15">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <Shield className="size-6 text-primary shrink-0" />
                5. Limitation of Liability & Warranty Disclaimers
              </h2>
              <p className="text-sm">
                THE EDUSPACE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, EDUSPACE DISCLAIMS ALL LIABILITY FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM PLATFORM USAGE, DATA OUTAGES, OR AI-GENERATED RECOMMENDATIONS. TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED FEES PAID BY THE USER IN THE PRECEDING TWELVE MONTHS.
              </p>
            </section>

            {/* 6. Termination & Account Closure */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <UserCheck className="size-6 text-primary shrink-0" />
                6. Termination Conditions & Suspension
              </h2>
              <p>
                Eduspace reserves the right to suspend or terminate accounts that violate these Terms, engage in fraud, or pose cybersecurity risks. Users may close their accounts at any time via settings, subject to institutional record retention policies.
              </p>
            </section>

            {/* 7. Dispute Resolution & Governing Law */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <Building className="size-6 text-primary shrink-0" />
                7. Dispute Resolution & Binding Arbitration
              </h2>
              <p>
                These Terms are governed by applicable substantive law without regard to conflict principles. Any claims shall be resolved through good-faith mediation followed by binding individual arbitration under recognized arbitration rules. Class action lawsuits and representative actions are expressly waived.
              </p>
            </section>

            {/* 8. Contact Information */}
            <section className="space-y-3 pt-6 border-t border-border/50">
              <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-3">
                <HelpCircle className="size-6 text-primary shrink-0" />
                8. Contact & Governance Inquiries
              </h2>
              <p>
                For legal inquiries, contract clarifications, or compliance documentation, contact:
                <br />
                <strong>Eduspace Legal Affairs</strong> &bull; Email: <a href="mailto:legal@eduspaceacademy.online" className="text-primary underline">legal@eduspaceacademy.online</a> &bull; Phone: +91-7670895485
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      <LegalFooter />
    </div>
  );
};

export default TermsOfService;
