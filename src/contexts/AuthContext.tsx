import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "lecturer" | "admin";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  bio: string | null;
  student_id: string | null;
  program: string | null;
  year: string | null;
  department: string | null;
  gpa: number | null;
  credits_completed: number | null;
  credits_required: number | null;
  advisor: string | null;
  enrollment_date: string | null;
  expected_graduation: string | null;
  avatar_url: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  verified: boolean | null;
  email_notifications: boolean | null;
  push_notifications: boolean | null;
  sms_notifications: boolean | null;
  assignment_reminders: boolean | null;
  message_notifications: boolean | null; // Added
  grade_updates: boolean | null;
  course_announcements: boolean | null;
  weekly_digest: boolean | null;
  notifications_enabled: boolean | null;
  batch: string | null; // Added
  hod_name: string | null; // Added
  language: string | null;
  timezone: string | null;
  theme: string | null;
  sidebar_mode: 'expanded' | 'collapsed' | 'hover' | null;
  last_selected_class_id: string | null;
  active_call: {
    type: 'audio' | 'video';
    conversationId: string;
    isMeeting?: boolean;
    userName?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (selectedRole: AppRole) => Promise<{ success: boolean; error?: string }>;
  signInWithNotion: (selectedRole: AppRole) => Promise<{ success: boolean; error?: string }>;
  signInWithGitHub: (selectedRole: AppRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile | null;
  };

  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching role:", error);
      return null;
    }
    return data?.role as AppRole | null;
  };

  const refreshProfile = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (targetUserId) {
      const profileData = await fetchProfile(targetUserId);
      const userRole = await fetchRole(targetUserId);

      // Always update state when we have valid data
      if (userRole !== null) {
        setProfile(profileData);
        setRole(userRole);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
            fetchRole(session.user.id).then(setRole);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
        fetchRole(session.user.id).then(setRole);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: selectedRole,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { success: false, error: "This email is already registered. Please sign in instead." };
      }
      return { success: false, error: error.message };
    }

    // Trigger Welcome Email (Fire and forget, don't block registration)
    try {
      console.log("📧 Triggering welcome email...");

      supabase.functions.invoke("send-welcome-email", {
        body: {
          email,
          fullName,
          role: selectedRole,
        },
      }).then(({ data, error }) => {
        if (error) console.error("❌ Failed to send welcome email:", error);
        else console.log("✅ Welcome email request sent:", data);
      });
    } catch (err) {
      console.error("Error triggering email function:", err);
    }

    return { success: true };
  };

  const signInWithGoogle = async (selectedRole: AppRole) => {
    // Store the selected role in localStorage for use after OAuth callback
    localStorage.setItem("pendingRole", selectedRole);
    console.log("🔐 Storing role in localStorage for OAuth:", selectedRole);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      localStorage.removeItem("pendingRole");
      console.error("❌ OAuth initiation failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ OAuth initiated successfully, redirecting to Google...");
    return { success: true };
  };

  const signInWithNotion = async (selectedRole: AppRole) => {
    // Store the selected role in localStorage for use after OAuth callback
    localStorage.setItem("pendingRole", selectedRole);
    console.log("🔐 Storing role in localStorage for Notion OAuth:", selectedRole);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "notion",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      localStorage.removeItem("pendingRole");
      console.error("❌ Notion OAuth initiation failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ Notion OAuth initiated successfully, redirecting to Notion...");
    return { success: true };
  };

  const signInWithGitHub = async (selectedRole: AppRole) => {
    // Store the selected role in localStorage for use after OAuth callback
    localStorage.setItem("pendingRole", selectedRole);
    console.log("🔐 Storing role in localStorage for GitHub OAuth:", selectedRole);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${selectedRole}`,
        scopes: "user:email",
      },
    });

    if (error) {
      localStorage.removeItem("pendingRole");
      console.error("❌ GitHub OAuth initiation failed:", error.message);
      return { success: false, error: error.message };
    }

    console.log("✅ GitHub OAuth initiated successfully, redirecting to GitHub...");
    return { success: true };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("user_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Also sync to public_profiles table for sharing
    // Only pick fields that are safe/meant for public viewing
    const publicData = {
      user_id: user.id,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      program: data.program,
      year: data.year,
      department: data.department,
      gpa: data.gpa,
      credits_completed: data.credits_completed,
      credits_required: data.credits_required,
      expected_graduation: data.expected_graduation,
      email: data.email,
      phone: data.phone,
      city: data.city,
      country: data.country,
      last_updated: new Date().toISOString()
    };

    // Filter out undefined values to avoid overwriting with null if no change
    const filteredPublicData = Object.fromEntries(
      Object.entries(publicData).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(filteredPublicData).length > 1) { // More than just user_id
      await supabase
        .from("public_profiles")
        .upsert(filteredPublicData, { onConflict: 'user_id' });
    }

    await refreshProfile();
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithNotion,
        signInWithGitHub,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
