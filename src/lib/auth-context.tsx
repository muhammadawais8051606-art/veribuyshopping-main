import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "customer" | "seller" | "admin";
export type SellerTeamRole = "owner" | "operations";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  isAdminAllowlisted: boolean;
  isSuperAdmin: boolean;
  sellerScopeId: string | null;
  sellerTeamRole: SellerTeamRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVITY_KEY = "vb_last_activity";
const SUPER_ADMIN_EMAIL = "sunnykhan8053606@gmail.com";
const TEMP_BYPASS_EMAIL = "sunnykhan8053606@gmail.com";
const TEMP_BYPASS_USER_ID = "00000000-0000-0000-0000-000000000001";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isAdminAllowlisted, setIsAdminAllowlisted] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sellerScopeId, setSellerScopeId] = useState<string | null>(null);
  const [sellerTeamRole, setSellerTeamRole] = useState<SellerTeamRole | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const loadRoles = async (userId: string, email?: string | null) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const r = (data ?? []).map((x) => x.role as AppRole);
    const normalizedEmail = (email ?? "").trim().toLowerCase();
    const superAdmin = normalizedEmail === SUPER_ADMIN_EMAIL;
    setIsSuperAdmin(superAdmin);
    const effectiveRoles = superAdmin && !r.includes("admin") ? (["admin", ...r] as AppRole[]) : r;
    setRoles(effectiveRoles);
    setIsAdminAllowlisted(effectiveRoles.includes("admin"));
  };

  const loadSellerScope = async (userId: string) => {
    const { data: own } = await supabase.from("seller_profiles")
      .select("user_id, status").eq("user_id", userId).maybeSingle();
    if (own && own.status === "approved") {
      setSellerScopeId(userId); setSellerTeamRole("owner"); return;
    }
    const { data: tm } = await supabase.from("seller_team_members")
      .select("seller_owner_id, team_role").eq("member_user_id", userId).maybeSingle();
    if (tm) { setSellerScopeId(tm.seller_owner_id); setSellerTeamRole(tm.team_role as SellerTeamRole); }
    else { setSellerScopeId(null); setSellerTeamRole(null); }
  };

  // Idle logout (24h)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reset = () => {
      try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch {}
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => { supabase.auth.signOut(); }, IDLE_TIMEOUT_MS);
    };
    const onActivity = () => reset();
    if (user) {
      // honor saved last activity across reloads
      try {
        const last = Number(localStorage.getItem(ACTIVITY_KEY) || "0");
        if (last && Date.now() - last > IDLE_TIMEOUT_MS) {
          supabase.auth.signOut();
          return;
        }
      } catch {}
      reset();
      ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((e) =>
        window.addEventListener(e, onActivity, { passive: true })
      );
      return () => {
        if (idleTimer.current) clearTimeout(idleTimer.current);
        ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach((e) =>
          window.removeEventListener(e, onActivity)
        );
      };
    }
  }, [user]);

  useEffect(() => {
    isMounted.current = true;

    const syncAuthState = async (newSession: Session | null) => {
      if (!isMounted.current) return;
      setLoading(true);
      // TEMP BYPASS: if not logged in, treat user as logged in (UI-only)
      const bypassUser =
        !newSession?.user && typeof window !== "undefined"
          ? ({
              id: TEMP_BYPASS_USER_ID,
              email: TEMP_BYPASS_EMAIL,
              app_metadata: {},
              user_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
            } as unknown as User)
          : null;

      setSession(newSession);
      setUser(newSession?.user ?? bypassUser);

      const effectiveUser = newSession?.user ?? bypassUser;
      if (effectiveUser) {
        try {
          // TEMP BYPASS: force seller access so /seller/* is directly reachable
          if (effectiveUser.id === TEMP_BYPASS_USER_ID) {
            setSellerScopeId(TEMP_BYPASS_USER_ID);
            setSellerTeamRole("owner");
          }
          await Promise.all([
            loadRoles(effectiveUser.id, effectiveUser.email),
            effectiveUser.id === TEMP_BYPASS_USER_ID ? Promise.resolve() : loadSellerScope(effectiveUser.id),
          ]);
        } catch (error) {
          console.error("[Auth] Failed to load user access context", error);
          setRoles([]);
          setIsAdminAllowlisted(false);
          setIsSuperAdmin(false);
          setSellerScopeId(null);
          setSellerTeamRole(null);
        }
      } else {
        setRoles([]);
        setIsAdminAllowlisted(false);
        setIsSuperAdmin(false);
        setSellerScopeId(null);
        setSellerTeamRole(null);
      }

      if (isMounted.current) setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, newSession) => {
      void syncAuthState(newSession);
    });

    supabase.auth.getSession().then(({ data }) => {
      void syncAuthState(data.session);
    });

    return () => {
      isMounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };
  const signUp: AuthContextValue["signUp"] = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  };
  const signOut = async () => { try { localStorage.removeItem(ACTIVITY_KEY); } catch {} ; await supabase.auth.signOut(); };
  const refreshRoles = async () => { if (user) { await loadRoles(user.id, user.email); await loadSellerScope(user.id); } };

  return (
    <AuthContext.Provider value={{
      user, session, roles, isAdmin: roles.includes("admin"), isAdminAllowlisted,
      isSuperAdmin,
      sellerScopeId, sellerTeamRole, loading, signIn, signUp, signOut, refreshRoles,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
