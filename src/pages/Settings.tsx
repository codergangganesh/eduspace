import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteUserAccount } from "@/lib/accountService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
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
  ShieldCheck
} from "lucide-react";
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
import SEO from "@/components/SEO";

export default function Settings() {
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
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

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
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
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-3">Settings</h1>
          <p className="text-muted-foreground text-lg italic">
            Control your learning identity, digital footprint, and security parameters.
          </p>
        </header>

        <div className="space-y-16">
          {/* Identity Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <div className="md:col-span-1">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <User className="size-5 text-indigo-500" />
                Identity
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Management of your visual and textual presence across the EduSpace ecosystem.
              </p>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 hover:bg-secondary/20 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Registered Email</span>
                  </div>
                  <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-full font-bold uppercase tracking-tighter">Verified</span>
                </div>
                <p className="text-lg font-medium text-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  All administrative notifications and security alerts are dispatched to this address.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy & Governance */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border/50">
            <div className="md:col-span-1">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <ShieldCheck className="size-5 text-emerald-500" />
                Transparency
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Understanding how your learning metrics and behavioral data are governed.
              </p>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                  <Database className="size-4 text-emerald-600" />
                  Metric Sovereignty
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  EduSpace adheres to strict data minimization principles. Your academic performance data is used exclusively to generate insights in the AI Coach and is subject to automated clearing every 24 hours for ephemeral interactions.
                </p>
              </div>

              <div className="group block cursor-pointer transition-colors" onClick={() => navigate('/terms-of-service')}>
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/10 border border-transparent hover:border-border/50">
                  <div className="flex items-center gap-3">
                    <Lock className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Review Governing Policies</span>
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
                Danger Zone
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Terminal operations regarding your identity and data history.
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="bg-destructive/5 border border-destructive/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <Trash2 className="size-32 text-destructive" />
                </div>

                <div className="space-y-2 relative z-10">
                  <h4 className="text-xl font-black text-destructive tracking-tight">Erase Digital Presence</h4>
                  <p className="text-sm text-destructive/80 font-medium leading-relaxed">
                    Initiating an account deletion is irreversible. This will purge all associated academic metrics, enrollment tokens, and social configurations from our production databases.
                  </p>
                </div>

                <ul className="space-y-3 relative z-10">
                  {[
                    "Permanent erasure of profile metadata",
                    "Revocation of all active course enrollments",
                    "Full deletion of submission and grading logs",
                    "Immediate termination of platform session"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                      <div className="size-1 bg-destructive/40 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="pt-4 relative z-10">
                  <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="h-12 px-8 rounded-2xl font-bold shadow-lg shadow-destructive/20">
                        <Trash2 className="size-4 mr-2" />
                        Execute Erasure
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-destructive" />

                      <AlertDialogHeader className="pt-4">
                        <AlertDialogTitle className="text-2xl font-black text-destructive tracking-tighter">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
                          This action cannot be undone. We will permanently sanitize your account data from all primary storage and backup shards.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="py-8 space-y-6">
                        <div className="space-y-3">
                          <Label htmlFor="password text-xs font-black uppercase tracking-widest text-slate-400">1. Verification Key</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Current account password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-14 bg-muted/30 border-none rounded-2xl shadow-inner text-base font-medium"
                            autoComplete="current-password"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="confirm-text" className="text-xs font-black uppercase tracking-widest text-slate-400">
                            2. Confirmation Token
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirm-text"
                              type="text"
                              placeholder="Type DELETE"
                              value={confirmText}
                              onChange={(e) => setConfirmText(e.target.value)}
                              className="h-14 bg-muted/30 border-none rounded-2xl shadow-inner font-mono text-center tracking-[0.2em] font-bold"
                            />
                            {confirmText === "DELETE" && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                <ShieldCheck className="size-5" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/10 text-[10px] text-destructive flex gap-3 items-center font-black uppercase tracking-wider">
                          <AlertTriangle className="size-5 shrink-0" />
                          <span>Sanitization Protocol Initialized</span>
                        </div>
                      </div>

                      <AlertDialogFooter className="flex-row gap-3 pt-4 sm:space-x-0">
                        <AlertDialogCancel
                          className="flex-1 h-14 rounded-2xl border-none bg-secondary/50 hover:bg-secondary font-bold"
                          disabled={isDeleting}
                          onClick={() => {
                            setPassword("");
                            setConfirmText("");
                          }}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteAccount();
                          }}
                          className="flex-[2] h-14 bg-destructive hover:bg-destructive text-white rounded-2xl font-black shadow-lg shadow-destructive/20 border-none disabled:opacity-50"
                          disabled={isDeleting || !password || confirmText !== "DELETE"}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="size-5 mr-3 animate-spin" />
                              WIPING...
                            </>
                          ) : (
                            "CONFIRM ERASURE"
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
