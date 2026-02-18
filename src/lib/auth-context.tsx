"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { UserRole } from "./store";
import { supabase } from "./supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { getProfile, saveUser, logActivity } from "./db";

import { getGravatarUrl } from "./gravatar";

interface AuthContextType {
  user: SupabaseUser | null;
  currentRole: UserRole;
  userName: string;
  email: string;
  mustChangePassword: boolean;
  isNewUser: boolean;
  gravatarEmail: string;
  gravatarUrl: string | null;
  costCenter?: string;
  lockPin?: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateEmail: (email: string) => Promise<{ error?: Error }>;
  updatePassword: (password: string) => Promise<{ error?: Error }>;
  updateProfileData: (data: { name?: string; gravatar_email?: string; is_new_user?: boolean }) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("gestor");
  const [costCenter, setCostCenter] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState("Carregando...");
  const [email, setEmail] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [gravatarEmail, setGravatarEmail] = useState("");
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
  const [lockPin, setLockPin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use a ref to track the current user ID to avoid stale closures in the useEffect
  const userIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        // Only fetch profile if it's a sign in or initial session
        // Check if we are already authenticated with the same user to avoid blocking UI
        const isSameUser = userIdRef.current === session.user.id;

        if (event === "SIGNED_IN" && !isSameUser) {
          setIsLoading(true);
        }

        if (event === "PASSWORD_RECOVERY") {
          // Redirect to change password page when recovery link is clicked
          // Note: You might need to import useRouter from next/navigation and use it here
          // But since this is inside useEffect, we can't easily use the hook's router instance if not passed.
          // We will use window.location as a fallback or assume the app handles it.
          // Better: Use a reliable redirect.
          window.location.href = "/change-password";
        }

        if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || event === "PASSWORD_RECOVERY") {
          const profile = await fetchProfile(session.user.id);

          if (event === "SIGNED_IN" && profile) {
            await logActivity(
              "LOGIN",
              "SESSAO",
              `O usuário ${profile.name} realizou login no sistema.`,
              session.user.id,
              profile.name
            );

            // Log de Acesso Simples (Para o Usuário ver)
            try {
              // Obter IP e Localização (Fallback simples, idealmente viria de um serviço ou edge function)
              const userAgent = navigator.userAgent;

              await supabase.from('access_logs').insert({
                user_id: session.user.id,
                user_agent: userAgent,
                location: 'Detectando...', // Placeholder, real geoip needs API
                ip_address: '0.0.0.0', // Client can't reliably get IP without server help/echo
                device_info: getSimplePlatform(userAgent)
              });
            } catch (e) {
              console.error("Erro ao registrar access_log", e);
            }
          }
        }
      } else {
        setCurrentRole("gestor");
        setCostCenter(undefined);
        setUserName("");
        setEmail("");
        setMustChangePassword(false);
        setIsNewUser(false);
        setGravatarEmail("");
        setGravatarUrl(null);
        setLockPin(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    if (!userId) {
      console.warn("[AuthContext] fetchProfile called with empty userId");
      return null;
    }
    console.log("[AuthContext] fetchProfile started for:", userId);
    try {
      const profile = await getProfile(userId);
      console.log("[AuthContext] fetchProfile result:", profile ? "Found" : "Null");
      if (profile) {
        if (profile.status === "inativo") {
          console.log("[AuthContext] User inactive");
          await supabase.auth.signOut();
          setCurrentRole("gestor");
          setCostCenter(undefined);
          setUserName("");
          setEmail("");
          setMustChangePassword(false);
          setIsNewUser(false);
          setGravatarEmail("");
          setGravatarUrl(null);
          setLockPin(null);
          setUser(null);
        } else {
          console.log("[AuthContext] Setting user data:", profile.name);
          setCurrentRole(profile.role);
          setCostCenter(profile.cost_center);
          setUserName(profile.name);
          setEmail(profile.email);
          setMustChangePassword(profile.must_change_password || false);
          setIsNewUser(profile.is_new_user || false);
          setGravatarEmail(profile.gravatar_email || "");
          setLockPin(profile.lock_pin || null);
          const url = await getGravatarUrl(profile.gravatar_email || profile.email);
          setGravatarUrl(url);
          return profile;
        }
      }
      return null;
    } catch (error) {
      console.error("[AuthContext] Error in fetchProfile:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentRole,
      costCenter,
      userName,
      email,
      mustChangePassword,
      isNewUser,
      gravatarEmail,
      gravatarUrl,
      lockPin,
      isLoading,
      signOut,
      refreshProfile,
      updateEmail: async (email: string) => {
        const { error } = await supabase.auth.updateUser({ email });
        return { error: error || undefined };
      },
      updatePassword: async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { error: error || undefined };
      },
      updateProfileData: async (data: { name?: string; gravatar_email?: string; is_new_user?: boolean }) => {
        if (!user) return;

        await saveUser({
          id: user.id,
          name: data.name,
          gravatar_email: data.gravatar_email,
          is_new_user: data.is_new_user
        });

        await refreshProfile();
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

function getSimplePlatform(userAgent: string): string {
  if (userAgent.includes("Win")) return "Windows PC";
  if (userAgent.includes("Mac")) return "Macintosh";
  if (userAgent.includes("Linux")) return "Linux PC";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone")) return "iPhone";
  return "Desconhecido";
}
