import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteUserAccount } from "@/lib/accountService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Trash2,
  AlertTriangle,
  Loader2,
  User,
  Shield,
  Lock,
  ChevronRight,
  Database,
  Mail,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { LanguageSelector } from "@/components/language/LanguageSelector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";
import { PinSecurityCard } from "@/components/auth/PinSecurityCard";
import { ActiveDevicesCard } from "@/components/auth/ActiveDevicesCard";

export default function Settings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user || !user.email) return;

    if (!password || confirmText !== "DELETE") {
      toast({
        title: "Validation Failed",
        description: "Please enter your password and type 'DELETE' to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) {
        throw new Error("Invalid password. Please try again.");
      }

      const { success, error } = await deleteUserAccount(user.id);

      if (success) {
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully removed. You will be signed out.",
        });

        setPassword("");
        setConfirmText("");
        setIsConfirming(false);

        setTimeout(async () => {
          await signOut();
          navigate("/login");
        }, 1500);
      } else {
        throw new Error(error || "Failed to delete account");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  return (
    <DashboardLayout>
      <SEO
        title="Settings | EduSpace"
        description="Configure your personalized EduSpace experience, manage data privacy, and handle account security."
      />

      <motion.div
        className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Page Header */}
        <header className="mb-12 border-b border-border/50 pb-8">
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-3">{t("settings.title", "Settings")}</h1>
          <p className="text-muted-foreground text-lg italic">
            {t("settings.subtitle", "Control your learning identity, language preferences, and security parameters.")}
          </p>
        </header>

        <div className="space-y-16">
          {/* Identity Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <div className="md:col-span-1">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <User className="size-5 text-indigo-500" />
                {t("settings.identity", "Identity")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("settings.identityDescription", "Management of your visual and textual presence across the EduSpace ecosystem.")}
              </p>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 hover:bg-secondary/20 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{t("settings.registeredEmail", "Registered Email")}</span>
                  </div>
                  <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-full font-bold uppercase tracking-tighter">{t("settings.verified", "Verified")}</span>
                </div>
                <p className="text-lg font-medium text-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  {t("settings.emailDescription", "All administrative notifications and security alerts are dispatched to this address.")}
                </p>
              </div>
            </div>
          </section>

          {/* Language & Preferences Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border/50">
            <div className="md:col-span-1">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <Globe className="size-5 text-sky-500" />
                {t("settings.language", "Language & Locale")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("settings.languageDescription", "Choose the display language for your dashboard, navigation, and coursework.")}
              </p>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 hover:bg-secondary/20 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold">{t("settings.interfaceLanguage", "Interface Language")}</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("settings.interfaceLanguageDescription", "Choose between English, हिन्दी (Hindi), తెలుగు (Telugu), Español, and more.")}
                    </p>
                  </div>
                  <div className="w-full sm:w-56">
                    <LanguageSelector />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security & Screen Lock Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border/50">
            <div className="md:col-span-1">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <Shield className="size-5 text-indigo-500" />
                {t("settings.security", "Security & Screen Lock")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("settings.securityDescription", "Protect your active session with an in-app 4-digit PIN and hardware biometric authentication.")}
              </p>
            </div>

            <div className="md:col-span-2 space-y-6">
              <PinSecurityCard />
              <ActiveDevicesCard />
            </div>
          </section>

          {/* Privacy & Governance */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border/50">
            <div className="md:col-span-1">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <ShieldCheck className="size-5 text-emerald-500" />
                {t("settings.transparency", "Transparency")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("settings.transparencyDescription", "Understanding how your learning metrics and behavioral data are governed.")}
              </p>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                  <Database className="size-4 text-emerald-600" />
                  {t("settings.metricSovereignty", "Metric Sovereignty")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("settings.metricSovereigntyDescription", "EduSpace adheres to strict data minimization principles. Your academic performance data is used exclusively to generate insights in the AI Coach and is subject to automated clearing every 24 hours for ephemeral interactions.")}
                </p>
              </div>

              <div className="group block cursor-pointer transition-colors" onClick={() => navigate('/terms-of-service')}>
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/10 border border-transparent hover:border-border/50">
                  <div className="flex items-center gap-3">
                    <Lock className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t("settings.reviewPolicies", "Review Governing Policies")}</span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border/50 pb-16">
            <div className="md:col-span-1">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-destructive">
                <AlertTriangle className="size-5" />
                {t("settings.dangerZone", "Danger Zone")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("settings.dangerZoneDescription", "Terminal operations regarding your identity and data history.")}
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="bg-destructive/5 border border-destructive/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <Trash2 className="size-32 text-destructive" />
                </div>

                <div className="space-y-2 relative z-10">
                  <h4 className="text-xl font-black text-destructive tracking-tight">{t("settings.erasePresence", "Erase Digital Presence")}</h4>
                  <p className="text-sm text-destructive/80 font-medium leading-relaxed">
                    {t("settings.erasePresenceDescription", "Initiating an account deletion is irreversible. This will purge all associated academic metrics, enrollment tokens, and social configurations from our production databases.")}
                  </p>
                </div>

                <ul className="space-y-3 relative z-10">
                  {[
                    t("settings.bullet1", "Permanent erasure of profile metadata"),
                    t("settings.bullet2", "Revocation of all active course enrollments"),
                    t("settings.bullet3", "Complete purging of asynchronous assignment threads"),
                    t("settings.bullet4", "Removal from institutional rosters & leaderboard records")
                  ].map((text, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs font-semibold text-destructive/90">
                      <div className="size-1.5 rounded-full bg-destructive" />
                      {text}
                    </li>
                  ))}
                </ul>

                <div className="pt-4 relative z-10">
                  <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-destructive/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
                      >
                        {t("settings.deleteAccount", "Delete EduSpace Account")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2rem] border-destructive/20 bg-background/95 backdrop-blur-2xl p-8">
                      <AlertDialogHeader className="space-y-3">
                        <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-2">
                          <AlertTriangle className="size-6" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-foreground tracking-tight">
                          {t("settings.finalConfirmationTitle", "Final Confirmation Required")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
                          {t("settings.finalConfirmationDescription", "This action is absolute. To verify your intent, please provide your current account password and type DELETE below.")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="space-y-4 my-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.accountPassword", "Account Password")}</Label>
                          <Input
                            type="password"
                            placeholder={t("settings.enterPassword", "Enter password")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rounded-xl border-border/60 focus-visible:ring-destructive/30"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("settings.typeDelete", "Type \"DELETE\"")}</Label>
                          <Input
                            placeholder="DELETE"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="rounded-xl border-border/60 font-mono focus-visible:ring-destructive/30 uppercase"
                          />
                        </div>
                      </div>

                      <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl font-bold h-11 border-border/60">
                          {t("common.cancel", "Cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteAccount();
                          }}
                          disabled={isDeleting || confirmText !== "DELETE" || !password}
                          className="rounded-xl font-bold h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
                        >
                          {isDeleting ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="size-4 animate-spin" />
                              <span>{t("settings.purgingRecords", "Purging Records...")}</span>
                            </div>
                          ) : (
                            t("settings.confirmDeletion", "Confirm Complete Deletion")
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
