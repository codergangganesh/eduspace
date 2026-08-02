import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteUserAccount } from "@/lib/accountService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformBrandLogo } from "@/components/profile/CodingProfileCard";
import { extractUsername } from "@/services/codingProfileService";
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
  Code2
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
  const { user, profile, signOut, updateProfile, role } = useAuth();
  const navigate = useNavigate();
  const isLecturer = role === "lecturer" || profile?.role === "lecturer";
  const isStudent = !isLecturer;

  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  // Coding Profiles State
  const [leetcodeUsername, setLeetcodeUsername] = useState(
    profile?.leetcode_username || extractUsername(profile?.leetcode_url) || ""
  );
  const [codeforcesHandle, setCodeforcesHandle] = useState(
    profile?.codeforces_handle || extractUsername(profile?.codeforces_url) || ""
  );
  const [githubUsername, setGithubUsername] = useState(
    (profile?.github_url ? extractUsername(profile.github_url) : "") || (profile as any)?.github_username || ""
  );
  const [codechefUsername, setCodechefUsername] = useState(
    (profile as any)?.codechef_username || extractUsername((profile as any)?.codechef_url) || ""
  );
  const [codewarsUsername, setCodewarsUsername] = useState(
    (profile as any)?.codewars_username || extractUsername((profile as any)?.codewars_url) || ""
  );
  const [geeksforgeeksUsername, setGeeksforgeeksUsername] = useState(
    (profile as any)?.geeksforgeeks_username || extractUsername((profile as any)?.geeksforgeeks_url) || ""
  );
  const [atcoderUsername, setAtcoderUsername] = useState(
    (profile as any)?.atcoder_username || extractUsername((profile as any)?.atcoder_url) || ""
  );
  const [hackerrankUsername, setHackerrankUsername] = useState(
    (profile as any)?.hackerrank_username || extractUsername(profile?.hackerrank_url) || ""
  );
  const [hackerearthUsername, setHackerearthUsername] = useState(
    (profile as any)?.hackerearth_username || extractUsername((profile as any)?.hackerearth_url) || ""
  );
  const [githubToken, setGithubToken] = useState(
    (profile as any)?.github_token || (user?.id ? localStorage.getItem(`eduspace_github_token_${user.id}`) : "") || ""
  );
  const [isSavingCoding, setIsSavingCoding] = useState(false);

  useEffect(() => {
    if (profile) {
      setLeetcodeUsername(profile.leetcode_username || extractUsername(profile.leetcode_url) || "");
      setCodeforcesHandle(profile.codeforces_handle || extractUsername(profile.codeforces_url) || "");
      setGithubUsername((profile.github_url ? extractUsername(profile.github_url) : "") || (profile as any)?.github_username || "");
      setCodechefUsername((profile as any)?.codechef_username || extractUsername((profile as any)?.codechef_url) || "");
      setCodewarsUsername((profile as any)?.codewars_username || extractUsername((profile as any)?.codewars_url) || "");
      setGeeksforgeeksUsername((profile as any)?.geeksforgeeks_username || extractUsername((profile as any)?.geeksforgeeks_url) || "");
      setAtcoderUsername((profile as any)?.atcoder_username || extractUsername((profile as any)?.atcoder_url) || "");
      setHackerrankUsername((profile as any)?.hackerrank_username || extractUsername(profile?.hackerrank_url) || "");
      setHackerearthUsername((profile as any)?.hackerearth_username || extractUsername((profile as any)?.hackerearth_url) || "");
      setGithubToken((profile as any)?.github_token || (user?.id ? localStorage.getItem(`eduspace_github_token_${user.id}`) : "") || "");
    }
  }, [profile, user?.id]);

  const handleSaveCodingUsernames = async (e: React.FormEvent) => {
    e.preventDefault();
    const lcClean = extractUsername(leetcodeUsername);
    const cfClean = extractUsername(codeforcesHandle);
    const ghClean = extractUsername(githubUsername);
    const ccClean = extractUsername(codechefUsername);
    const cwClean = extractUsername(codewarsUsername);
    const gfgClean = extractUsername(geeksforgeeksUsername);
    const atcoderClean = extractUsername(atcoderUsername);
    const hrClean = extractUsername(hackerrankUsername);
    const heClean = extractUsername(hackerearthUsername);
    const ghTokenClean = githubToken.trim();

    setIsSavingCoding(true);
    try {
      if (user?.id) {
        if (ghTokenClean) {
          localStorage.setItem(`eduspace_github_token_${user.id}`, ghTokenClean);
        } else {
          localStorage.removeItem(`eduspace_github_token_${user.id}`);
        }
      }

      const lcUrl = lcClean ? `https://leetcode.com/u/${lcClean}/` : "";
      const cfUrl = cfClean ? `https://codeforces.com/profile/${cfClean}` : "";
      const ghUrl = ghClean ? `https://github.com/${ghClean}` : "";
      const ccUrl = ccClean ? `https://www.codechef.com/users/${ccClean}` : "";
      const cwUrl = cwClean ? `https://www.codewars.com/users/${cwClean}` : "";
      const gfgUrl = gfgClean ? `https://www.geeksforgeeks.org/user/${gfgClean}/` : "";
      const atcoderUrl = atcoderClean ? `https://atcoder.jp/users/${atcoderClean}` : "";
      const hrUrl = hrClean ? `https://www.hackerrank.com/profile/${hrClean}` : "";
      const heUrl = heClean ? `https://www.hackerearth.com/@${heClean}` : "";

      const res = await updateProfile({
        leetcode_username: lcClean || null,
        codeforces_handle: cfClean || null,
        github_username: ghClean || null,
        codechef_username: ccClean || null,
        codewars_username: cwClean || null,
        geeksforgeeks_username: gfgClean || null,
        atcoder_username: atcoderClean || null,
        hackerrank_username: hrClean || null,
        hackerearth_username: heClean || null,
        leetcode_url: lcUrl || null,
        codeforces_url: cfUrl || null,
        github_url: ghUrl || null,
        codechef_url: ccUrl || null,
        codewars_url: cwUrl || null,
        geeksforgeeks_url: gfgUrl || null,
        atcoder_url: atcoderUrl || null,
        hackerrank_url: hrUrl || null,
        hackerearth_url: heUrl || null,
        github_token: ghTokenClean || null,
      } as any);

      if (res.success) {
        toast({
          title: "Profiles Saved",
          description: "Coding profile handles & URLs updated successfully.",
        });
      } else {
        throw new Error(res.error || "Failed to update coding profiles");
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Could not save coding profiles.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCoding(false);
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

          {/* Coding Profiles Settings Section (Students Only) */}
          {isStudent && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-border/50">
              <div className="md:col-span-1">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                  <Code2 className="size-5 text-amber-500" />
                  Coding Profiles
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect your competitive programming & open-source platform handles or URLs to showcase real-time statistics across all coding platforms.
                </p>
              </div>

              <div className="md:col-span-2">
                <form onSubmit={handleSaveCodingUsernames} className="bg-secondary/10 border border-border/50 rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="setting-leetcode" className="text-xs font-semibold flex items-center gap-2">
                        <PlatformBrandLogo platform="leetcode" className="size-4" />
                        LeetCode Handle / URL
                      </Label>
                      <Input
                        id="setting-leetcode"
                        placeholder="e.g. johndoe or https://leetcode.com/u/johndoe/"
                        value={leetcodeUsername}
                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                        className="bg-background/50 font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="setting-codeforces" className="text-xs font-semibold flex items-center gap-2">
                        <PlatformBrandLogo platform="codeforces" className="size-4" />
                        Codeforces Handle / URL
                      </Label>
                      <Input
                        id="setting-codeforces"
                        placeholder="e.g. tourist or https://codeforces.com/profile/tourist"
                        value={codeforcesHandle}
                        onChange={(e) => setCodeforcesHandle(e.target.value)}
                        className="bg-background/50 font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="setting-github" className="text-xs font-semibold flex items-center gap-2">
                        <PlatformBrandLogo platform="github" className="size-4" />
                        GitHub Username / URL
                      </Label>
                      <Input
                        id="setting-github"
                        placeholder="e.g. octocat or https://github.com/octocat"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        className="bg-background/50 font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="setting-codechef" className="text-xs font-semibold flex items-center gap-2">
                        <PlatformBrandLogo platform="codechef" className="size-4" />
                        CodeChef Handle / URL
                      </Label>
                      <Input
                        id="setting-codechef"
                        placeholder="e.g. chef123 or https://www.codechef.com/users/chef123"
                        value={codechefUsername}
                        onChange={(e) => setCodechefUsername(e.target.value)}
                        className="bg-background/50 font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="setting-codewars" className="text-xs font-semibold flex items-center gap-2">
                        <PlatformBrandLogo platform="codewars" className="size-4" />
                        Codewars Handle / URL
                      </Label>
                      <Input
                        id="setting-codewars"
                        placeholder="e.g. ninja or https://www.codewars.com/users/ninja"
                        value={codewarsUsername}
                        onChange={(e) => setCodewarsUsername(e.target.value)}
                        className="bg-background/50 font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="setting-geeksforgeeks" className="text-xs font-semibold flex items-center gap-2">
                        <PlatformBrandLogo platform="geeksforgeeks" className="size-4" />
                        GeeksforGeeks Handle / URL
                      </Label>
                      <Input
                        id="setting-geeksforgeeks"
                        placeholder="e.g. gfg_user or https://geeksforgeeks.org/user/gfg_user/"
                        value={geeksforgeeksUsername}
                        onChange={(e) => setGeeksforgeeksUsername(e.target.value)}
                        className="bg-background/50 font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="setting-atcoder" className="text-xs font-semibold flex items-center gap-2">
                        <PlatformBrandLogo platform="atcoder" className="size-4" />
                        AtCoder Handle / URL
                      </Label>
                      <Input
                        id="setting-atcoder"
                        placeholder="e.g. tourist or https://atcoder.jp/users/tourist"
                        value={atcoderUsername}
                        onChange={(e) => setAtcoderUsername(e.target.value)}
                        className="bg-background/50 font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="setting-hackerrank" className="text-xs font-semibold flex items-center gap-2 text-foreground">
                        <div className="size-4 rounded bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-[9px]">H</div>
                        HackerRank Handle / URL
                      </Label>
                      <Input
                        id="setting-hackerrank"
                        placeholder="e.g. hr_user or https://hackerrank.com/profile/hr_user"
                        value={hackerrankUsername}
                        onChange={(e) => setHackerrankUsername(e.target.value)}
                        className="bg-background/50 font-mono text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="setting-hackerearth" className="text-xs font-semibold flex items-center gap-2 text-foreground">
                        <div className="size-4 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[9px]">HE</div>
                        HackerEarth Handle / URL
                      </Label>
                      <Input
                        id="setting-hackerearth"
                        placeholder="e.g. he_user or https://hackerearth.com/@he_user"
                        value={hackerearthUsername}
                        onChange={(e) => setHackerearthUsername(e.target.value)}
                        className="bg-background/50 font-mono text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/40">
                    <Label htmlFor="setting-github-token" className="text-xs font-semibold flex items-center gap-2">
                      <PlatformBrandLogo platform="github" className="size-4" />
                      GitHub Personal Access Token (Optional - Increases Rate Limit)
                    </Label>
                    <Input
                      id="setting-github-token"
                      type="password"
                      placeholder="ghp_..."
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="bg-background/50 font-mono text-xs h-9"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={isSavingCoding} size="sm" className="rounded-xl font-bold text-xs px-5">
                      {isSavingCoding ? (
                        <>
                          <Loader2 className="size-3.5 mr-2 animate-spin" /> Saving Profiles...
                        </>
                      ) : (
                        "Save All Profiles"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </section>
          )}

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
