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
          
          // If profile doesn't exist but user is authenticated, create it
          if (!profileData) {
            const newProfileData = await createInitialProfile(session.user);
            setProfile(newProfileData);
          } else {
            setProfile(profileData);
          }
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

  // Function to create initial profile for authenticated users
  const createInitialProfile = async (authUser: AuthUser) => {
    if (!authUser) return null;
    
    try {
      // Extract role preference from user metadata if it exists
      let initialRole = 'buyer'; // Default role
      if (authUser.user_metadata?.initial_role) {
        initialRole = authUser.user_metadata.initial_role;
      }
      
      // Try to extract avatar from provider if available
      let initialAvatarUrl = null;
      let username = null;
      
      if (authUser.app_metadata && authUser.app_metadata.provider) {
        const provider = authUser.app_metadata.provider;
        
        if (provider === 'github' && authUser.user_metadata?.avatar_url) {
          initialAvatarUrl = authUser.user_metadata.avatar_url;
          username = authUser.user_metadata?.user_name || authUser.user_metadata?.preferred_username;
        } else if (provider === 'discord' && authUser.user_metadata?.avatar_url) {
          initialAvatarUrl = authUser.user_metadata.avatar_url;
          username = authUser.user_metadata?.full_name || authUser.user_metadata?.preferred_username;
        }
      }
      
      // Check if profile already exists to avoid duplicate inserts
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();
        
      if (existingProfile) {
        console.log("Profile already exists, returning existing profile");
        return existingProfile;
      }
      
      // Generate unique username
      let baseUsername = username || authUser.email?.split('@')[0] || '';
      let uniqueUsername = baseUsername;
      let counter = 1;
      
      // Check if username already exists and make it unique
      while (true) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', uniqueUsername)
          .maybeSingle();
          
        if (!existingUser) break;
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }
      
      const newProfile = {
        user_id: authUser.id,
        display_name: username || authUser.email?.split('@')[0] || '',
        bio: '',
        avatar_url: initialAvatarUrl,
        username: uniqueUsername,
        role: initialRole as 'admin' | 'buyer' | 'freelancer',
        account_status: initialRole === 'freelancer' ? 'pending_application' : 'active',
      };
      
      console.log("Creating new profile:", newProfile);
      
      let result;
      
      // Try using the admin client first if we have a service role key
      if (hasServiceRoleKey()) {
        console.log("Using admin client to create profile (bypasses RLS)");
        result = await supabaseAdmin
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
      } else {
        // Fall back to regular client if no service role key
        console.log("Using regular client to create profile");
        result = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
      }
      
      const { data, error } = result;
      
      if (error) {
        console.error("Error creating initial profile:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Exception creating initial profile:", error);
      return null;
    }
  };

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