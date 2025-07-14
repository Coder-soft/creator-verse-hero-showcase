import { useState, useEffect, createContext, useContext } from 'react';
import { createClient, type AuthUser, type Session, type AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, hasServiceRoleKey } from '@/integrations/supabase/admin';
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile data from Supabase
  const fetchProfile = async (userId: string) => {
    if (!userId) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    setLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } catch (error) {
          console.error("Error in auth state change:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  // Determine user roles
  const isAdmin = Boolean(profile?.role === 'admin') || (user?.email && ADMIN_EMAILS.includes(user.email));
  const isBuyer = Boolean(profile?.role === 'buyer');
  const isFreelancer = Boolean(profile?.role === 'freelancer');

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile,
      isAdmin,
      isBuyer,
      isFreelancer,
      loading, 
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}