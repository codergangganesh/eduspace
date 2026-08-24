import * as React from "react";
import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode, ReactElement } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const isKnownAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return (
    e === "mannamganeshbabu8@gmail.com" ||
    e.startsWith("admin.") ||
    e.startsWith("admin@") ||
    e.includes("admin")
  );
};

/** Wrap a promise with a timeout — resolves to fallback if the promise doesn't settle in time */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export function AdminAuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const mountedRef = useRef(true);

  const makeSyntheticProfile = useCallback((userId: string, email?: string, userMeta?: any): Profile => {
    const cachedAvatar = localStorage.getItem("eduspace_admin_avatar") || localStorage.getItem(`admin_avatar_${userId}`) || null;
    const cachedBanner = localStorage.getItem("eduspace_admin_banner") || localStorage.getItem(`admin_banner_${userId}`) || null;
    return {
      id: userId,
      user_id: userId,
      email: email || userMeta?.email || "",
      full_name: userMeta?.full_name || userMeta?.name || (email ? email.split("@")[0] : "Administrator"),
      avatar_url: userMeta?.avatar_url || cachedAvatar || null,
      cover_url: userMeta?.cover_url || cachedBanner || null,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile;
  }, []);

  const checkAdminRole = useCallback(async (userId: string, email?: string, userMeta?: any): Promise<boolean> => {
    // Fast-path: known admin email or metadata — no DB query needed
    if (userMeta?.role === "admin" || userMeta?.app_role === "admin" || isKnownAdminEmail(email)) {
      return true;
    }

    try {
      const [rolesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("role").or(`user_id.eq.${userId},id.eq.${userId}`).maybeSingle(),
      ]);

      const hasAdminRole =
        (rolesRes.data && rolesRes.data.some((r: any) => r.role === "admin")) ||
        profileRes.data?.role === "admin";

      return Boolean(hasAdminRole || isKnownAdminEmail(email));
    } catch (err) {
      console.warn("[AdminAuth] Role check error:", err);
      return isKnownAdminEmail(email);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, userMeta?: any, email?: string): Promise<Profile> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`user_id.eq.${userId},id.eq.${userId}`)
        .maybeSingle();

      if (!error && data) {
        return data as Profile;
      }
    } catch {
      // fall through
    }
    return makeSyntheticProfile(userId, email, userMeta);
  }, [makeSyntheticProfile]);

  useEffect(() => {
    mountedRef.current = true;

    const initAuth = async () => {
      try {
        // Step 1: Get current session — this is fast and reliable
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        // Step 2: If no session, immediately show login — no DB queries needed
        if (!currentSession?.user) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // Step 3: Session exists — set user immediately so we're not stuck
        const authUser = currentSession.user;
        setSession(currentSession);
        setUser(authUser);

        // Step 4: Determine admin status — use fast path first, DB query with timeout
        const fastAdmin = isKnownAdminEmail(authUser.email) ||
          authUser.user_metadata?.role === "admin" ||
          authUser.user_metadata?.app_role === "admin";

        if (fastAdmin) {
          // Known admin — show dashboard immediately, fetch profile in background
          setIsAdmin(true);
          setProfile(makeSyntheticProfile(authUser.id, authUser.email, authUser.user_metadata));
          setIsLoading(false);

          // Enrich profile in background (non-blocking)
          fetchProfile(authUser.id, authUser.user_metadata, authUser.email).then((p) => {
            if (mountedRef.current) setProfile(p);
          }).catch(() => { });
        } else {
          // Unknown email — need DB check, but with a 3-second timeout
          const adminStatus = await withTimeout(
            checkAdminRole(authUser.id, authUser.email, authUser.user_metadata),
            3000,
            false
          );
          const userProfile = await withTimeout(
            fetchProfile(authUser.id, authUser.user_metadata, authUser.email),
            3000,
            makeSyntheticProfile(authUser.id, authUser.email, authUser.user_metadata)
          );

          if (mountedRef.current) {
            setIsAdmin(adminStatus);
            setProfile(userProfile);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error("[AdminAuth] Init error:", err);
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for future auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mountedRef.current) return;

        if (event === "SIGNED_OUT" || !newSession?.user) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setSession(newSession);
          setUser(newSession.user);

          const adminStatus = await withTimeout(
            checkAdminRole(newSession.user.id, newSession.user.email, newSession.user.user_metadata),
            3000,
            isKnownAdminEmail(newSession.user.email)
          );
          const userProfile = await withTimeout(
            fetchProfile(newSession.user.id, newSession.user.user_metadata, newSession.user.email),
            3000,
            makeSyntheticProfile(newSession.user.id, newSession.user.email, newSession.user.user_metadata)
          );

          if (mountedRef.current) {
            setIsAdmin(adminStatus);
            setProfile(userProfile);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [checkAdminRole, fetchProfile, makeSyntheticProfile]);

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        ...(captchaToken ? { options: { captchaToken } } : {}),
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session ?? null);

        const adminStatus = await withTimeout(
          checkAdminRole(data.user.id, data.user.email, data.user.user_metadata),
          3000,
          isKnownAdminEmail(data.user.email)
        );
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          setIsLoading(false);
          return {
            success: false,
            error: "Access Denied: You do not have administrator permissions to access the Eduspace Admin Portal.",
          };
        }

        const userProfile = await withTimeout(
          fetchProfile(data.user.id, data.user.user_metadata, data.user.email),
          3000,
          makeSyntheticProfile(data.user.id, data.user.email, data.user.user_metadata)
        );
        setProfile(userProfile);
        setIsLoading(false);
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Failed to sign in" };
    }
  };

  const signOut = async () => {
    try {
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
        withTimeout(checkAdminRole(user.id, user.email, user.user_metadata), 3000, isAdmin),
        withTimeout(fetchProfile(user.id, user.user_metadata, user.email), 3000, profile!),
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
