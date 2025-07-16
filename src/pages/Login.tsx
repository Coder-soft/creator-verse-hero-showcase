import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

function Login() {
  const { data: session, isLoading } = useQuery({ queryKey: ['session'], queryFn: getSession });

  if (isLoading) {
      return null;
  }

  if (session) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-lg">
            <div>
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Sign in to your account
                </h2>
            </div>
            <Auth
              supabaseClient={supabase}
              providers={[]}
              appearance={{
                theme: ThemeSupa,
              }}
              theme="light"
            />
        </div>
    </div>
  );
}

export default Login;