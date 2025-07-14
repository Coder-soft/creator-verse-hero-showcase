import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthError } from '@supabase/supabase-js';

export default function EmailConfirmationCheck() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check if email is confirmed
  const isEmailConfirmed = user?.email_confirmed_at || user?.app_metadata?.email_confirmed_at;

  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Confirmation email sent",
        description: "Please check your inbox (and spam folder) for the confirmation link.",
      });
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Error resending confirmation:', authError.message);
      toast({
        title: "Error",
        description: authError.message || "Failed to resend confirmation email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      {!isEmailConfirmed ? (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Email not confirmed</AlertTitle>
          <AlertDescription>
            Please check your email for a confirmation link. If you haven't received it, you can request a new one.
          </AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResendConfirmation}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Confirmation
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </Button>
          </div>
        </Alert>
      ) : (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Email confirmed</AlertTitle>
          <AlertDescription>
            Your email has been successfully confirmed. You can use all features of the app.
          </AlertDescription>
        </Alert>
      )}

      {showDetails && (
        <div className="bg-muted p-4 rounded-md text-sm">
          <h4 className="font-medium mb-2">Debug Information</h4>
          <div className="space-y-1">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Auth Status:</strong> {session ? "Authenticated" : "Not authenticated"}</p>
            <p><strong>Email Confirmed:</strong> {isEmailConfirmed ? "Yes" : "No"}</p>
            <p><strong>Auth Provider:</strong> {user.app_metadata?.provider || "email"}</p>
          </div>
        </div>
      )}
    </div>
  );
} 