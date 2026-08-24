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
  ShieldCheck,
  Fingerprint,
  Laptop,
  Smartphone,
  Key,
  Plus,
  Sparkles,
  RefreshCw,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";
import {
  passkeyService,
  PasskeyFactor,
  isPasskeySupported,
  getSuggestedPasskeyName,
} from "@/services/passkey.service";
import { useEffect } from "react";

export default function Settings() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  // Passkeys state
  const [passkeys, setPasskeys] = useState<PasskeyFactor[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [isAddPasskeyOpen, setIsAddPasskeyOpen] = useState(false);
  const [deletingPasskey, setDeletingPasskey] = useState<PasskeyFactor | null>(null);
  const [isDeletingPasskey, setIsDeletingPasskey] = useState(false);

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const fetchPasskeys = async () => {
    try {
      setIsLoadingPasskeys(true);
      const { data, error } = await passkeyService.listPasskeys();
      if (!error && data) {
        setPasskeys(data);
      }
    } catch (err) {
      console.error("Error fetching passkeys:", err);
    } finally {
      setIsLoadingPasskeys(false);
    }
  };

  const handleOpenAddPasskey = () => {
    setPasskeyName(getSuggestedPasskeyName());
    setIsAddPasskeyOpen(true);
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyName.trim()) {
      toast({
        title: "Device Name Required",
        description: "Please enter a recognizable name for this passkey.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRegisteringPasskey(true);
      const { data, error } = await passkeyService.registerPasskey(passkeyName.trim());

      if (error) {
        toast({
          title: "Registration Failed",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Passkey Registered",
        description: "Your passkey has been added. You can now use it to sign in without a password.",
      });

      setIsAddPasskeyOpen(false);
      setPasskeyName("");
      await fetchPasskeys();
    } catch (err: any) {
      toast({
        title: "Registration Error",
        description: err.message || "Failed to register passkey.",
        variant: "destructive",
      });
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleConfirmDeletePasskey = async () => {
    if (!deletingPasskey) return;

    try {
      setIsDeletingPasskey(true);
      const { success, error } = await passkeyService.removePasskey(deletingPasskey.id);

      if (!success || error) {
        toast({
          title: "Failed to Remove",
          description: error || "Could not delete passkey.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Passkey Removed",
        description: `Passkey "${deletingPasskey.friendly_name}" was successfully removed.`,
      });

      setDeletingPasskey(null);
      await fetchPasskeys();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete passkey.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingPasskey(false);
    }
  };

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

          {/* Passkeys & Biometric Security Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border/50">
            <div className="md:col-span-1">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <Fingerprint className="size-5 text-blue-500" />
                Passkeys & Biometrics
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sign in to EduSpace faster and more securely using Windows Hello, Touch ID, Face ID, or Google Password Manager.
              </p>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-secondary/10 border border-border/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <span>Saved Passkeys</span>
                      <Badge variant="outline" className="text-[10px] font-bold text-blue-500 border-blue-500/30">
                        FIDO2
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Devices and security keys registered for passwordless sign-in.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleOpenAddPasskey}
                    className="text-xs font-semibold gap-1.5 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    <Plus className="size-3.5" />
                    Add Passkey
                  </Button>
                </div>

                {/* Passkeys List */}
                {isLoadingPasskeys ? (
                  <div className="space-y-2 py-2">
                    <div className="h-16 bg-secondary/30 animate-pulse rounded-xl" />
                  </div>
                ) : passkeys.length === 0 ? (
                  <div className="text-center py-6 px-4 rounded-xl border border-dashed border-border/70 bg-secondary/5 space-y-3">
                    <div className="mx-auto size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Key className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">No passkeys added yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Add a passkey to sign in instantly with biometrics or Google Password Manager without typing your password.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenAddPasskey}
                      className="text-xs font-semibold gap-1.5 h-8"
                    >
                      <Fingerprint className="size-3.5 text-blue-500" />
                      Register This Device
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {passkeys.map((factor) => {
                      const nameLower = factor.friendly_name.toLowerCase();
                      const isGoogle = nameLower.includes("google") || nameLower.includes("password manager") || nameLower.includes("chrome");
                      const isApple = nameLower.includes("apple") || nameLower.includes("mac") || nameLower.includes("iphone") || nameLower.includes("ipad");
                      const isWindows = nameLower.includes("windows");
                      const isMobile = nameLower.includes("phone") || nameLower.includes("android");

                      const DeviceIcon = isWindows ? Laptop : isMobile ? Smartphone : isApple ? Fingerprint : Key;

                      return (
                        <div
                          key={factor.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border/60 hover:border-blue-500/40 transition-all shadow-xs"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={cn(
                              "size-10 rounded-xl flex items-center justify-center shrink-0",
                              isGoogle
                                ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
                                : "bg-blue-500/10 text-blue-600"
                            )}>
                              {isGoogle ? (
                                <svg className="size-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                  />
                                  <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                  />
                                  <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    fill="#FBBC05"
                                  />
                                  <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    fill="#EA4335"
                                  />
                                </svg>
                              ) : (
                                <DeviceIcon className="size-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-foreground truncate">
                                  {factor.friendly_name}
                                </p>
                                <Badge variant="outline" className="text-[10px] font-semibold text-emerald-500 border-emerald-500/30 py-0 px-1.5">
                                  Active
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Added {new Date(factor.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingPasskey(factor)}
                            className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2.5 shrink-0 gap-1"
                            title="Remove passkey"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="hidden sm:inline">Remove</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
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

          {/* Add Passkey Modal Dialog */}
          <Dialog open={isAddPasskeyOpen} onOpenChange={setIsAddPasskeyOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Fingerprint className="size-5 text-blue-600" />
                  Register New Passkey
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Give this device or key a name, then complete the biometric verification prompt.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRegisterPasskey} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="passkey-device-name" className="text-xs font-semibold">
                    Device Label
                  </Label>
                  <Input
                    id="passkey-device-name"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    placeholder="e.g. My Phone / Windows Hello"
                    className="h-10 text-sm"
                    disabled={isRegisteringPasskey}
                    autoFocus
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This helps you recognize this authenticator in your account security settings.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-muted-foreground flex items-start gap-2.5">
                  <Sparkles className="size-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    When you click Continue, your device will prompt you with Windows Hello, Touch ID, Face ID, or Google Password Manager.
                  </span>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddPasskeyOpen(false)}
                    disabled={isRegisteringPasskey}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isRegisteringPasskey || !passkeyName.trim()}
                    className="text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isRegisteringPasskey ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="size-3.5" />
                        Continue to Verify
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Passkey Confirmation Dialog */}
          <AlertDialog open={Boolean(deletingPasskey)} onOpenChange={(open) => !open && setDeletingPasskey(null)}>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
                  <Trash2 className="size-5" />
                  Remove Passkey?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs leading-relaxed">
                  Are you sure you want to remove <strong>"{deletingPasskey?.friendly_name}"</strong>? You will no longer be able to sign in using this biometric device until you re-register it.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
                <AlertDialogCancel
                  disabled={isDeletingPasskey}
                  onClick={() => setDeletingPasskey(null)}
                  className="text-xs"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleConfirmDeletePasskey();
                  }}
                  disabled={isDeletingPasskey}
                  className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingPasskey ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                      Removing...
                    </>
                  ) : (
                    "Remove Passkey"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
