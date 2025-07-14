import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
// Import our simple radio group component instead of the Radix UI one
import { RadioGroup, RadioGroupItem } from '@/components/ui/simple-radio-group';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, AlertTriangle, Loader2, Github } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';

export default function AuthPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState<'buyer' | 'freelancer'>('buyer');
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  if (user) {
    return <Navigate to="/profile" replace />;
  }

  const handleEmailAuth = async (isSignUp: boolean) => {
    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up the user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              initial_role: userRole, // Store role in user metadata for profile creation
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (authData.user) {
          setEmailSent(true);
          setSentToEmail(email);
          
          // On signup, the user needs to confirm their email first
          // We'll handle profile creation after email confirmation
          if (userRole === 'freelancer') {
            toast({
              title: "Application needed",
              description: "After confirming your email, you'll need to complete your freelancer application.",
            });
          } else {
            toast({
              title: "Check your email",
              description: "We've sent you a confirmation link. Your profile will be created after confirmation.",
            });
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: unknown) {
      const authError = error as AuthError;
      toast({
        title: "Error",
        description: authError.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'github' | 'discord') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            // Store the selected role in the OAuth state for user metadata
            state: JSON.stringify({ initial_role: userRole })
          }
        }
      });
      
      if (error) throw error;
    } catch (error: unknown) {
      const authError = error as AuthError;
      toast({
        title: "Error",
        description: authError.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome</h1>
            <p className="text-muted-foreground">
              {isSignUp ? "Create an account to get started" : "Sign in to your account"}
            </p>
          </div>
          
          {emailSent && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Mail className="h-4 w-4 text-blue-500" />
              <AlertTitle>Confirmation email sent!</AlertTitle>
              <AlertDescription>
                A confirmation email has been sent to <strong>{sentToEmail}</strong>. Please check your inbox (and spam folder) to complete your registration.
              </AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Welcome</CardTitle>
              <CardDescription>
                {isSignUp ? "Create an account to get started" : "Sign in to your account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="email">Email</TabsTrigger>
                  </TabsList>
                  <TabsContent value="email" className="mt-4">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleEmailAuth(isSignUp);
                    }}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        
                        {isSignUp && (
                          <div className="space-y-2">
                            <Label>I want to join as a</Label>
                            <RadioGroup 
                              value={userRole} 
                              onValueChange={(value) => setUserRole(value as 'buyer' | 'freelancer')}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="buyer" id="buyer" />
                                <Label htmlFor="buyer">Buyer</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="freelancer" id="freelancer" />
                                <Label htmlFor="freelancer">Freelancer</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )}
                        
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {isSignUp ? "Signing up..." : "Signing in..."}
                            </span>
                          ) : (
                            <span>{isSignUp ? "Sign up" : "Sign in"}</span>
                          )}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleSocialAuth('github')}
                      disabled={loading}
                    >
                      <Github className="h-4 w-4 mr-2" />
                      GitHub
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSocialAuth('discord')}
                      disabled={loading}
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.037c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                      </svg>
                      Discord
                    </Button>
                  </div>
                </div>
                
                <div className="text-center text-sm">
                  {isSignUp ? (
                    <p>
                      Already have an account?{" "}
                      <Button variant="link" className="p-0 h-auto" onClick={() => setIsSignUp(false)}>
                        Sign in
                      </Button>
                    </p>
                  ) : (
                    <p>
                      Don't have an account?{" "}
                      <Button variant="link" className="p-0 h-auto" onClick={() => setIsSignUp(true)}>
                        Sign up
                      </Button>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}