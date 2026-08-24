import * as React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { LEGAL_VERSIONS } from "@/services/legal.service";

export const TermsOfService: React.FC = () => {
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
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Version {LEGAL_VERSIONS.TERMS} &bull; Last updated: {LEGAL_VERSIONS.LAST_UPDATED}
          </p>
        </div>

        <div className="space-y-10 text-sm sm:text-base text-muted-foreground leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              1. Overview and Acceptance
            </h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "Administrator", or "Institution") and Eduspace Inc. ("Eduspace", "we", "us", or "our"). By registering for, accessing, or using the Eduspace platform, websites, administrative portals, or applications, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p>
              If you are entering into these Terms on behalf of an educational institution, school district, university, or corporate entity, you represent and warrant that you possess the necessary legal authority to bind that entity to these Terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              2. Eligibility and User Accounts
            </h2>
            <p>
              To access and administer the Eduspace portal, you must be at least 18 years of age and authorized by your educational institution. You agree to provide accurate, current, and complete registration information and to maintain the security of your authentication credentials.
            </p>
            <p>
              You are responsible for all activities that occur under your account. You agree to immediately notify Eduspace of any unauthorized access, security incident, or credential compromise at security@eduspaceacademy.online.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              3. Acceptable Use Policy
            </h2>
            <p>
              You agree to use Eduspace strictly for authorized instructional, administrative, and learning purposes. You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Reverse engineer, decompile, disassemble, or derive source code from any platform software or APIs.</li>
              <li>Deploy unauthorized automated scrapers, data-mining scripts, or bots against platform endpoints.</li>
              <li>Upload or transmit harmful code, viruses, malware, or destructive files.</li>
              <li>Interfere with or compromise the security, integrity, or availability of servers and networks.</li>
              <li>Facilitate academic fraud, unauthorized exam compromises, or cheating automation.</li>
              <li>Harass, abuse, defame, or violate the legal rights of students, educators, or staff members.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              4. Institutional Data and Education Records
            </h2>
            <p>
              All student data, grades, attendance logs, and institutional records remain the property of the educational institution. Eduspace processes educational records as a "School Official" with legitimate educational interests under FERPA (34 CFR § 99.31) and as a Data Processor under applicable privacy laws (such as GDPR).
            </p>
            <p>
              Partner institutions are responsible for obtaining required parental or student consents and complying with applicable local record-keeping statutes.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              5. Intellectual Property
            </h2>
            <p>
              The Eduspace platform, software, codebase, trademarks, service marks, designs, algorithms, and documentation are the exclusive intellectual property of Eduspace Inc. and its licensors.
            </p>
            <p>
              Users retain ownership of original educational content (assignments, lecture materials, course documents) uploaded to the platform, granting Eduspace a limited license solely to host, process, and display such content to deliver educational services.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              6. Limitation of Liability and Disclaimers
            </h2>
            <p>
              THE EDUSPACE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p>
              IN NO EVENT SHALL EDUSPACE, ITS OFFICERS, DIRECTORS, OR EMPLOYEES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF DATA, REPUTATION, OR REVENUE. OUR TOTAL AGGREGATE LIABILITY ARISING FROM THESE TERMS SHALL NOT EXCEED THE AMOUNT PAID BY YOUR INSTITUTION IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              7. Termination and Suspension
            </h2>
            <p>
              We reserve the right to suspend or terminate access to the platform upon written notice if you violate these Terms or engage in conduct that poses an operational or security risk. Institutions may terminate service agreements pursuant to written contract terms.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              8. Governing Law and Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable governing law without regard to conflict of law principles. Any dispute arising under these Terms shall be resolved through good-faith executive discussion, and if unresolved, submitted to binding arbitration under recognized arbitration rules. Class action lawsuits and representative proceedings are waived.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              9. Contact Information
            </h2>
            <p>
              For legal notices, contract inquiries, or institutional governance questions, please contact:
              <br />
              <strong>Eduspace Inc. — Legal Affairs</strong>
              <br />
              Email: legal@eduspaceacademy.online
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
