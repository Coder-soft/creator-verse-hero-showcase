import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, UserX, Upload, LogOut, FileEdit, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Navbar } from '@/components/ui/navbar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PostgrestError } from '@supabase/supabase-js';
import AuthGuard from '@/components/auth/AuthGuard';
import EmailConfirmationCheck from '@/components/auth/EmailConfirmationCheck';

interface ProfileData {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  username: string | null;
  role: string;
  account_status: string;
}

interface FreelancerApplication {
  id: string;
  status: string;
  submitted_at: string;
}

type AppError = PostgrestError | Error;

// Helper function to generate a unique ID
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const Profile = () => {
  const { user, signOut, isFreelancer, isBuyer, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [freelancerApplication, setFreelancerApplication] = useState<FreelancerApplication | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, bio, avatar_url, username, role, account_status')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        setProfileData(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url);
        
        // If freelancer, fetch application info
        if (data.role === 'freelancer') {
          const { data: appData } = await supabase
            .from('freelancer_applications')
            .select('id, status, submitted_at')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (appData) {
            setFreelancerApplication(appData);
          }
        }
        
        // If no avatar and user has auth metadata, try to get avatar from provider
        if (!data.avatar_url && user.app_metadata && user.app_metadata.provider) {
          const provider = user.app_metadata.provider;
          let providerAvatarUrl = null;
          
          if (provider === 'github' && user.user_metadata?.avatar_url) {
            providerAvatarUrl = user.user_metadata.avatar_url;
          } else if (provider === 'discord' && user.user_metadata?.avatar_url) {
            providerAvatarUrl = user.user_metadata.avatar_url;
          }
          
          if (providerAvatarUrl) {
            await updateAvatarUrl(providerAvatarUrl);
            setAvatarUrl(providerAvatarUrl);
          }
        }
      } catch (error: unknown) {
        const appError = error as AppError;
        console.error('Error fetching profile:', appError.message);
        // If the profile doesn't exist, create it
        if ('code' in appError && appError.code === 'PGRST116') {
          createNewProfile();
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user, navigate]);

  // Helper function to handle API errors with better debugging
  const handleApiError = (error: unknown, operation: string) => {
    console.error(`Error during ${operation}:`, error);
    
    let errorMessage = "An unknown error occurred";
    
    // Cast to a more specific type if possible
    const apiError = error as { message?: string; code?: string; status?: number };
    
    if (apiError.message) {
      errorMessage = apiError.message;
    }
    
    if (apiError.code) {
      // Handle specific error codes
      if (apiError.code === '42501') {
        errorMessage = "You don't have permission to perform this action. Please sign in again.";
      } else if (apiError.code === '401') {
        errorMessage = "Authentication error. Please sign in again.";
      } else if (apiError.code === 'PGRST116') {
        errorMessage = "Resource not found.";
      }
      
      console.error(`Error code: ${apiError.code}, Status: ${apiError.status}, Message: ${apiError.message}`);
    }
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    
    return errorMessage;
  };

  // Update createNewProfile to use the error handler
  const createNewProfile = async () => {
    if (!user) return;
    
    try {
      // Make sure we have a valid session before proceeding
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // Try to refresh the session
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          throw new Error("Authentication required. Please sign in.");
        }
      }
      
      // Try to extract avatar from provider if available
      let initialAvatarUrl = null;
      let username = null;
      let initialRole = 'buyer'; // Default role
      
      if (user.app_metadata && user.app_metadata.provider) {
        const provider = user.app_metadata.provider;
        
        if (provider === 'github' && user.user_metadata?.avatar_url) {
          initialAvatarUrl = user.user_metadata.avatar_url;
          username = user.user_metadata?.user_name || user.user_metadata?.preferred_username;
        } else if (provider === 'discord' && user.user_metadata?.avatar_url) {
          initialAvatarUrl = user.user_metadata.avatar_url;
          username = user.user_metadata?.full_name || user.user_metadata?.preferred_username;
        }
      }

      // Check if user had a preferred role during signup
      if (user.user_metadata?.initial_role) {
        initialRole = user.user_metadata.initial_role;
      }
      
      // Ensure we're authenticated before inserting
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error("Authentication required to create profile");
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: username || user.email?.split('@')[0] || '',
          bio: '',
          avatar_url: initialAvatarUrl,
          username: username || user.email?.split('@')[0] || '',
          role: initialRole as 'admin' | 'buyer' | 'freelancer',
          account_status: initialRole === 'freelancer' ? 'pending_application' : 'active',
        })
        .select()
        .single();
      
      if (error) {
        console.error("Profile creation error:", error);
        if (error.code === '42501') { // Permission denied
          throw new Error("Not authorized to create profile. Please ensure you're logged in.");
        }
        throw error;
      }
      
      setProfileData(data);
      setDisplayName(data.display_name || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url);

      // If user is a freelancer, redirect to application
      if (initialRole === 'freelancer') {
        toast({
          title: "Freelancer Profile Created",
          description: "Please complete your application to continue.",
        });
        navigate('/freelancer-application');
      }
    } catch (error: unknown) {
      handleApiError(error, "profile creation");
    }
  };

  // Update handleSaveProfile to use the error handler
  const handleSaveProfile = async () => {
    if (!user || !profileData) return;
    
    setSaving(true);
    try {
      // Ensure we're authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Authentication required. Please sign in.");
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: unknown) {
      handleApiError(error, "profile update");
    } finally {
      setSaving(false);
    }
  };

  const updateAvatarUrl = async (url: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    } catch (error: unknown) {
      const appError = error as AppError;
      console.error('Error updating avatar URL:', appError.message);
      throw error;
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${generateUniqueId()}.${fileExt}`;
    
    setUploading(true);
    try {
      // Upload the image to storage
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;
      
      // Update profile with new avatar URL
      await updateAvatarUrl(publicUrl);
      
      setAvatarUrl(publicUrl);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: unknown) {
      const appError = error as AppError;
      console.error('Error uploading avatar:', appError.message);
      toast({
        title: "Error",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      
      // Clear the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleApplyFreelancer = () => {
    navigate('/freelancer-application');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      // First delete the profile
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);
      
      // Then delete the user auth record
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        throw error;
      }
      
      // Sign out
      await signOut();
      
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully.",
      });
      
      navigate('/');
    } catch (error: unknown) {
      const appError = error as AppError;
      console.error('Error deleting account:', appError.message);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Helper function to get initials from display name or email
  const getInitials = () => {
    if (displayName) {
      return displayName.substring(0, 2).toUpperCase();
    } else if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Display role-specific badge variant
  const getRoleBadgeVariant = () => {
    if (isAdmin) return "success";
    if (isFreelancer) return "default";
    return "secondary";
  };

  // Format account status for display
  const renderAccountStatus = () => {
    if (!profileData) return null;
    
    const status = profileData.account_status;
    
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'pending_application':
      case 'pending_approval':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format freelancer application status
  const renderApplicationStatus = () => {
    if (!freelancerApplication) return null;
    
    const status = freelancerApplication.status;
    
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Handle navigation to freelancer application
  const handleGoToApplication = () => {
    navigate('/freelancer-application');
  };

  const isApprovedFreelancer = isFreelancer && profileData?.account_status === 'active';

  // Add this section before the return statement
  const renderFreelancerActions = () => {
    if (!isApprovedFreelancer) return null;
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Freelancer Tools</CardTitle>
          <CardDescription>Manage your freelancer services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="flex-1"
                onClick={() => navigate('/freelancer/posts')}
              >
                Manage Your Posts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-20">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and profile information
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant()}>
                    {isAdmin ? 'Admin' : isFreelancer ? 'Freelancer' : 'Buyer'}
                  </Badge>
                  {profileData && renderAccountStatus()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                
                <div className="flex items-center">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" className="relative" disabled={uploading}>
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Avatar
                          </>
                        )}
                      </Button>
                      <input
                        id="avatar-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </div>
                  </label>
                </div>
                {user?.app_metadata?.provider && (
                  <p className="text-sm text-muted-foreground">
                    {avatarUrl && user.app_metadata.provider === 'github' && 'Using GitHub avatar'}
                    {avatarUrl && user.app_metadata.provider === 'discord' && 'Using Discord avatar'}
                  </p>
                )}
              </div>
              
              <Separator className="my-4" />

              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Your email address cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
                <p className="text-sm text-muted-foreground">
                  This name will be displayed in the marketplace
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  Write a short bio to introduce yourself to other users
                </p>
              </div>

              {/* Freelancer specific section */}
              {isFreelancer && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Freelancer Status</h3>
                    
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Application Status</p>
                          {freelancerApplication ? (
                            <p className="text-sm text-muted-foreground">
                              Submitted on {new Date(freelancerApplication.submitted_at).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              You need to submit an application
                            </p>
                          )}
                        </div>
                        
                        <div>
                          {renderApplicationStatus() || (
                            <Badge variant="warning">Not Submitted</Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Show application button if needed */}
                      {(profileData?.account_status === 'pending_application' || 
                        profileData?.account_status === 'rejected') && (
                        <Button 
                          onClick={handleGoToApplication}
                          className="w-full mt-2"
                        >
                          <FileEdit className="mr-2 h-4 w-4" />
                          {freelancerApplication ? 'View Application' : 'Complete Application'}
                        </Button>
                      )}
                      
                      {/* Show warning if application rejected */}
                      {profileData?.account_status === 'rejected' && (
                        <div className="flex items-start space-x-2 mt-2 text-yellow-500 bg-yellow-500/10 p-3 rounded-md">
                          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                          <p className="text-sm">
                            Your application was rejected. Please update and resubmit your application.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Freelancer Tools */}
              {renderFreelancerActions()}

              <Separator className="my-4" />

              {/* Account Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Actions</h3>
                {isBuyer && (
                  <div>
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center" 
                      onClick={handleApplyFreelancer}
                    >
                      <FileEdit className="mr-2 h-4 w-4" />
                      Apply to become a Freelancer
                    </Button>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center" 
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <UserX className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Account"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6">
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Email Confirmation Section */}
          <div className="mt-6">
            <EmailConfirmationCheck />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Profile; 