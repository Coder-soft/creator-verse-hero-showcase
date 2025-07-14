import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, hasServiceRoleKey } from '@/integrations/supabase/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/simple-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, UserCog, Eye, Loader2, PencilLine, Trash2, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface User {
  id: string;
  email: string;
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    role: string;
    account_status: string;
    username: string | null;
  };
}

interface FreelancerApplication {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  user: User;
  freelancer_application_answers: Array<{
    id: string;
    question_id: string;
    answer: string;
    question?: {
      question: string;
      required: boolean;
    };
  }>;
}

interface Question {
  id: string;
  question: string;
  required: boolean;
  order_position: number;
}

export default function AdminPage() {
  const { user, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [buyers, setBuyers] = useState<User[]>([]);
  const [freelancers, setFreelancers] = useState<User[]>([]);
  const [applications, setApplications] = useState<FreelancerApplication[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [selectedApplication, setSelectedApplication] = useState<FreelancerApplication | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState({ question: '', required: true });

  useEffect(() => {
    // Redirect non-admin users
    if (!user && !loadingUsers) {
      console.log('Redirecting to auth: No user and not loading');
      navigate('/auth');
      return;
    }

    // Admin check with email whitelist (handled in useAuth)
    if (profile && !isAdmin && !loadingUsers) {
      console.log('Redirecting to home: User is not an admin');
      navigate('/');
      return;
    }

    const fetchData = async () => {
      setLoadingUsers(true);
      setLoadingApplications(true);
      setLoadingQuestions(true);

      try {
                 // Fetch all users from auth.users to get emails
         let userEmailMap = new Map<string, string>();
         
         // Only attempt to use the admin API if we have a valid service role key
         if (hasServiceRoleKey()) {
           try {
             const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
             if (authError) throw authError;
             
              // Create properly typed entries
              const authUsersData = authUsers as { users: Array<{ id: string; email?: string | null }> };
              const emailEntries: Array<[string, string]> = [];
              authUsersData.users.forEach(u => {
                emailEntries.push([u.id, u.email || 'No email']);
              });
             userEmailMap = new Map<string, string>(emailEntries);
             console.log('Successfully fetched user emails from admin API');
           } catch (adminError) {
             console.error('Could not fetch user emails with admin API:', adminError);
             setEmailStatusMessage();
           }
         } else {
           setEmailStatusMessage();
         }
         
         // Always add the current user's email to the map if available
         if (user?.id && user?.email) {
           userEmailMap.set(user.id, user.email);
         }
         
         // Helper function to set email status message
         function setEmailStatusMessage() {
           toast({
             title: 'Limited Email Access',
             description: 'To view all user emails, add your Supabase service role key to .env',
             variant: 'default',
             duration: 5000
           });
         }

        // Fetch all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (profilesError) throw profilesError;

        const usersWithProfiles = profilesData.map(p => ({
          id: p.user_id,
          email: userEmailMap.get(p.user_id) || 'No email found',
          profile: {
            id: p.id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            role: p.role,
            account_status: p.account_status,
            username: p.username
          }
        }));

        setBuyers(usersWithProfiles.filter(u => u.profile.role === 'buyer'));
        setFreelancers(usersWithProfiles.filter(u => u.profile.role === 'freelancer'));
        setLoadingUsers(false);

        // Fetch freelancer applications
        try {
          console.log('Fetching freelancer applications...');
          const { data: applicationsData, error: applicationsError } = await supabase
            .from('freelancer_applications')
            .select(`
              *,
              freelancer_application_answers(
                id,
                question_id,
                answer,
                question:freelancer_questions(question, required)
              )
            `)
            .order('submitted_at', { ascending: false });
          
          if (applicationsError) {
            console.error('Error fetching applications:', applicationsError);
            toast({
              title: 'Error Loading Applications',
              description: applicationsError.message || 'Failed to load freelancer applications',
              variant: 'destructive',
            });
            throw applicationsError;
          }

          console.log('Applications data:', applicationsData);
          
          if (!applicationsData || applicationsData.length === 0) {
            console.log('No applications found in the database');
            toast({
              title: 'No Applications Found',
              description: 'There are no freelancer applications in the database.',
              variant: 'default',
            });
          }

          const formattedApplications = applicationsData.map(app => {
            const user = usersWithProfiles.find(u => u.id === app.user_id);
            return {
              ...app,
              user: user || {
                id: app.user_id,
                email: 'User not found',
                profile: {
                  id: 'unknown',
                  display_name: 'Unknown User',
                  avatar_url: null,
                  role: 'unknown',
                  account_status: 'unknown',
                  username: 'unknown'
                }
              },
              freelancer_application_answers: app.freelancer_application_answers
            };
          });

          setApplications(formattedApplications);
          console.log('Formatted applications:', formattedApplications);
        } catch (appError) {
          console.error('Error processing applications:', appError);
          toast({
            title: 'Application Processing Error',
            description: 'Failed to process freelancer applications. Check console for details.',
            variant: 'destructive',
          });
        } finally {
          setLoadingApplications(false);
        }

        // Fetch freelancer questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('freelancer_questions')
          .select('*')
          .order('order_position', { ascending: true });
        if (questionsError) throw questionsError;

        setQuestions(questionsData || []);
        setLoadingQuestions(false);

      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load admin data. Make sure your Supabase credentials are set correctly.',
          variant: 'destructive',
        });
        setLoadingUsers(false);
        setLoadingApplications(false);
        setLoadingQuestions(false);
      }
    };

    fetchData();
  }, [user, profile, isAdmin, navigate, toast]);

  const handleApplicationAction = async (applicationId: string, status: 'approved' | 'rejected', userId: string) => {
    setProcessing(true);
    try {
      // Update application status
      await supabase
        .from('freelancer_applications')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', applicationId);
      
      // Update user profile status
      await supabase
        .from('profiles')
        .update({ 
          account_status: status === 'approved' ? 'active' : 'rejected' 
        })
        .eq('user_id', userId);
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId 
          ? { ...app, status } 
          : app
      ));
      
      toast({
        title: `Application ${status}`,
        description: `The freelancer application has been ${status}.`,
      });
      
    } catch (error) {
      console.error(`Error ${status} application:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${status} application`,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUserStatusChange = async (userId: string, status: string) => {
    setProcessing(true);
    try {
      await supabase
        .from('profiles')
        .update({ account_status: status })
        .eq('user_id', userId);
      
      toast({
        title: 'Status Updated',
        description: `User status has been updated to ${status}.`,
      });
      
      // Refresh users
      setBuyers(buyers.map(u => 
        u.id === userId 
          ? { ...u, profile: { ...u.profile, account_status: status }} 
          : u
      ));
      
      setFreelancers(freelancers.map(u => 
        u.id === userId 
          ? { ...u, profile: { ...u.profile, account_status: status }} 
          : u
      ));
      
    } catch (error) {
      console.error('Error changing user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateQuestion = async (question: Question) => {
    setProcessing(true);
    try {
      await supabase
        .from('freelancer_questions')
        .update({
          question: question.question,
          required: question.required,
        })
        .eq('id', question.id);
      
      toast({
        title: 'Question Updated',
        description: 'The question has been successfully updated.',
      });
      
      // Update local state
      setQuestions(questions.map(q => 
        q.id === question.id ? question : q
      ));
      setSelectedQuestion(null);
      
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: 'Error',
        description: 'Failed to update question',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateQuestion = async () => {
    setProcessing(true);
    try {
      // Find highest order position
      const highestPosition = questions.length > 0
        ? Math.max(...questions.map(q => q.order_position))
        : 0;
      
      const { data, error } = await supabase
        .from('freelancer_questions')
        .insert({
          question: newQuestion.question,
          required: newQuestion.required,
          order_position: highestPosition + 1
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Question Created',
        description: 'The new question has been added to the application.',
      });
      
      // Update local state
      setQuestions([...questions, data]);
      setNewQuestion({ question: '', required: true });
      
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: 'Error',
        description: 'Failed to create question',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setProcessing(true);
    try {
      await supabase
        .from('freelancer_questions')
        .delete()
        .eq('id', questionId);
      
      toast({
        title: 'Question Deleted',
        description: 'The question has been removed from the application.',
      });
      
      // Update local state
      setQuestions(questions.filter(q => q.id !== questionId));
      
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderUserStatus = (status: string) => {
    switch(status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'pending_application':
      case 'pending_approval':
        return <Badge variant="warning">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderApplicationStatus = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loadingUsers && loadingApplications && loadingQuestions) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Debug function to check profile
  const checkProfileData = () => {
    console.log('Current user data:', { 
      user, 
      profile,
      isAdmin: isAdmin ? 'Yes' : 'No',
      profileRole: profile?.role
    });
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Admin instructions alert */}
      {!hasServiceRoleKey() && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Limited admin access:</strong> To view all user emails, add your Supabase service role key to a <code>.env</code> file.
                See <code>src/integrations/supabase/admin.ts</code> for instructions.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>Manage users, applications, and system settings</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/db-setup')}>
              Database Setup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="applications">
                Freelancer Applications
              </TabsTrigger>
              <TabsTrigger value="users">
                Users Management
              </TabsTrigger>
              <TabsTrigger value="questions">
                Application Questions
              </TabsTrigger>
            </TabsList>
            
            {/* Applications Tab */}
            <TabsContent value="applications">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No applications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      applications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell className="font-medium">
                            {application.user.profile.display_name || application.user.profile.username || 'N/A'}
                          </TableCell>
                          <TableCell>{application.user.email}</TableCell>
                          <TableCell>
                            {new Date(application.submitted_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {renderApplicationStatus(application.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => setSelectedApplication(application)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Application Details</DialogTitle>
                                    <DialogDescription>
                                      Review the freelancer application
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  {selectedApplication && (
                                    <div className="space-y-6 py-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <h3 className="text-sm font-semibold">Applicant</h3>
                                          <p>{selectedApplication.user.profile.display_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <h3 className="text-sm font-semibold">Email</h3>
                                          <p>{selectedApplication.user.email}</p>
                                        </div>
                                        <div>
                                          <h3 className="text-sm font-semibold">Submitted</h3>
                                          <p>{new Date(selectedApplication.submitted_at).toLocaleString()}</p>
                                        </div>
                                        <div>
                                          <h3 className="text-sm font-semibold">Status</h3>
                                          <p>{renderApplicationStatus(selectedApplication.status)}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="border-t pt-4">
                                        <h3 className="text-lg font-medium mb-4">Application Answers</h3>
                                        <div className="space-y-4">
                                          {selectedApplication.freelancer_application_answers.map(answer => (
                                            <div key={answer.id} className="border rounded-md p-4">
                                              <h4 className="font-medium">{answer.question?.question}</h4>
                                              <p className="mt-1 whitespace-pre-wrap">
                                                {answer.answer || 'No answer provided'}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <DialogFooter>
                                    {selectedApplication && selectedApplication.status === 'pending' && (
                                      <>
                                        <Button
                                          variant="destructive"
                                          disabled={processing}
                                          onClick={() => handleApplicationAction(
                                            selectedApplication.id,
                                            'rejected',
                                            selectedApplication.user.id
                                          )}
                                        >
                                          {processing ? 
                                            <Loader2 className="h-4 w-4 animate-spin" /> : 
                                            <XCircle className="h-4 w-4 mr-2" />
                                          }
                                          Reject
                                        </Button>
                                        <Button
                                          variant="default"
                                          disabled={processing}
                                          onClick={() => handleApplicationAction(
                                            selectedApplication.id,
                                            'approved',
                                            selectedApplication.user.id
                                          )}
                                        >
                                          {processing ? 
                                            <Loader2 className="h-4 w-4 animate-spin" /> : 
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                          }
                                          Approve
                                        </Button>
                                      </>
                                    )}
                                    <DialogClose asChild>
                                      <Button variant="outline">Close</Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              {application.status === 'pending' && (
                                <>
                                  <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    onClick={() => handleApplicationAction(
                                      application.id, 
                                      'rejected',
                                      application.user.id
                                    )}
                                    disabled={processing}
                                  >
                                    {processing ? 
                                      <Loader2 className="h-4 w-4 animate-spin" /> : 
                                      <XCircle className="h-4 w-4" />
                                    }
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="icon" 
                                    onClick={() => handleApplicationAction(
                                      application.id, 
                                      'approved',
                                      application.user.id
                                    )}
                                    disabled={processing}
                                  >
                                    {processing ? 
                                      <Loader2 className="h-4 w-4 animate-spin" /> : 
                                      <CheckCircle className="h-4 w-4" />
                                    }
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            {/* Users Tab */}
            <TabsContent value="users">
              <Tabs defaultValue="freelancers">
                <TabsList>
                  <TabsTrigger value="freelancers">Freelancers</TabsTrigger>
                  <TabsTrigger value="buyers">Buyers</TabsTrigger>
                </TabsList>
                
                {/* Freelancers Subtab */}
                <TabsContent value="freelancers" className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {freelancers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              No freelancers found
                            </TableCell>
                          </TableRow>
                        ) : (
                          freelancers.map((freelancer) => (
                            <TableRow key={freelancer.id}>
                              <TableCell className="font-medium">
                                {freelancer.profile.display_name || freelancer.profile.username || 'N/A'}
                              </TableCell>
                              <TableCell>{freelancer.email}</TableCell>
                              <TableCell>
                                {renderUserStatus(freelancer.profile.account_status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="icon">
                                        <UserCog className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Update User Status</DialogTitle>
                                      </DialogHeader>
                                      <div className="py-4">
                                        <div className="space-y-4">
                                          <Button
                                            variant="default"
                                            className="w-full"
                                            disabled={freelancer.profile.account_status === 'active' || processing}
                                            onClick={() => handleUserStatusChange(freelancer.id, 'active')}
                                          >
                                            Set as Active
                                          </Button>
                                          <Button
                                            variant="secondary"
                                            className="w-full"
                                            disabled={freelancer.profile.account_status === 'suspended' || processing}
                                            onClick={() => handleUserStatusChange(freelancer.id, 'suspended')}
                                          >
                                            Suspend Account
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                {/* Buyers Subtab */}
                <TabsContent value="buyers" className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buyers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              No buyers found
                            </TableCell>
                          </TableRow>
                        ) : (
                          buyers.map((buyer) => (
                            <TableRow key={buyer.id}>
                              <TableCell className="font-medium">
                                {buyer.profile.display_name || buyer.profile.username || 'N/A'}
                              </TableCell>
                              <TableCell>{buyer.email}</TableCell>
                              <TableCell>
                                {renderUserStatus(buyer.profile.account_status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="icon">
                                        <UserCog className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Update User Status</DialogTitle>
                                      </DialogHeader>
                                      <div className="py-4">
                                        <div className="space-y-4">
                                          <Button
                                            variant="default"
                                            className="w-full"
                                            disabled={buyer.profile.account_status === 'active' || processing}
                                            onClick={() => handleUserStatusChange(buyer.id, 'active')}
                                          >
                                            Set as Active
                                          </Button>
                                          <Button
                                            variant="secondary"
                                            className="w-full"
                                            disabled={buyer.profile.account_status === 'suspended' || processing}
                                            onClick={() => handleUserStatusChange(buyer.id, 'suspended')}
                                          >
                                            Suspend Account
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            {/* Questions Tab */}
            <TabsContent value="questions">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Create New Question</CardTitle>
                  <CardDescription>Add a new question to the freelancer application</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question Text</Label>
                    <Input
                      id="question"
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Enter question text"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="required"
                      checked={newQuestion.required}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, required: e.target.checked }))}
                    />
                    <Label htmlFor="required">Required question</Label>
                  </div>
                  <Button
                    onClick={handleCreateQuestion}
                    disabled={!newQuestion.question.trim() || processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : 'Add Question'}
                  </Button>
                </CardContent>
              </Card>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No questions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      questions.map((question, index) => (
                        <TableRow key={question.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {question.question}
                          </TableCell>
                          <TableCell>
                            {question.required ? 'Yes' : 'No'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => setSelectedQuestion(question)}
                                  >
                                    <PencilLine className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Question</DialogTitle>
                                  </DialogHeader>
                                  
                                  {selectedQuestion && (
                                    <div className="py-4 space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-question">Question Text</Label>
                                        <Textarea
                                          id="edit-question"
                                          value={selectedQuestion.question}
                                          onChange={(e) => setSelectedQuestion({
                                            ...selectedQuestion,
                                            question: e.target.value
                                          })}
                                        />
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id="edit-required"
                                          checked={selectedQuestion.required}
                                          onChange={(e) => setSelectedQuestion({
                                            ...selectedQuestion,
                                            required: e.target.checked
                                          })}
                                        />
                                        <Label htmlFor="edit-required">Required question</Label>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => setSelectedQuestion(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => selectedQuestion && handleUpdateQuestion(selectedQuestion)}
                                      disabled={processing}
                                    >
                                      {processing ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Saving...
                                        </>
                                      ) : 'Save Changes'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                variant="destructive" 
                                size="icon"
                                onClick={() => handleDeleteQuestion(question.id)}
                                disabled={processing}
                              >
                                {processing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 