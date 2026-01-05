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
  gravatarEmail: string;
  gravatarUrl: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateEmail: (email: string) => Promise<{ error?: Error }>;
  updatePassword: (password: string) => Promise<{ error?: Error }>;
  updateProfileData: (data: { name?: string; gravatar_email?: string }) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("gestor");
  const [userName, setUserName] = useState("Carregando...");
  const [email, setEmail] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [gravatarEmail, setGravatarEmail] = useState("");
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
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

        if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
          const profile = await fetchProfile(session.user.id);

          if (event === "SIGNED_IN" && profile) {
            await logActivity(
              "LOGIN",
              "SESSAO",
              `O usuário ${profile.name} realizou login no sistema.`,
              session.user.id,
              profile.name
            );
          }
        }
      } else {
        setCurrentRole("gestor");
        setUserName("");
        setEmail("");
        setMustChangePassword(false);
        setGravatarEmail("");
        setGravatarUrl(null);
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
          setUserName("");
          setEmail("");
          setMustChangePassword(false);
          setGravatarEmail("");
          setGravatarUrl(null);
          setUser(null);
        } else {
          console.log("[AuthContext] Setting user data:", profile.name);
          setCurrentRole(profile.role);
          setUserName(profile.name);
          setEmail(profile.email);
          setMustChangePassword(profile.must_change_password || false);
          setGravatarEmail(profile.gravatar_email || "");
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
      userName,
      email,
      mustChangePassword,
      gravatarEmail,
      gravatarUrl,
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
      updateProfileData: async (data: { name?: string; gravatar_email?: string }) => {
        if (!user) return;

        await saveUser({
          id: user.id,
          name: data.name,
          gravatar_email: data.gravatar_email
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
