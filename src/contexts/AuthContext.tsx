import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearRegisteredCaches } from "@/lib/cacheRegistry";
import {
  clearCachedProfileIdentity,
  preloadImage,
  writeCachedProfileIdentity,
} from "@/lib/imagePerformance";

export type AppRole = "student" | "lecturer" | "admin";
type SelectableRole = Exclude<AppRole, "admin">;

const normalizeSelectableRole = (role: AppRole | string | null | undefined): SelectableRole =>
  role === "lecturer" ? "lecturer" : "student";

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
  cover_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  portfolio_url: string | null;
  leetcode_url?: string | null;
  codeforces_url?: string | null;
  leetcode_username?: string | null;
  codeforces_handle?: string | null;
  hackerrank_url?: string | null;
  codechef_url?: string | null;
  codewars_url?: string | null;
  geeksforgeeks_url?: string | null;
  atcoder_url?: string | null;
  codechef_username?: string | null;
  codewars_username?: string | null;
  geeksforgeeks_username?: string | null;
  atcoder_username?: string | null;
  kaggle_url?: string | null;
  codolio_url?: string | null;
  voice_bio_url?: string | null;
  voice_bio_transcript?: string | null;
  voice_bio_tags?: string[] | null;
  role?: string | null;
  verified: boolean | null;
  fcm_token: string | null; // Added
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
  has_seen_guide: boolean | null;
  active_call: {
    type: 'audio' | 'video';
    conversationId: string;
    isMeeting?: boolean;
    userName?: string;
  } | null;
  last_feedback_prompt_at: string | null;
  tour_current_step: number | null;
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
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, role: AppRole, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (selectedRole: AppRole) => Promise<{ success: boolean; error?: string }>;
  signInWithNotion: (selectedRole: AppRole) => Promise<{ success: boolean; error?: string }>;
  signInWithGitHub: (selectedRole: AppRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: (userId?: string) => Promise<void>;
  resetPassword: (email: string, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithRetry = async <T,>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(fn, retries - 1, delay * 1.5);
      }
      throw err;
    }
  };

  const fetchProfile = async (userId: string) => {
    return fetchWithRetry(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        // Handle common network errors silently
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          console.warn("Network issue while fetching profile, will retry implicitly.");
          return null;
        }
        console.error("Error fetching profile:", error);
        return null;
      }

      // Initialize has_seen_guide to false if it's null (for new users)
      if (data && (data as any).has_seen_guide === null) {
        // Update in background without blocking
        (supabase as any)
          .from("profiles")
          .update({ has_seen_guide: false })
          .eq("user_id", userId)
          .then(({ error }: { error: any }) => {
            if (error) console.warn("Failed to initialize has_seen_guide:", error);
            else console.log("✅ Initialized has_seen_guide to false for user:", userId);
          });
        // Return data with has_seen_guide set to false for immediate use
        return { ...(data as any), has_seen_guide: false } as Profile;
      }

      const profileData = data as any as Profile | null;
      if (profileData?.user_id) {
        const storedVoiceBio = JSON.parse(localStorage.getItem(`eduspace_voice_bio_${profileData.user_id}`) || '{}');
        const storedSocial = JSON.parse(localStorage.getItem(`eduspace_social_extra_${profileData.user_id}`) || '{}');

        // Fetch extra social links from Supabase user_coding_profiles database table
        let dbSocial: Record<string, any> = {};
        try {
          const { data: codingProf } = await (supabase as any)
            .from("user_coding_profiles")
            .select("overall_data")
            .eq("user_id", profileData.user_id)
            .maybeSingle();

          if (codingProf?.overall_data?.social_links) {
            dbSocial = codingProf.overall_data.social_links;
          }
        } catch (e) {
          console.warn("Could not load social links from Supabase DB:", e);
        }

        const mergedSocial = { ...storedSocial, ...dbSocial };

        if (storedVoiceBio) {
          profileData.voice_bio_url = storedVoiceBio.voice_bio_url ?? profileData.voice_bio_url ?? null;
          profileData.voice_bio_transcript = storedVoiceBio.voice_bio_transcript ?? profileData.voice_bio_transcript ?? null;
          profileData.voice_bio_tags = storedVoiceBio.voice_bio_tags ?? profileData.voice_bio_tags ?? [];
        }

        profileData.leetcode_url = mergedSocial.leetcode_url ?? profileData.leetcode_url ?? null;
        profileData.codeforces_url = mergedSocial.codeforces_url ?? profileData.codeforces_url ?? null;
        profileData.leetcode_username = mergedSocial.leetcode_username ?? profileData.leetcode_username ?? null;
        profileData.codeforces_handle = mergedSocial.codeforces_handle ?? profileData.codeforces_handle ?? null;
        profileData.hackerrank_url = mergedSocial.hackerrank_url ?? profileData.hackerrank_url ?? null;
        profileData.hackerrank_username = mergedSocial.hackerrank_username ?? profileData.hackerrank_username ?? null;
        profileData.hackerearth_url = mergedSocial.hackerearth_url ?? profileData.hackerearth_url ?? null;
        profileData.hackerearth_username = mergedSocial.hackerearth_username ?? profileData.hackerearth_username ?? null;
        profileData.codechef_url = mergedSocial.codechef_url ?? profileData.codechef_url ?? null;
        profileData.codewars_url = mergedSocial.codewars_url ?? profileData.codewars_url ?? null;
        profileData.geeksforgeeks_url = mergedSocial.geeksforgeeks_url ?? profileData.geeksforgeeks_url ?? null;
        profileData.atcoder_url = mergedSocial.atcoder_url ?? profileData.atcoder_url ?? null;
        profileData.codechef_username = mergedSocial.codechef_username ?? profileData.codechef_username ?? null;
        profileData.codewars_username = mergedSocial.codewars_username ?? profileData.codewars_username ?? null;
        profileData.geeksforgeeks_username = mergedSocial.geeksforgeeks_username ?? profileData.geeksforgeeks_username ?? null;
        profileData.atcoder_username = mergedSocial.atcoder_username ?? profileData.atcoder_username ?? null;
        profileData.kaggle_url = mergedSocial.kaggle_url ?? profileData.kaggle_url ?? null;
        profileData.codolio_url = mergedSocial.codolio_url ?? profileData.codolio_url ?? null;
      }

      if (profileData?.avatar_url) {
        void preloadImage(profileData.avatar_url, "high");
      }
      if (profileData?.user_id) {
        writeCachedProfileIdentity({
          userId: profileData.user_id,
          avatarUrl: profileData.avatar_url,
          fullName: profileData.full_name,
          email: profileData.email,
          updatedAt: profileData.updated_at,
        });
      }

      return profileData;
    }).catch(err => {
      if (err.message?.includes('INTERNET_DISCONNECTED') || err.message?.includes('NETWORK_CHANGED')) {
        return null; // Silent failure for connectivity issues
      }
      console.error("Persistent error fetching profile:", err);
      return null;
    });
  };

  const fetchRole = async (userId: string) => {
    return fetchWithRetry(async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .returns<Array<{ role: AppRole }>>();

      if (error) {
        // Handle common network errors silently
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          console.warn("Network issue while fetching role, will retry implicitly.");
          return null;
        }
        console.error("Error fetching role:", error);
        return null;
      }
      if (!data || data.length === 0) return null;
      if (data.length === 1) return data[0].role;

      // Defensive precedence if multiple role rows exist for a user.
      if (data.some(r => r.role === "admin")) return "admin";
      if (data.some(r => r.role === "lecturer")) return "lecturer";
      return "student";
    }).catch(err => {
      if (err.message?.includes('INTERNET_DISCONNECTED') || err.message?.includes('NETWORK_CHANGED')) {
        return null; // Silent failure for connectivity issues
      }
      console.error("Persistent error fetching role:", err);
      return null;
    });
  };

  const refreshProfile = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (targetUserId) {
      const [profileData, userRole] = await Promise.all([
        fetchProfile(targetUserId),
        fetchRole(targetUserId)
      ]);

      // Always update state when we have valid data
      if (userRole !== null) {
        setProfile(profileData);
        setRole(userRole);
      }
    }
  };

  // Removed unnecessary useEffect that was setting loading to false

  useEffect(() => {
    let mounted = true;
    let isInitialLoadComplete = false;

    // Set loading true initially for first load only
    setIsLoading(true);

    // 1. Define initialization logic
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            // Wait for profile and role on initial load to prevent flickering
            await Promise.all([
              fetchProfile(session.user.id).then(d => mounted && setProfile(d)),
              fetchRole(session.user.id).then(d => mounted && setRole(d))
            ]);
          } else {
            console.log("No active session found during initialization.");
          }
        }

        isInitialLoadComplete = true;
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        // Only set loading false after initial auth data is ready
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // 2. Run initialization
    initializeAuth();

    // 3. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log("Auth state change:", event);

        // Skip loading state update if initial load hasn't completed yet
        if (!isInitialLoadComplete) {
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch in background without showing loading state for subsequent auth changes
          Promise.all([
            fetchProfile(session.user.id).then(d => mounted && setProfile(d)),
            fetchRole(session.user.id).then(d => mounted && setRole(d))
          ]);
        } else {
          setProfile(null);
          setRole(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Sign in exception:", error);
      return { success: false, error: error.message || "Network error. Please check your connection and try again." };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole, captchaToken?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const safeRole = normalizeSelectableRole(selectedRole);

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          captchaToken,
          data: {
            full_name: fullName,
            role: safeRole,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return { success: false, error: "This email is already registered. Please sign in instead." };
        }
        return { success: false, error: error.message };
      }

      // If a session was automatically created (automatic login), sign out
      // standardizing the flow to force manual login for security
      if (signUpData?.session) {
        console.log("🔐 Registered and session created, signing out to force manual login...");
        await supabase.auth.signOut();
      }

      // Trigger Welcome Email (Fire and forget, don't block registration)
      try {
        console.log("📧 Triggering welcome email...");

        supabase.functions.invoke("send-welcome-email", {
          body: {
            email,
            fullName,
            role: safeRole,
          },
        }).then(({ data, error }) => {
          if (error) console.error("❌ Failed to send welcome email:", error);
          else console.log("✅ Welcome email request sent:", data);
        }).catch(err => {
          console.error("❌ Network error triggering welcome email:", err);
        });
      } catch (err) {
        console.error("Error triggering email function:", err);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Sign up exception:", error);
      return { success: false, error: error.message || "Network error. Please check your connection." };
    }
  };

  const signInWithGoogle = async (selectedRole: AppRole) => {
    try {
      const safeRole = normalizeSelectableRole(selectedRole);
      // Store the selected role in localStorage for use after OAuth callback
      localStorage.setItem("pendingRole", safeRole);
      console.log("🔐 Storing role in localStorage for OAuth:", safeRole);

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
    } catch (error: any) {
      return { success: false, error: error.message || "Network error. Please check your connection." };
    }
  };

  const signInWithNotion = async (selectedRole: AppRole) => {
    try {
      const safeRole = normalizeSelectableRole(selectedRole);
      // Store the selected role in localStorage for use after OAuth callback
      localStorage.setItem("pendingRole", safeRole);
      console.log("🔐 Storing role in localStorage for Notion OAuth:", safeRole);

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
    } catch (error: any) {
      return { success: false, error: error.message || "Network error." };
    }
  };

  const signInWithGitHub = async (selectedRole: AppRole) => {
    try {
      const safeRole = normalizeSelectableRole(selectedRole);
      // Store the selected role in localStorage for use after OAuth callback
      localStorage.setItem("pendingRole", safeRole);
      console.log("🔐 Storing role in localStorage for GitHub OAuth:", safeRole);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${safeRole}`,
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
    } catch (error: any) {
      return { success: false, error: error.message || "Network error." };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      clearRegisteredCaches();
      clearCachedProfileIdentity();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
    }
  };

  const resetPassword = async (email: string, captchaToken?: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
        captchaToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Network error." };
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Separate non-DB fields (voice_bio and social_coding) to prevent schema cache errors
      const {
        voice_bio_url,
        voice_bio_transcript,
        voice_bio_tags,
        leetcode_url,
        codeforces_url,
        leetcode_username,
        codeforces_handle,
        hackerrank_url,
        hackerrank_username,
        hackerearth_url,
        hackerearth_username,
        codechef_url,
        codewars_url,
        geeksforgeeks_url,
        atcoder_url,
        codechef_username,
        codewars_username,
        geeksforgeeks_username,
        atcoder_username,
        kaggle_url,
        codolio_url,
        ...dbData
      } = data as any;

      const storedSocial = JSON.parse(localStorage.getItem(`eduspace_social_extra_${user.id}`) || '{}');
      const updatedSocial = {
        leetcode_url: leetcode_url !== undefined ? leetcode_url : storedSocial.leetcode_url,
        codeforces_url: codeforces_url !== undefined ? codeforces_url : storedSocial.codeforces_url,
        leetcode_username: leetcode_username !== undefined ? leetcode_username : storedSocial.leetcode_username,
        codeforces_handle: codeforces_handle !== undefined ? codeforces_handle : storedSocial.codeforces_handle,
        hackerrank_url: hackerrank_url !== undefined ? hackerrank_url : storedSocial.hackerrank_url,
        hackerrank_username: hackerrank_username !== undefined ? hackerrank_username : storedSocial.hackerrank_username,
        hackerearth_url: hackerearth_url !== undefined ? hackerearth_url : storedSocial.hackerearth_url,
        hackerearth_username: hackerearth_username !== undefined ? hackerearth_username : storedSocial.hackerearth_username,
        codechef_url: codechef_url !== undefined ? codechef_url : storedSocial.codechef_url,
        codewars_url: codewars_url !== undefined ? codewars_url : storedSocial.codewars_url,
        geeksforgeeks_url: geeksforgeeks_url !== undefined ? geeksforgeeks_url : storedSocial.geeksforgeeks_url,
        atcoder_url: atcoder_url !== undefined ? atcoder_url : storedSocial.atcoder_url,
        codechef_username: codechef_username !== undefined ? codechef_username : storedSocial.codechef_username,
        codewars_username: codewars_username !== undefined ? codewars_username : storedSocial.codewars_username,
        geeksforgeeks_username: geeksforgeeks_username !== undefined ? geeksforgeeks_username : storedSocial.geeksforgeeks_username,
        atcoder_username: atcoder_username !== undefined ? atcoder_username : storedSocial.atcoder_username,
        kaggle_url: kaggle_url !== undefined ? kaggle_url : storedSocial.kaggle_url,
        codolio_url: codolio_url !== undefined ? codolio_url : storedSocial.codolio_url,
      };
      localStorage.setItem(`eduspace_social_extra_${user.id}`, JSON.stringify(updatedSocial));

      // Persist extra social links to Supabase database so they sync cross-device!
      try {
        const { data: existingCodingProf } = await (supabase as any)
          .from("user_coding_profiles")
          .select("overall_data")
          .eq("user_id", user.id)
          .maybeSingle();

        const existingOverall = existingCodingProf?.overall_data || {};
        const updatedOverall = {
          ...existingOverall,
          social_links: updatedSocial,
        };

        await (supabase as any).from("user_coding_profiles").upsert(
          {
            user_id: user.id,
            overall_data: updatedOverall,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      } catch (e) {
        console.warn("Could not persist social links to Supabase DB:", e);
      }

      if (voice_bio_url !== undefined || voice_bio_transcript !== undefined || voice_bio_tags !== undefined) {
        const storedVoiceBio = JSON.parse(localStorage.getItem(`eduspace_voice_bio_${user.id}`) || '{}');
        const updatedVoiceBio = {
          voice_bio_url: voice_bio_url !== undefined ? voice_bio_url : storedVoiceBio.voice_bio_url,
          voice_bio_transcript: voice_bio_transcript !== undefined ? voice_bio_transcript : storedVoiceBio.voice_bio_transcript,
          voice_bio_tags: voice_bio_tags !== undefined ? voice_bio_tags : storedVoiceBio.voice_bio_tags,
        };
        localStorage.setItem(`eduspace_voice_bio_${user.id}`, JSON.stringify(updatedVoiceBio));
      }

      setProfile((prev) => (prev ? { ...prev, ...data, ...updatedSocial } : null));

      if (Object.keys(dbData).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(dbData)
          .eq("user_id", user.id);

        if (error) {
          return { success: false, error: error.message };
        }
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
        cover_url: data.cover_url,
        linkedin_url: data.linkedin_url,
        github_url: data.github_url,
        twitter_url: data.twitter_url,
        portfolio_url: data.portfolio_url,
        last_updated: new Date().toISOString()
      };

      // Filter out undefined values to avoid overwriting with null if no change
      const filteredPublicData = Object.fromEntries(
        Object.entries(publicData).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(filteredPublicData).length > 1) { // More than just user_id
        await supabase
          .from("public_profiles")
          .upsert(filteredPublicData as any, { onConflict: 'user_id' });

      }

      await refreshProfile();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Network error. Failed to update profile." };
    }
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
        resetPassword,
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
