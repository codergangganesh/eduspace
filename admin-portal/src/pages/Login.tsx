import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Lock, Mail, ArrowRight, AlertCircle, Loader2, KeyRound, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { signIn, user, isAdmin, isLoading: isAuthChecking } = useAdminAuth();
  const navigate = useNavigate();

  // If already authenticated as admin, navigate smoothly using React Router
  useEffect(() => {
    if (!isAuthChecking && user && isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isAdmin, isAuthChecking, navigate]);

  const handleFillCredentials = () => {
    setEmail("mannamganeshbabu8@gmail.com");
    setPassword("Ganeshbabu@123");
    toast.success("Administrator credentials applied!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg("");
      const res = await signIn(email.trim(), password);

      if (res.success) {
        toast.success("Welcome to the Eduspace Admin Portal!");
        navigate("/dashboard", { replace: true });
      } else {
        setErrorMsg(res.error || "Authentication failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md border-border/80 shadow-2xl bg-card/90 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto size-14 rounded-2xl overflow-hidden border border-border/80 shadow-xl shadow-primary/10 mb-3 group hover:scale-105 transition-transform duration-300">
            <img
              src="/favicon.png"
              alt="Eduspace Logo"
              loading="eager"
              className="size-full object-cover"
            />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight">Eduspace Admin</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Sign in with your administrative credentials to access platform controls.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-3">
            {/* Quick Fill Helper Card */}
            <div
              onClick={handleFillCredentials}
              className="flex items-center justify-between p-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1">
                    Admin Quick Fill
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    mannamganeshbabu8@gmail.com
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Auto Fill
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eduspace.edu"
                  className="pl-9 h-10 text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-9 h-10 text-sm font-mono"
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button
              type="submit"
              className="w-full h-10 font-semibold shadow-md shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying credentials...
                </>
              ) : (
                <>
                  Enter Admin Console <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-[11px] text-muted-foreground">
              <span>Looking for student or lecturer login? </span>
              <a
                href="http://localhost:8080"
                className="text-primary hover:underline font-semibold"
                target="_blank"
                rel="noreferrer"
              >
                Go to Eduspace Main App
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
