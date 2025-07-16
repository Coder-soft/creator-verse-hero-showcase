import { useState, useEffect, createContext, useContext } from 'react';
import { type AuthUser, type Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { ADMIN_EMAILS } from '@/utils/admin-config';

// Define Profile type using Supabase types
type Profile = Tables<'profiles'>;

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isBuyer: boolean;
  isFreelancer: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle auth state changes from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // If there's no user, we know we are done loading.
      if (!session?.user) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch profile when user object is available or changes
  useEffect(() => {
    // Don't fetch profile if no user
    if (user) {
      setLoading(true); // Start loading profile
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not a fatal error
            console.error('Error fetching profile:', error);
          }
          setProfile(data);
          setLoading(false); // Finish loading
        });
    } else {
      // No user, so no profile to fetch.
      setProfile(null);
    }
  }, [user]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      setProfile(data);
    }
  };

  // Determine user roles
  const isAdmin = Boolean(profile?.role === 'admin') || (user?.email && ADMIN_EMAILS.includes(user.email));
  const isBuyer = Boolean(profile?.role === 'buyer');
  const isFreelancer = Boolean(profile?.role === 'freelancer');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isBuyer,
        isFreelancer,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};