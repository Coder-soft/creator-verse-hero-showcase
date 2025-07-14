import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Settings, LayoutDashboard, FileEdit, ShoppingCart, PenTool, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, isAdmin, isFreelancer, isBuyer } = useAuth();
  const [displayName, setDisplayName] = useState("");
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data && data.display_name) {
          setDisplayName(data.display_name);
        } else {
          // Fallback to email if display name is not available
          setDisplayName(user.email?.split('@')[0] || '');
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Fallback to email if there's an error
        setDisplayName(user.email?.split('@')[0] || '');
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Check if freelancer needs to complete application
  const needsApplication = profile?.role === 'freelancer' && 
    (profile?.account_status === 'pending_application' || profile?.account_status === 'rejected');
    
  // Check if buyer can apply to be a freelancer
  const canApplyAsFreelancer = isBuyer;

  // Check if user is an approved freelancer
  const isApprovedFreelancer = isFreelancer && profile?.account_status === 'active';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-foreground">
              <Link to="/">Freelance Hub</Link>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Home
              </Link>

              <Link to="/marketplace" className="text-foreground hover:text-primary transition-colors flex items-center">
                <ShoppingCart className="h-4 w-4 mr-1" />
                Marketplace
              </Link>
              
              {needsApplication && (
                <Link to="/freelancer-application" className="text-foreground hover:text-primary transition-colors flex items-center">
                  <FileEdit className="h-4 w-4 mr-1" />
                  Complete Application
                </Link>
              )}
              
              {isApprovedFreelancer && (
                <Link to="/freelancer/posts" className="text-foreground hover:text-primary transition-colors flex items-center">
                  <PenTool className="h-4 w-4 mr-1" />
                  My Posts
                </Link>
              )}

              {user && (
                <Link to="/messaging" className="text-foreground hover:text-primary transition-colors flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Messages
                </Link>
              )}
              
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:block">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{displayName}</span>
                  {profile?.role && (
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </span>
                  )}
                </div>
                <Link to="/profile">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Profile</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/auth">
                <Button>
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-card/95 backdrop-blur-md rounded-lg mt-2 border border-border/50">
              <Link
                to="/"
                className="block px-3 py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>

              <Link
                to="/marketplace"
                className="block px-3 py-2 text-foreground hover:text-primary transition-colors flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Marketplace
              </Link>
              
              {needsApplication && (
                <Link
                  to="/freelancer-application"
                  className="block px-3 py-2 text-foreground hover:text-primary transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FileEdit className="h-4 w-4 mr-2" />
                  Complete Application
                </Link>
              )}
              
              {isApprovedFreelancer && (
                <Link
                  to="/freelancer/posts"
                  className="block px-3 py-2 text-foreground hover:text-primary transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  My Posts
                </Link>
              )}

              {user && (
                <Link
                  to="/messaging"
                  className="block px-3 py-2 text-foreground hover:text-primary transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Link>
              )}
              
              <div className="px-3 py-2">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">{displayName}</span>
                      {profile?.role && (
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                          {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                        </span>
                      )}
                    </div>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link to="/auth" className="block" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}