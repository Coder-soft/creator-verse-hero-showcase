import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

type SessionContextType = {
  session: Session | null;
  supabase: SupabaseClient;
};

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, supabase }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context.session;
};

export const useSupabase = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SessionContextProvider');
  }
  return context.supabase;
};