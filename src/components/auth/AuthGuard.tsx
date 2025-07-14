import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  freelancerOnly?: boolean;
}

export default function AuthGuard({ 
  children, 
  adminOnly = false,
  freelancerOnly = false 
}: AuthGuardProps) {
  const { user, profile, isAdmin, isFreelancer } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check and refresh auth state if needed
    const checkAuth = async () => {
      setIsVerifying(true);
      try {
        // Get current session
        const { data } = await supabase.auth.getSession();
        
        // If no session, redirect to login
        if (!data.session) {
          console.log("No active session found, redirecting to login");
          navigate('/auth');
          return;
        }
        
        // If we have adminOnly flag and user is not admin, redirect
        if (adminOnly && !isAdmin) {
          console.log("Admin access required, redirecting to home");
          navigate('/');
          return;
        }
        
        // If we have freelancerOnly flag and user is not freelancer, redirect
        if (freelancerOnly && !isFreelancer) {
          console.log("Freelancer access required, redirecting to home");
          navigate('/');
          return;
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        navigate('/auth');
      } finally {
        setIsVerifying(false);
      }
    };
    
    checkAuth();
  }, [user, profile, isAdmin, isFreelancer, navigate, adminOnly, freelancerOnly]);

  // Show nothing while verifying
  if (isVerifying) {
    return <div className="flex items-center justify-center min-h-screen">Verifying authentication...</div>;
  }

  // If we made it this far, the user is authenticated and authorized
  return <>{children}</>;
} 