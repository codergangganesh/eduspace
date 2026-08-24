import * as React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { LEGAL_VERSIONS } from "@/services/legal.service";

export const PrivacyPolicy: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme || theme) : "dark";

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans transition-colors duration-200 flex flex-col">
      {/* Full-width Top Navigation Bar */}
      <header className="w-full border-b border-border bg-card/90 px-6 sm:px-12 lg:px-16 py-4 sticky top-0 z-50 flex items-center justify-between">
        <Link to="/login" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/favicon.png" alt="Eduspace Logo" className="w-8 h-8 rounded-md object-contain" />
          <span className="text-xl font-bold tracking-tight text-foreground">Eduspace</span>
        </Link>

        {/* Right Actions: Dark/Light Mode & Login Portal Only */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer border border-border"
            title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} Mode`}
            aria-label="Toggle theme"
          >
            {currentTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <Link
            to="/login"
            className="text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
          >
            Login Portal
          </Link>
        </div>
      </header>

      {/* Full Width Edge-to-Edge Desktop Document Content */}
      <main className="w-full flex-1 px-6 sm:px-12 lg:px-16 py-10 lg:py-14 max-w-[1600px] mx-auto">
        <div className="border-b border-border pb-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Version {LEGAL_VERSIONS.PRIVACY} &bull; Last updated: {LEGAL_VERSIONS.LAST_UPDATED}
          </p>
        </div>

        <div className="space-y-10 text-sm sm:text-base text-muted-foreground leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              1. Overview and Privacy Commitment
            </h2>
            <p>
              Eduspace Inc. ("Eduspace", "we", "us", or "our") respects your privacy and is committed to protecting the personal data of institutions, administrators, educators, and students. This Privacy Policy explains our data collection, processing, storage, and protection practices in compliance with applicable data protection regulations, including GDPR, FERPA, COPPA, and CCPA.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              2. Information We Collect
            </h2>
            <p>
              We collect only the minimum personal information required to deliver administrative governance and educational functionality:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Account and Contact Information:</strong> Name, institutional email address, phone number, institutional role (Administrator, Lecturer, Student), and profile details.</li>
              <li><strong>Academic and Educational Records:</strong> Course enrollments, assignment submissions, quiz responses, grades, attendance logs, and evaluation metrics.</li>
              <li><strong>Technical and Device Telemetry:</strong> IP addresses, browser specifications, device identifiers, session timestamps, and authentication audit logs.</li>
              <li><strong>AI Interaction Data:</strong> Prompts submitted to educational AI modules and study tools, processed under zero-retention sub-processor terms.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              3. How We Use Information
            </h2>
            <p>
              We process personal information solely for legitimate educational and platform administration purposes:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>To provide, administer, and maintain educational tools, classes, grading systems, and reporting.</li>
              <li>To safeguard platform security, authenticate user accounts, and prevent fraud or unauthorized access.</li>
              <li>To comply with statutory legal requirements and institutional accountability obligations.</li>
              <li>We do not sell, rent, or lease personal data to third parties or commercial advertisers.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              4. Data Storage, Security, and Retention
            </h2>
            <p>
              We employ enterprise-level security measures to protect your data. All data in transit is encrypted using Transport Layer Security (TLS 1.3), and all data at rest is encrypted using Advanced Encryption Standard (AES-256).
            </p>
            <p>
              Data is hosted in certified secure cloud environments (SOC 2 Type II compliant). We retain academic data only for the period designated by the educational institution or required by law, after which it is securely deleted.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              5. Third-Party Sharing and Sub-Processors
            </h2>
            <p>
              We share data only with authorized infrastructure sub-processors (such as cloud hosting, database providers, and transactional email services) bound by enforceable Data Processing Agreements (DPAs). We do not disclose data to third parties except as compelled by law with prior institutional notice where permissible.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              6. Cookies and Tracking Technologies
            </h2>
            <p>
              We use strictly necessary cookies for user authentication, session security, and load balancing, along with functional cookies to store interface preferences (such as Dark/Light mode). We do not use third-party marketing or cross-site tracking cookies.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              7. Your Privacy Rights
            </h2>
            <p>
              Depending on your jurisdiction, you have the right to access, rectify, export, or request deletion of your personal data. To exercise these rights or submit a Data Subject Access Request (DSAR), please contact your institutional administrator or email privacy@eduspaceacademy.online.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              8. Educational Privacy (FERPA and COPPA)
            </h2>
            <p>
              Eduspace operates as a "School Official" with legitimate educational interests under FERPA. For students under 13 years of age, institutional partners provide authorization in lieu of parental consent on behalf of the educational agency as permitted under FTC COPPA guidelines.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              9. Contact Information and DPO
            </h2>
            <p>
              For privacy inquiries, questions regarding our data practices, or Data Protection Officer requests, please contact:
              <br />
              <strong>Eduspace Inc. — Data Protection Office</strong>
              <br />
              Email: privacy@eduspaceacademy.online
              <br />
              Phone: +91-7670895485
              <br />
              Website: https://www.eduspaceacademy.online
            </p>
          </section>

        </div>
      </main>

      {/* Full-width Footer */}
      <footer className="w-full border-t border-border bg-card px-6 sm:px-12 lg:px-16 py-6 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4 mt-12">
        <p>&copy; {new Date().getFullYear()} Eduspace Inc. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <a href="https://www.eduspaceacademy.online" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Website</a>
        </div>
      </footer>
    </div>
  );
};
