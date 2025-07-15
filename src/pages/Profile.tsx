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
import AuthGuard from '@/components/auth/AuthGuard';
import EmailConfirmationCheck from '@/components/auth/EmailConfirmationCheck';
import { hasServiceRoleKey } from '@/integrations/supabase/admin';

interface FreelancerApplication {
  id: string;
  status: string;
  submitted_at: string;
}

const Profile = () => {
  const { user, profile, signOut, isFreelancer, isBuyer, isAdmin, loading: authLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  
  const [freelancerApplication, setFreelancerApplication] = useState<FreelancerApplication | null>(null);
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      
      if (profile.role === 'freelancer' && user) {
        const fetchApp = async () => {
          const { data: appData } = await supabase
            .from('freelancer_applications')
            .select('id, status, submitted_at')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (appData) {
            setFreelancerApplication(appData);
          }
        };
        fetchApp();
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: bio,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;
    
    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload avatar.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    if (!hasServiceRoleKey()) {
      toast({
        title: "Admin Action Required",
        description: "Account deletion requires the service role key to be configured in your project's environment variables.",
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;
      
      await signOut();
      
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = () => {
    if (displayName) return displayName.substring(0, 2).toUpperCase();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return 'U';
  };

  const getRoleBadgeVariant = () => {
    if (isAdmin) return "default";
    if (isFreelancer) return "secondary";
    return "outline";
  };

  const renderAccountStatus = () => {
    if (!profile) return null;
    const status = profile.account_status;
    switch (status) {
      case 'active': return <Badge variant="success">Active</Badge>;
      case 'pending_application':
      case 'pending_approval': return <Badge variant="warning">Pending Approval</Badge>;
      case 'suspended': return <Badge variant="destructive">Suspended</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const renderApplicationStatus = () => {
    if (!freelancerApplication) return null;
    const status = freelancerApplication.status;
    switch (status) {
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'pending': return <Badge variant="warning">Pending Review</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const isApprovedFreelancer = isFreelancer && profile?.account_status === 'active';

  const renderFreelancerActions = () => {
    if (!isApprovedFreelancer) return null;
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Freelancer Tools</CardTitle>
          <CardDescription>Manage your freelancer services</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={() => navigate('/freelancer/posts')}
          >
            Manage Your Posts
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (authLoading) {
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
                    {profile?.role}
                  </Badge>
                  {renderAccountStatus()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                
                <div className="flex items-center">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" className="relative" disabled={uploading} asChild>
                      <div>
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
                        <input
                          id="avatar-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={uploading}
                        />
                      </div>
                    </Button>
                  </label>
                </div>
              </div>
              
              <Separator className="my-4" />

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
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
              </div>

              {isFreelancer && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Freelancer Status</h3>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Application Status</p>
                          {freelancerApplication && (
                            <p className="text-sm text-muted-foreground">
                              Submitted on {new Date(freelancerApplication.submitted_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {renderApplicationStatus()}
                      </div>
                      {(profile?.account_status === 'pending_application' || profile?.account_status === 'rejected') && (
                        <Button onClick={() => navigate('/freelancer-application')} className="w-full mt-2">
                          <FileEdit className="mr-2 h-4 w-4" />
                          {freelancerApplication ? 'View/Edit Application' : 'Complete Application'}
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {renderFreelancerActions()}

              {isBuyer && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                     <h3 className="text-lg font-medium">Account Actions</h3>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => navigate('/freelancer-application')}
                    >
                      <FileEdit className="mr-2 h-4 w-4" />
                      Apply to become a Freelancer
                    </Button>
                  </div>
                </>
              )}

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sign Out & Delete</h3>
                <Button 
                  variant="outline" 
                  className="w-full" 
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
                        This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Delete Account
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
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
          
          <div className="mt-6 max-w-2xl mx-auto">
            <EmailConfirmationCheck />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Profile;