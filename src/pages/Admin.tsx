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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, UserCog, Eye, Loader2, PencilLine, Trash2, Link as LinkIcon } from 'lucide-react';
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

interface ApplicationAnswer {
  id: string;
  question_id: string;
  answer: string;
}

interface FreelancerApplication {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  user: User;
  freelancer_application_answers: ApplicationAnswer[];
}

interface Question {
  id: string;
  question: string;
  required: boolean;
  order_position: number;
  type: 'text' | 'file';
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
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ question: '', required: true, type: 'text' as 'text' | 'file' });

  useEffect(() => {
    if (!user && !loadingUsers) {
      navigate('/auth');
      return;
    }
    if (profile && !isAdmin && !loadingUsers) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, profile, isAdmin, navigate, toast]);

  const fetchData = async () => {
    setLoadingUsers(true);
    setLoadingApplications(true);
    setLoadingQuestions(true);

    try {
      // Fetch questions first
      const { data: questionsData, error: questionsError } = await supabase.from('freelancer_questions').select('*').order('order_position', { ascending: true });
      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
      setLoadingQuestions(false);

      // Fetch users
      let userEmailMap = new Map<string, string>();
      if (hasServiceRoleKey()) {
        try {
          const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
          if (authError) throw authError;
          const authUsersData = authUsers as { users: Array<{ id: string; email?: string | null }> };
          authUsersData.users.forEach(u => userEmailMap.set(u.id, u.email || 'No email'));
        } catch (adminError) {
          toast({ title: 'Limited Email Access', description: 'To view all user emails, add your Supabase service role key to .env' });
        }
      } else {
        toast({ title: 'Limited Email Access', description: 'To view all user emails, add your Supabase service role key to .env' });
      }
      if (user?.id && user?.email) userEmailMap.set(user.id, user.email);

      const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      const usersWithProfiles = profilesData.map(p => ({
        id: p.user_id,
        email: userEmailMap.get(p.user_id) || 'No email found',
        profile: { id: p.id, display_name: p.display_name, avatar_url: p.avatar_url, role: p.role, account_status: p.account_status, username: p.username }
      }));

      setBuyers(usersWithProfiles.filter(u => u.profile.role === 'buyer'));
      setFreelancers(usersWithProfiles.filter(u => u.profile.role === 'freelancer'));
      setLoadingUsers(false);

      // Fetch applications and their answers
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('freelancer_applications')
        .select(`*, freelancer_application_answers(*)`)
        .order('submitted_at', { ascending: false });
      if (applicationsError) throw applicationsError;

      const formattedApplications = applicationsData.map(app => ({
        ...app,
        user: usersWithProfiles.find(u => u.id === app.user_id) || { id: app.user_id, email: 'User not found', profile: { id: 'unknown', display_name: 'Unknown User', avatar_url: null, role: 'unknown', account_status: 'unknown', username: 'unknown' } },
        freelancer_application_answers: app.freelancer_application_answers
      }));
      setApplications(formattedApplications as FreelancerApplication[]);
      setLoadingApplications(false);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({ title: 'Error', description: 'Failed to load admin data.', variant: 'destructive' });
      setLoadingUsers(false); setLoadingApplications(false); setLoadingQuestions(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, status: 'approved' | 'rejected', userId: string) => {
    setProcessing(true);
    try {
      await supabase.from('freelancer_applications').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id }).eq('id', applicationId);
      await supabase.from('profiles').update({ account_status: status === 'approved' ? 'active' : 'rejected' }).eq('user_id', userId);
      setApplications(applications.map(app => app.id === applicationId ? { ...app, status } : app));
      toast({ title: `Application ${status}`, description: `The freelancer application has been ${status}.` });
      setIsReviewDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: `Failed to ${status} application`, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleUserStatusChange = async (userId: string, status: string) => {
    setProcessing(true);
    try {
      await supabase.from('profiles').update({ account_status: status }).eq('user_id', userId);
      toast({ title: 'Status Updated', description: `User status has been updated to ${status}.` });
      setBuyers(buyers.map(u => u.id === userId ? { ...u, profile: { ...u.profile, account_status: status }} : u));
      setFreelancers(freelancers.map(u => u.id === userId ? { ...u, profile: { ...u.profile, account_status: status }} : u));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateQuestion = async (question: Question) => {
    setProcessing(true);
    try {
      await supabase.from('freelancer_questions').update({ question: question.question, required: question.required, type: question.type }).eq('id', question.id);
      toast({ title: 'Question Updated', description: 'The question has been successfully updated.' });
      setQuestions(questions.map(q => q.id === question.id ? question : q));
      setIsQuestionDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update question', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateQuestion = async () => {
    setProcessing(true);
    try {
      const highestPosition = questions.length > 0 ? Math.max(...questions.map(q => q.order_position)) : 0;
      const { data, error } = await supabase.from('freelancer_questions').insert({ ...newQuestion, order_position: highestPosition + 1 }).select('*').single();
      if (error) throw error;
      toast({ title: 'Question Created', description: 'The new question has been added.' });
      setQuestions([...questions, data]);
      setNewQuestion({ question: '', required: true, type: 'text' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create question', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setProcessing(true);
    try {
      await supabase.from('freelancer_questions').delete().eq('id', questionId);
      toast({ title: 'Question Deleted', description: 'The question has been removed.' });
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete question', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const renderUserStatus = (status: string) => {
    const variants = { active: 'success', pending_application: 'warning', pending_approval: 'warning', suspended: 'destructive', rejected: 'destructive' };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const renderApplicationStatus = (status: string) => {
    const variants = { approved: 'success', pending: 'warning', rejected: 'destructive' };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const questionsMap = new Map(questions.map(q => [q.id, q]));

  if (loadingUsers || loadingApplications || loadingQuestions) {
    return <div className="container max-w-6xl mx-auto py-8 px-4 flex justify-center items-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div><CardTitle>Admin Dashboard</CardTitle><CardDescription>Manage users, applications, and system settings</CardDescription></div>
            <Button variant="outline" onClick={() => navigate('/db-setup')}>Database Setup</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8"><TabsTrigger value="applications">Freelancer Applications</TabsTrigger><TabsTrigger value="users">Users Management</TabsTrigger><TabsTrigger value="questions">Application Questions</TabsTrigger></TabsList>
            <TabsContent value="applications">
              <div className="rounded-md border">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {applications.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No applications found</TableCell></TableRow> : applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.user.profile.display_name || application.user.profile.username || 'N/A'}</TableCell>
                        <TableCell>{application.user.email}</TableCell>
                        <TableCell>{new Date(application.submitted_at).toLocaleDateString()}</TableCell>
                        <TableCell>{renderApplicationStatus(application.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog open={isReviewDialogOpen && selectedApplication?.id === application.id} onOpenChange={(open) => { if (!open) setSelectedApplication(null); setIsReviewDialogOpen(open); }}>
                              <DialogTrigger asChild><Button variant="outline" size="icon" onClick={() => { setSelectedApplication(application); setIsReviewDialogOpen(true); }}><Eye className="h-4 w-4" /></Button></DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader><DialogTitle>Application Details</DialogTitle><DialogDescription>Review the freelancer application</DialogDescription></DialogHeader>
                                {selectedApplication && <div className="space-y-6 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><h3 className="text-sm font-semibold">Applicant</h3><p>{selectedApplication.user.profile.display_name || 'N/A'}</p></div>
                                    <div><h3 className="text-sm font-semibold">Email</h3><p>{selectedApplication.user.email}</p></div>
                                    <div><h3 className="text-sm font-semibold">Submitted</h3><p>{new Date(selectedApplication.submitted_at).toLocaleString()}</p></div>
                                    <div><h3 className="text-sm font-semibold">Status</h3><p>{renderApplicationStatus(selectedApplication.status)}</p></div>
                                  </div>
                                  <div className="border-t pt-4"><h3 className="text-lg font-medium mb-4">Application Answers</h3><div className="space-y-4">
                                    {selectedApplication.freelancer_application_answers.map(answer => {
                                      const question = questionsMap.get(answer.question_id);
                                      return (
                                        <div key={answer.id} className="border rounded-md p-4">
                                          <h4 className="font-medium">{question?.question || 'Question not found'}</h4>
                                          {question?.type === 'file' && answer.answer ? (
                                            <a href={answer.answer} target="_blank" rel="noopener noreferrer" className="text-sm inline-flex items-center gap-2 mt-2 text-blue-600 hover:underline">
                                              <LinkIcon className="h-4 w-4" /> View Uploaded File
                                            </a>
                                          ) : (
                                            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{answer.answer || 'No answer provided'}</p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div></div>
                                </div>}
                                <DialogFooter>
                                  {selectedApplication?.status === 'pending' && <>
                                    <Button variant="destructive" disabled={processing} onClick={() => handleApplicationAction(selectedApplication.id, 'rejected', selectedApplication.user.id)}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}Reject</Button>
                                    <Button variant="default" disabled={processing} onClick={() => handleApplicationAction(selectedApplication.id, 'approved', selectedApplication.user.id)}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}Approve</Button>
                                  </>}
                                  <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>Close</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            {application.status === 'pending' && <>
                              <Button variant="destructive" size="icon" onClick={() => handleApplicationAction(application.id, 'rejected', application.user.id)} disabled={processing}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}</Button>
                              <Button variant="default" size="icon" onClick={() => handleApplicationAction(application.id, 'approved', application.user.id)} disabled={processing}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}</Button>
                            </>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="users">
              <Tabs defaultValue="freelancers">
                <TabsList><TabsTrigger value="freelancers">Freelancers</TabsTrigger><TabsTrigger value="buyers">Buyers</TabsTrigger></TabsList>
                <TabsContent value="freelancers" className="mt-4">
                  <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                    {freelancers.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No freelancers found</TableCell></TableRow> : freelancers.map((freelancer) => <TableRow key={freelancer.id}><TableCell className="font-medium">{freelancer.profile.display_name || freelancer.profile.username || 'N/A'}</TableCell><TableCell>{freelancer.email}</TableCell><TableCell>{renderUserStatus(freelancer.profile.account_status)}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Dialog><DialogTrigger asChild><Button variant="outline" size="icon"><UserCog className="h-4 w-4" /></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Update User Status</DialogTitle></DialogHeader><div className="py-4 space-y-4"><Button variant="default" className="w-full" disabled={freelancer.profile.account_status === 'active' || processing} onClick={() => handleUserStatusChange(freelancer.id, 'active')}>Set as Active</Button><Button variant="secondary" className="w-full" disabled={freelancer.profile.account_status === 'suspended' || processing} onClick={() => handleUserStatusChange(freelancer.id, 'suspended')}>Suspend Account</Button></div></DialogContent></Dialog></div></TableCell></TableRow>)}
                  </TableBody></Table></div>
                </TabsContent>
                <TabsContent value="buyers" className="mt-4">
                  <div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                    {buyers.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No buyers found</TableCell></TableRow> : buyers.map((buyer) => <TableRow key={buyer.id}><TableCell className="font-medium">{buyer.profile.display_name || buyer.profile.username || 'N/A'}</TableCell><TableCell>{buyer.email}</TableCell><TableCell>{renderUserStatus(buyer.profile.account_status)}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Dialog><DialogTrigger asChild><Button variant="outline" size="icon"><UserCog className="h-4 w-4" /></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Update User Status</DialogTitle></DialogHeader><div className="py-4 space-y-4"><Button variant="default" className="w-full" disabled={buyer.profile.account_status === 'active' || processing} onClick={() => handleUserStatusChange(buyer.id, 'active')}>Set as Active</Button><Button variant="secondary" className="w-full" disabled={buyer.profile.account_status === 'suspended' || processing} onClick={() => handleUserStatusChange(buyer.id, 'suspended')}>Suspend Account</Button></div></DialogContent></Dialog></div></TableCell></TableRow>)}
                  </TableBody></Table></div>
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="questions">
              <Card className="mb-6">
                <CardHeader><CardTitle>Create New Question</CardTitle><CardDescription>Add a new question to the freelancer application</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="question">Question Text</Label><Input id="question" value={newQuestion.question} onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))} placeholder="Enter question text" /></div>
                  <div className="space-y-2"><Label htmlFor="question-type">Question Type</Label><select id="question-type" value={newQuestion.type} onChange={(e) => setNewQuestion(prev => ({ ...prev, type: e.target.value as 'text' | 'file' }))} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><option value="text">Text</option><option value="file">File Upload</option></select></div>
                  <div className="flex items-center space-x-2"><input type="checkbox" id="required" checked={newQuestion.required} onChange={(e) => setNewQuestion(prev => ({ ...prev, required: e.target.checked }))} /><Label htmlFor="required">Required question</Label></div>
                  <Button onClick={handleCreateQuestion} disabled={!newQuestion.question.trim() || processing}>{processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Add Question'}</Button>
                </CardContent>
              </Card>
              <div className="rounded-md border">
                <Table><TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Question</TableHead><TableHead>Type</TableHead><TableHead>Required</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
                  {questions.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No questions found</TableCell></TableRow> : questions.map((question, index) => <TableRow key={question.id}><TableCell>{index + 1}</TableCell><TableCell className="font-medium">{question.question}</TableCell><TableCell><Badge variant="outline">{question.type}</Badge></TableCell><TableCell>{question.required ? 'Yes' : 'No'}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2">
                    <Dialog open={isQuestionDialogOpen && selectedQuestion?.id === question.id} onOpenChange={(open) => { if (!open) setSelectedQuestion(null); setIsQuestionDialogOpen(open); }}>
                      <DialogTrigger asChild><Button variant="outline" size="icon" onClick={() => { setSelectedQuestion(question); setIsQuestionDialogOpen(true); }}><PencilLine className="h-4 w-4" /></Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Edit Question</DialogTitle></DialogHeader>
                        {selectedQuestion && <div className="py-4 space-y-4">
                          <div className="space-y-2"><Label htmlFor="edit-question">Question Text</Label><Textarea id="edit-question" value={selectedQuestion.question} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, question: e.target.value })} /></div>
                          <div className="space-y-2"><Label htmlFor="edit-question-type">Question Type</Label><select id="edit-question-type" value={selectedQuestion.type} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, type: e.target.value as 'text' | 'file' })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><option value="text">Text</option><option value="file">File Upload</option></select></div>
                          <div className="flex items-center space-x-2"><input type="checkbox" id="edit-required" checked={selectedQuestion.required} onChange={(e) => setSelectedQuestion({ ...selectedQuestion, required: e.target.checked })} /><Label htmlFor="edit-required">Required question</Label></div>
                        </div>}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Cancel</Button>
                          <Button onClick={() => selectedQuestion && handleUpdateQuestion(selectedQuestion)} disabled={processing}>{processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteQuestion(question.id)} disabled={processing}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</Button>
                  </div></TableCell></TableRow>)}
                </TableBody></Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}