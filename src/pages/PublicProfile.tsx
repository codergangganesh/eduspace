import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Mail,
    Calendar,
    CheckCircle,
    Copy,
    ChevronLeft,
    Loader2,
    User,
    Globe,
    Shield,
    Printer,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";


export default function PublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            if (!id) return;
            try {
                setLoading(true);
                const { data: publicData, error: publicError } = await supabase
                    .from("public_profiles")
                    .select("*")
                    .eq("user_id", id)
                    .single();

                let finalData = publicData;

                // If public profile missing or missing avatar, try getting from main profiles
                if (publicError || !publicData?.avatar_url) {
                    const { data: mainData, error: mainError } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("user_id", id)
                        .single();

                    if (!mainError && mainData) {
                        if (!finalData) {
                            finalData = mainData;
                        } else {
                            // Merge missing avatar from main profile
                            finalData = {
                                ...finalData,
                                avatar_url: finalData.avatar_url || mainData.avatar_url,
                                full_name: finalData.full_name || mainData.full_name,
                                bio: finalData.bio || mainData.bio
                            };
                        }
                    }

                    // Explicit fallback: Check student_profiles for image if still missing
                    if (!finalData?.avatar_url) {
                        const { data: studentData } = await supabase
                            .from("student_profiles")
                            .select("profile_image")
                            .eq("user_id", id)
                            .maybeSingle();

                        if (studentData?.profile_image) {
                            if (!finalData) finalData = {}; // Initialize if null
                            finalData = {
                                ...finalData,
                                avatar_url: studentData.profile_image
                            };
                        }
                    }
                }

                setProfile(finalData);
            } catch (err: any) {
                console.error("Error fetching public profile:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [id]);

    const copyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        toast.success("Profile link copied!");
    };



    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#050b14]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <p className="text-slate-400 font-medium animate-pulse">Loading Profile...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#050b14] p-6 text-center text-white">
                <User className="size-16 text-slate-700 mb-6" />
                <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
                <Button onClick={() => navigate("/")} variant="outline" className="rounded-full mt-4 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                    Return to Portal
                </Button>
            </div>
        );
    }

    const initials = profile.full_name
        ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        : "U";

    return (
        <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#050b14] text-slate-900 dark:text-white font-sans selection:bg-blue-500/30 transition-colors duration-300 flex flex-col items-center">

            {/* Main Content - Centered */}
            <main className="flex-1 w-full max-w-md px-6 relative z-10 overflow-y-auto nav-scroll flex flex-col justify-center">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center pb-24 pt-8 bg-slate-50 dark:bg-[#050b14] text-slate-900 dark:text-white"
                >
                    {/* Academic Profile Header - Correct Position Above Image */}
                    <div className="mb-6 text-center">
                        <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase">Academic Profile</h2>
                    </div>

                    {/* Avatar with Glow */}
                    <div className="relative mb-4 md:mb-6 group">
                        <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <div className="relative">
                            <Avatar className="size-24 md:size-32 border-4 border-white dark:border-[#050b14] shadow-2xl">
                                <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-3xl font-bold text-blue-500">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            {profile.verified && (
                                <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-4 border-white dark:border-[#050b14]">
                                    <CheckCircle className="size-4" fill="currentColor" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 md:mb-3">
                        {profile.full_name}
                    </h1>

                    {/* Badges */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
                            Academic Portal
                        </Badge>
                        {profile.verified && (
                            <Badge className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Verified Identity
                            </Badge>
                        )}
                    </div>

                    {/* Info Row */}
                    <div className="flex flex-col items-center gap-1.5 md:gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8 md:mb-12 font-medium">
                        <div className="flex items-center gap-2">
                            <Mail className="size-4 text-blue-500" />
                            <span>{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-blue-500" />
                            <span>Updated {new Date(profile.updated_at || new Date()).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Personal Statement */}
                    {profile.bio && (
                        <div className="w-full text-left mb-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-1 w-6 bg-blue-600 rounded-full"></div>
                                <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-500 uppercase">Personal Statement</h3>
                            </div>
                            <p className="text-lg text-slate-600 dark:text-slate-200 italic font-medium leading-relaxed">
                                "{profile.bio}"
                            </p>
                        </div>
                    )}

                    {/* Connectivity */}
                    <div className="w-full text-left mb-12">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-1 w-6 bg-blue-600 rounded-full"></div>
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-500 uppercase">Connectivity</h3>
                        </div>

                        <div className="bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-blue-500/20 transition-all cursor-pointer shadow-sm dark:shadow-none" onClick={copyLink}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Globe className="size-5 text-slate-400 shrink-0" />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate tracking-tight">
                                    eduspace.network/{profile.full_name?.toLowerCase().replace(/\s+/g, '')}
                                </span>
                            </div>
                            <Copy className="size-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>

                    {/* Footer E-Record Card */}
                    <div className="w-full bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-xl shadow-slate-200/50 dark:shadow-blue-900/5 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-full border-2 border-blue-500/20 flex items-center justify-center bg-blue-500/5 text-blue-500">
                                <Shield className="size-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-1">Official Academic E-Record</p>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID: {id?.slice(0, 8).toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="bg-blue-600 text-[10px] font-black px-4 py-2 rounded-lg text-white shadow-lg shadow-blue-600/20 tracking-wider">
                            VERIFIED
                        </div>
                    </div>

                </motion.div>
            </main>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-6 z-20 w-full px-6 flex justify-center pointer-events-none">
                <Button
                    className="w-full max-w-sm bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-full py-6 shadow-2xl shadow-slate-900/20 transition-all active:scale-[0.98] pointer-events-auto border border-white/10"
                    onClick={() => window.print()}
                >
                    <Printer className="size-5 mr-3" />
                    <span className="font-bold tracking-wide text-sm uppercase">Print Profile</span>
                </Button>
            </div>

            {/* Nav Back Button (Top Left) */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-20 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-full"
                onClick={() => navigate('/')}
            >
                <ChevronLeft className="size-5" />
            </Button>
        </div>
    );
}
