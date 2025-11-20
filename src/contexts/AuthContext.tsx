
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

      // Profile should be created automatically by database trigger
      // If it doesn't exist, try to create it via API endpoint
      // 406 = Not Acceptable (often RLS/permission issue)
      // PGRST116 = No rows returned
      // 42501 = Insufficient privilege
      // PGRST301 = Permission denied
      if (
        error &&
        (error.code === 'PGRST116' ||
          error.code === '42501' ||
          error.code === 'PGRST301' ||
          error.message?.includes('406') ||
          error.message?.includes('Not Acceptable'))
      ) {
        // Try to create profile via API endpoint
        try {
          const response = await fetch('/api/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              email: userEmail,
              fullName: null,
            }),
          });

          if (response.ok) {
            const { profile: newProfile } = await response.json();
            if (newProfile) {
              setProfile(newProfile);
              setSentryUser({
                id: userId,
                email: userEmail,
                username: newProfile?.full_name || undefined,
              });
              setLoading(false);
              return;
            }
          } else {
            const errorText = await response.text();
            console.warn("Failed to create profile via API:", response.status, errorText);
          }
        } catch (apiError) {
          console.error("Error creating profile via API:", apiError);
        }
        
        // If API call failed, just continue without profile (non-critical)
        setLoading(false);
        return;
      } else if (error) {
        // For other errors, log but don't block the app
        console.error("Error loading profile:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data);
        // Update Sentry user context with profile data
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
      // Profile should be created automatically by database trigger
      // But if it fails, use API endpoint as fallback (bypasses RLS)
      try {
        const response = await fetch('/api/create-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            email: data.user.email,
            fullName: username,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error creating profile via API:", response.status, errorText);
          // Don't throw - profile might be created by trigger anyway
        }
      } catch (apiError) {
        console.error("Error calling create-profile API:", apiError);
        // Don't throw - profile might be created by trigger anyway
      }

      // Create default wishlist for the user
      try {
        const { wishlistService } = await import("@/services/wishlistService");
        await wishlistService.ensureDefaultWishlist(data.user.id);
      } catch (wishlistError) {
        console.error("Error creating default wishlist:", wishlistError);
        // Don't throw - wishlist creation is not critical for signup
      }
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
