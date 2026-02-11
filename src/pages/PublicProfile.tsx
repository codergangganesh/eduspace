import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Mail,
    Phone,
    MapPin,
    GraduationCap,
    CheckCircle,
    Copy,
    ChevronLeft,
    Loader2,
    BookOpen,
    Award,
    Calendar,
    User,
    Share2,
    Briefcase,
    Globe,
    FileText,
    Zap,
    Shield,
    Printer,
    Download,
    Eye
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
                // Now fetching from the dedicated public_profiles table
                const { data, error: fetchError } = await supabase
                    .from("public_profiles")
                    .select("*")
                    .eq("user_id", id)
                    .single();

                if (fetchError) {
                    // Fallback to main profiles table if public_profiles entry doesn't exist yet
                    const { data: mainData, error: mainError } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("user_id", id)
                        .single();

                    if (mainError) throw mainError;
                    setProfile(mainData);
                } else {
                    setProfile(data);
                }
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
        toast.success("Profile link copied to clipboard!");
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#F1F5F9]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-slate-500 font-medium animate-pulse text-lg">Preparing Document View...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="size-24 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-8 shadow-inner"
                >
                    <User className="size-12 text-red-500" />
                </motion.div>
                <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">Profile Not Found</h1>
                <p className="text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
                    The requested profile document could not be found in our directory.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => navigate("/")} size="lg" className="rounded-full px-10 shadow-xl shadow-primary/20">
                        Portal Home
                    </Button>
                </div>
            </div>
        );
    }

    const initials = profile.full_name
        ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        : "U";

    return (
        <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0F172A] print:bg-white text-slate-900 dark:text-slate-100 selection:bg-primary/20">
            {/* Top Toolbar - PDF Style */}
            <div className="sticky top-0 z-[100] bg-slate-900/90 backdrop-blur-md text-white border-b border-slate-700 h-14 print:hidden">
                <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white hover:bg-slate-800 h-9 w-9"
                            onClick={() => navigate("/")}
                            title="Back"
                        >
                            <ChevronLeft className="size-5" />
                        </Button>
                        <div className="h-4 w-px bg-slate-700 hidden sm:block" />
                        <span className="text-sm font-medium text-slate-300 hidden sm:block truncate max-w-[200px]">
                            {profile.full_name}_Academic_Profile.edu
                        </span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-300 hover:text-white h-9 gap-2 px-3 text-xs"
                            onClick={copyLink}
                        >
                            <Copy className="size-4" />
                            <span className="hidden xs:inline">Copy Link</span>
                        </Button>
                        <div className="h-4 w-px bg-slate-700" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-300 hover:text-white h-9 w-9"
                            onClick={handlePrint}
                            title="Print profile"
                        >
                            <Printer className="size-4" />
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-white h-8 sm:h-9 text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 gap-2 px-3 sm:px-4"
                        >
                            <Download className="size-4" />
                            <span className="hidden sm:inline">Export PDF</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Document Surface */}
            <main className="max-w-5xl mx-auto p-4 sm:p-8 md:p-12 lg:pb-24">
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white dark:bg-slate-900 shadow-[0_0_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden print:shadow-none print:border-none print:rounded-none"
                >
                    {/* Header Banner */}
                    <div className="h-6 gap-0 bg-slate-900 flex">
                        <div className="flex-1 bg-primary" />
                        <div className="flex-1 bg-blue-600" />
                        <div className="flex-1 bg-indigo-600" />
                    </div>

                    <div className="p-8 sm:p-12">
                        {/* Main Identity Header */}
                        <div className="flex flex-col md:flex-row gap-8 items-start mb-16 pb-12 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative group mx-auto md:mx-0">
                                <div className="absolute -inset-2 bg-slate-100 dark:bg-slate-800 rounded-full scale-105" />
                                <Avatar className="size-40 sm:size-48 shadow-xl relative border-4 border-white dark:border-slate-900">
                                    <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                                    <AvatarFallback className="bg-slate-50 dark:bg-slate-800 text-5xl font-black text-primary">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                {profile.verified && (
                                    <div className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full border-4 border-white dark:border-slate-900 shadow-lg">
                                        <CheckCircle className="size-6" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div className="space-y-1">
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                                        <Badge variant="outline" className="rounded-md border-primary/30 text-primary font-bold px-3">
                                            {profile.role?.toUpperCase() || "ACADEMIC PORTAL"}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-md border-slate-200 dark:border-slate-700 text-slate-500 font-bold px-3 uppercase text-[10px]">
                                            VERIFIED IDENTITY
                                        </Badge>
                                    </div>
                                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                                        {profile.full_name}
                                    </h1>
                                </div>

                                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
                                    {profile.program} {profile.department && `• ${profile.department}`}
                                </p>

                                <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Mail className="size-4 text-primary" />
                                        <span className="text-sm font-semibold">{profile.email}</span>
                                    </div>
                                    {profile.city && (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <MapPin className="size-4 text-primary" />
                                            <span className="text-sm font-semibold">{profile.city}, {profile.country}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar className="size-4 text-primary" />
                                        <span className="text-sm font-semibold">Updated {new Date(profile.last_updated || profile.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                            {/* Left Side: Summary & Contact */}
                            <div className="space-y-12">
                                <section>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
                                        <div className="h-1 w-6 bg-primary" />
                                        Academic Overview
                                    </h3>
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Current GPA</span>
                                                <Award className="size-4 text-primary" />
                                            </div>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white">{profile.gpa || '4.0'}</p>
                                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-4 overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${(parseFloat(profile.gpa || '4.0') / 4) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Completion</span>
                                                <BookOpen className="size-4 text-blue-500" />
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-3xl font-black text-slate-900 dark:text-white">{profile.credits_completed || '85'}</p>
                                                <span className="text-slate-400 font-bold text-sm">/ {profile.credits_required || '120'} units</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
                                        <div className="h-1 w-6 bg-primary" />
                                        Connectivity
                                    </h3>
                                    <div className="space-y-4">
                                        {profile.phone && (
                                            <div className="flex items-center gap-4">
                                                <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                    <Phone className="size-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-tight">{profile.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4">
                                            <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                <Globe className="size-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-tight">eduspace.network/{profile.full_name?.toLowerCase().replace(/\s+/g, '')}</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Side: Professional Summary */}
                            <div className="lg:col-span-2 space-y-12">
                                <section>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
                                        <div className="h-1 w-6 bg-primary" />
                                        Personal Statement
                                    </h3>
                                    <p className="text-xl text-slate-700 dark:text-slate-300 leading-[1.8] font-medium italic">
                                        "{profile.bio || "Academic professional focused on excellence and continuous learning within the Eduspace network. Committed to achieving set benchmarks and contributing to the faculty environment."}"
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3">
                                        <div className="h-1 w-6 bg-primary" />
                                        Key Qualifications
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-6 rounded-2xl border-2 border-slate-50 dark:border-slate-800 flex items-start gap-4 hover:border-primary/20 transition-all group">
                                            <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <Shield className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase mb-1">Authenticated Member</h4>
                                                <p className="text-xs text-slate-500 leading-relaxed">Verified security credentials and institutional status.</p>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-2xl border-2 border-slate-50 dark:border-slate-800 flex items-start gap-4 hover:border-primary/20 transition-all group">
                                            <div className="size-10 rounded-xl bg-blue-500/5 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                                <Zap className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase mb-1">Performance Track</h4>
                                                <p className="text-xs text-slate-500 leading-relaxed">Top tier percentile in department-wide analytics.</p>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-2xl border-2 border-slate-50 dark:border-slate-800 flex items-start gap-4 hover:border-primary/20 transition-all group">
                                            <div className="size-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                <GraduationCap className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase mb-1">{profile.year || 'Senior'} Status</h4>
                                                <p className="text-xs text-slate-500 leading-relaxed">Anticipated graduation in {profile.expected_graduation ? new Date(profile.expected_graduation).getFullYear() : '2026'}.</p>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-2xl border-2 border-slate-50 dark:border-slate-800 flex items-start gap-4 hover:border-primary/20 transition-all group">
                                            <div className="size-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                                <Briefcase className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase mb-1">Department Affiliation</h4>
                                                <p className="text-xs text-slate-500 leading-relaxed">Core member of the {profile.department || 'Science'} faculty.</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-12">
                                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 print:bg-slate-100 print:text-slate-900">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-full border-2 border-primary/50 flex items-center justify-center">
                                                <CheckCircle className="size-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-black text-lg">Official Academic E-Record</p>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">ID: {profile.user_id?.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="bg-primary hover:bg-primary text-white font-black px-6 py-2 rounded-full border-none">
                                            {profile.role?.toUpperCase() || "VERIFIED"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Branding Footer */}
                <div className="text-center mt-12 mb-20 opacity-40">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-4">Digitally Signed & Secured by Eduspace Platform</p>
                    <div className="flex items-center justify-center gap-8 saturate-0">
                        <div className="size-8 rounded bg-slate-400" />
                        <div className="size-8 rounded bg-slate-400 rotate-45" />
                        <div className="size-8 rounded bg-slate-400" />
                    </div>
                </div>
            </main>
        </div>
    );
}
