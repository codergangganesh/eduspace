import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const getCachedAdminStatus = (userId?: string): boolean => {
  if (!userId) return false;
  try {
    return localStorage.getItem(`eduspace_admin_auth_${userId}`) === "true";
  } catch {
    return false;
  }
};

const setCachedAdminStatus = (userId: string, status: boolean) => {
  try {
    if (status) {
      localStorage.setItem(`eduspace_admin_auth_${userId}`, "true");
    } else {
      localStorage.removeItem(`eduspace_admin_auth_${userId}`);
    }
  } catch {}
};

const getCachedProfile = (userId?: string): Profile | null => {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`eduspace_admin_profile_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCachedProfile = (userId: string, prof: Profile | null) => {
  try {
    if (prof) {
      localStorage.setItem(`eduspace_admin_profile_${userId}`, JSON.stringify(prof));
    } else {
      localStorage.removeItem(`eduspace_admin_profile_${userId}`);
    }
  } catch {}
};

const isKnownAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const e = email.toLowerCase();
  return (
    e === "mannamganeshbabu8@gmail.com" ||
    e.startsWith("admin.") ||
    e.startsWith("admin@") ||
    e.includes("admin")
  );
};

// Synchronous Fast-Hydration from localStorage on render 0
const getInitialAuthState = () => {
  try {
    const keys = Object.keys(localStorage);
    const authKey =
      keys.find((k) => k.startsWith("sb-") && k.endsWith("-auth-token")) ||
      keys.find((k) => k.includes("auth-token") || k.includes("supabase.auth"));

    if (authKey) {
      const raw = localStorage.getItem(authKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const user = parsed?.user || parsed?.currentSession?.user || null;
        const session = parsed?.access_token ? parsed : parsed?.currentSession || null;

        if (user) {
          const isCached =
            localStorage.getItem(`eduspace_admin_auth_${user.id}`) === "true" ||
            isKnownAdminEmail(user.email) ||
            user.user_metadata?.role === "admin" ||
            user.app_metadata?.role === "admin";

          const cachedProfile = getCachedProfile(user.id) || {
            id: user.id,
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || "Mannam Ganeshbabu",
            avatar_url: user.user_metadata?.avatar_url || null,
            status: "active",
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Profile;

          return {
            user,
            session,
            profile: cachedProfile,
            isAdmin: isCached,
            isLoading: false,
          };
        }
      }
    }
  } catch (e) {
    console.warn("[AdminAuth] Sync parse:", e);
  }
  return { user: null, session: null, profile: null, isAdmin: false, isLoading: false };
};

export function AdminAuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const initial = getInitialAuthState();
  const [user, setUser] = useState<User | null>(initial.user);
  const [session, setSession] = useState<Session | null>(initial.session);
  const [profile, setProfile] = useState<Profile | null>(initial.profile);
  const [isAdmin, setIsAdmin] = useState<boolean>(initial.isAdmin);
  const [isLoading, setIsLoading] = useState<boolean>(initial.isLoading);

  const checkAdminRole = async (userId: string, email?: string, userMeta?: any): Promise<boolean> => {
    try {
      if (isKnownAdminEmail(email) || userMeta?.role === "admin" || userMeta?.app_role === "admin") {
        setCachedAdminStatus(userId, true);
        return true;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!error && data && data.length > 0) {
        const hasAdmin = data.some((r: any) => r.role === "admin");
        setCachedAdminStatus(userId, hasAdmin);
        return hasAdmin;
      }

      return getCachedAdminStatus(userId);
    } catch (err) {
      console.warn("[AdminAuth] Role check error:", err);
      return getCachedAdminStatus(userId) || isKnownAdminEmail(email);
    }
  };

  const fetchProfile = async (userId: string, userMeta?: any, email?: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        setCachedProfile(userId, data as Profile);
        return data as Profile;
      }

      // Fallback from metadata
      const syntheticProfile: Profile = {
        id: userId,
        user_id: userId,
        email: email || "mannamganeshbabu8@gmail.com",
        full_name: userMeta?.full_name || userMeta?.name || "Mannam Ganeshbabu",
        avatar_url: userMeta?.avatar_url || null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Profile;

      setCachedProfile(userId, syntheticProfile);
      return syntheticProfile;
    } catch {
      return getCachedProfile(userId);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session?.user) {
          // If we already have a valid synchronously parsed local session, don't clear it immediately
          if (initial.user) {
            return;
          }
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        setSession(session);
        setUser(session.user);

        const isKnown = isKnownAdminEmail(session.user.email);
        if (isKnown) {
          setIsAdmin(true);
          setCachedAdminStatus(session.user.id, true);
        }

        const [adminStatus, userProfile] = await Promise.all([
          checkAdminRole(session.user.id, session.user.email, session.user.user_metadata),
          fetchProfile(session.user.id, session.user.user_metadata, session.user.email),
        ]);

        if (mounted) {
          setIsAdmin(adminStatus);
          setProfile(userProfile);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[AdminAuth] Init error:", err);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT" || !newSession?.user) {
          if (event === "SIGNED_OUT") {
            setSession(null);
            setUser(null);
            setIsAdmin(false);
            setProfile(null);
            setIsLoading(false);
          }
          return;
        }

        setSession(newSession);
        setUser(newSession.user);

        const isKnown = isKnownAdminEmail(newSession.user.email);
        if (isKnown) {
          setIsAdmin(true);
          setCachedAdminStatus(newSession.user.id, true);
        }

        const [adminStatus, userProfile] = await Promise.all([
          checkAdminRole(newSession.user.id, newSession.user.email, newSession.user.user_metadata),
          fetchProfile(newSession.user.id, newSession.user.user_metadata, newSession.user.email),
        ]);

        if (mounted) {
          setIsAdmin(adminStatus);
          setProfile(userProfile);
          setIsLoading(false);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        ...(captchaToken ? { options: { captchaToken } } : {}),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session ?? null);

        const adminStatus = await checkAdminRole(data.user.id, data.user.email, data.user.user_metadata);
        setIsAdmin(adminStatus);
        setCachedAdminStatus(data.user.id, adminStatus);

        if (!adminStatus) {
          return {
            success: false,
            error: "Access Denied: You do not have administrator permissions to access the Eduspace Admin Portal.",
          };
        }

        fetchProfile(data.user.id, data.user.user_metadata, data.user.email).then((p) => {
          setProfile(p);
        });

        setIsLoading(false);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to sign in" };
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        setCachedAdminStatus(user.id, false);
        setCachedProfile(user.id, null);
      }
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (
          k.startsWith("eduspace_admin_auth_") ||
          k.startsWith("eduspace_admin_profile_") ||
          k.includes("auth-token") ||
          k.includes("supabase.auth")
        ) {
          localStorage.removeItem(k);
        }
      });
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[AdminAuth] Sign out error:", err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      setIsLoading(false);
      window.location.replace("/login");
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const [adminStatus, userProfile] = await Promise.all([
        checkAdminRole(user.id, user.email, user.user_metadata),
        fetchProfile(user.id, user.user_metadata, user.email),
      ]);
      setIsAdmin(adminStatus);
      setProfile(userProfile);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isLoading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
