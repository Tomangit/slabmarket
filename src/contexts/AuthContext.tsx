
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { setUser as setSentryUser, clearUser as clearSentryUser, captureException } from "@/lib/sentry";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (session?.user) {
        loadProfile(session.user.id, session.user.email);
        // Set Sentry user context
        setSentryUser({
          id: session.user.id,
          email: session.user.email,
        });
      } else {
        setLoading(false);
        clearSentryUser();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user.email);
        // Set Sentry user context
        setSentryUser({
          id: session.user.id,
          email: session.user.email,
        });
      } else {
        setProfile(null);
        setLoading(false);
        // Clear Sentry user context
        clearSentryUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
      // Update Sentry user context with profile data
      if (data) {
        setSentryUser({
          id: userId,
          email: userEmail,
          username: data.full_name || undefined,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      captureException(error instanceof Error ? error : new Error(String(error)), {
        userId,
        action: 'load_profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        action: 'sign_in',
        email,
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: username })
        .eq("id", data.user.id);
      
      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Clear Sentry user context
      clearSentryUser();
    } catch (error) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        action: 'sign_out',
      });
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
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
