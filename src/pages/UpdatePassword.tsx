import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { BackgroundDecoration } from "@/components/auth/BackgroundDecoration";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function UpdatePassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                title: "Passwords Don't Match",
                description: "Please make sure both passwords are the same",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Password Too Short",
                description: "Password must be at least 6 characters long",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                throw error;
            }

            setIsSuccess(true);
            toast({
                title: "Password Updated",
                description: "Your password has been successfully updated",
            });

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 2000);
        } catch (error: any) {
            console.error("Password update error:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update password. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex flex-col overflow-x-hidden">
                <AuthHeader />
                <main className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
                    <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">
                        <div className="bg-surface rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-none border border-border p-6 sm:p-8 flex flex-col items-center gap-6 text-center animate-fade-in">
                            <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h2 className="text-foreground text-2xl font-bold">Password Updated!</h2>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Your password has been successfully updated. Redirecting to login...
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
                <BackgroundDecoration />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden">
            <AuthHeader />

            <main className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">
                    {/* Page Heading */}
                    <div className="flex flex-col gap-2 text-center sm:text-left animate-fade-in">
                        <h1 className="text-foreground text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                            Update Password
                        </h1>
                        <p className="text-muted-foreground text-base font-normal leading-normal">
                            Enter your new password below
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-surface rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-none border border-border p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            {/* New Password Field */}
                            <label className="flex flex-col gap-2">
                                <span className="text-foreground text-sm font-medium leading-normal">
                                    New Password
                                </span>
                                <div className="relative flex items-center">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pr-20"
                                        disabled={isLoading}
                                        required
                                    />
                                    <div className="absolute right-3 flex items-center gap-2">
                                        <Lock className="size-5 text-muted-foreground" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-5" />
                                            ) : (
                                                <Eye className="size-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </label>

                            {/* Confirm Password Field */}
                            <label className="flex flex-col gap-2">
                                <span className="text-foreground text-sm font-medium leading-normal">
                                    Confirm Password
                                </span>
                                <div className="relative flex items-center">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pr-20"
                                        disabled={isLoading}
                                        required
                                    />
                                    <div className="absolute right-3 flex items-center gap-2">
                                        <Lock className="size-5 text-muted-foreground" />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="size-5" />
                                            ) : (
                                                <Eye className="size-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </label>

                            {/* Submit Button */}
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="size-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </main>

            <BackgroundDecoration />
        </div>
    );
}
