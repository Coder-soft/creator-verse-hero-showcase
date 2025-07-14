import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

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
  const { user, loading: authLoading, isAdmin, isFreelancer } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return; // Wait until loading is complete

    if (!user) {
      navigate('/auth');
      return;
    }

    if (adminOnly && !isAdmin) {
      navigate('/');
      return;
    }
    
    if (freelancerOnly && !isFreelancer) {
      navigate('/');
      return;
    }
  }, [user, authLoading, isAdmin, isFreelancer, navigate, adminOnly, freelancerOnly]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we have a user and they meet the role requirements, render children.
  // Otherwise, the useEffect will have initiated a redirect, so render null.
  if (user) {
    if (adminOnly && !isAdmin) return null;
    if (freelancerOnly && !isFreelancer) return null;
    return <>{children}</>;
  }

  return null;
}