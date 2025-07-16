import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Upload, File, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Question {
  id: string;
  question: string;
  required: boolean;
  order_position: number;
  type: 'text' | 'file';
}

interface ApplicationAnswer {
  id: string;
  question_id: string;
  answer: string;
  application_id: string;
}

interface Application {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  freelancer_application_answers?: ApplicationAnswer[];
}

export default function FreelancerApplication() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fileAnswers, setFileAnswers] = useState<Record<string, File | null>>({});
  const [application, setApplication] = useState<Application | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchApplicationData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('freelancer_questions')
        .select('*')
        .order('order_position', { ascending: true });
      
      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      const { data: applications, error: appError } = await supabase
        .from('freelancer_applications')
        .select('*, freelancer_application_answers(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      const appData = applications && applications.length > 0 ? applications[0] : null;
      setApplication(appData);
      
      const initialAnswers: Record<string, string> = {};
      if (appData?.freelancer_application_answers) {
        appData.freelancer_application_answers.forEach((answer: ApplicationAnswer) => {
          initialAnswers[answer.question_id] = answer.answer || '';
        });
      }
      setAnswers(initialAnswers);

    } catch (error: unknown) {
      console.error('Error fetching application data:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError('Failed to load application data. Please try again later.');
      toast({
        title: "Error",
        description: 'Failed to load application data. Please check your network connection.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user && profile === null) {
      navigate('/auth');
      return;
    }
    if (profile && profile.role !== 'buyer' && profile.role !== 'freelancer') {
      navigate('/');
      return;
    }
    if (user) {
      fetchApplicationData();
    }
   }, [user, profile, navigate, fetchApplicationData]);

   // Redirect if application already approved or account set to active
   useEffect(() => {
     if (application?.status === 'approved' || profile?.account_status === 'active') {
       navigate('/profile');
     }
   }, [application?.status, profile?.account_status, navigate]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleFileChange = (questionId: string, file: File | null) => {
    setFileAnswers(prev => ({ ...prev, [questionId]: file }));
    if (!file) {
      setAnswers(prev => ({ ...prev, [questionId]: '' }));
    }
  };

  const handleDeleteApplication = async () => {
    setSubmitting(true);
    try {
      if (!user || !application?.id) throw new Error('No application to delete or user not authenticated');
      await supabase.from('freelancer_application_answers').delete().eq('application_id', application.id);
      await supabase.from('freelancer_applications').delete().eq('id', application.id);
      await supabase.from('profiles').update({ account_status: 'active' }).eq('user_id', user.id);
      await refreshProfile();
      setApplication(null);
      setAnswers({});
      toast({ title: 'Application deleted', description: 'Your freelancer application has been successfully deleted.' });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({ title: 'Error', description: 'Failed to delete application.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (!user) throw new Error('User not authenticated');

      const answersToSubmit = { ...answers };

      for (const questionId in fileAnswers) {
        const file = fileAnswers[questionId];
        if (file) {
          const fileExt = file.name.split('.').pop();
          const filePath = `application-uploads/${user.id}/${questionId}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('public').upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath);
          answersToSubmit[questionId] = urlData.publicUrl;
        }
      }

      const missingRequired = questions.filter(q => q.required && !answersToSubmit[q.id]).map(q => q.question);
      if (missingRequired.length > 0) {
        toast({ title: 'Required fields missing', description: `Please answer all required questions`, variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      let applicationId = application?.id;
      if (!applicationId) {
        const { data: newApp, error: appError } = await supabase.from('freelancer_applications').insert({ user_id: user.id, status: 'pending', submitted_at: new Date().toISOString() }).select('id').single();
        if (appError) throw appError;
        applicationId = newApp.id;
      } else {
        await supabase.from('freelancer_applications').update({ status: 'pending', updated_at: new Date().toISOString(), submitted_at: new Date().toISOString() }).eq('id', applicationId);
      }

      const answersToUpsert = Object.keys(answersToSubmit)
        .map(questionId => ({
          application_id: applicationId,
          question_id: questionId,
          answer: answersToSubmit[questionId]
        }));

      if (answersToUpsert.length > 0) {
        const { error } = await supabase
          .from('freelancer_application_answers')
          .upsert(answersToUpsert, { onConflict: 'application_id,question_id' });
        
        if (error) throw error;
      }

      await supabase.from('profiles').update({ account_status: 'pending_approval' }).eq('user_id', user.id);
      await refreshProfile();
      toast({ title: 'Application submitted', description: 'Your application is under review.' });
      setApplication(prev => ({ ...prev, status: 'pending' }));
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({ title: 'Error', description: 'Failed to submit application', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container max-w-3xl mx-auto py-8 px-4 flex justify-center items-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  
  if (error) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center text-destructive"><AlertTriangle className="h-5 w-5 mr-2" />Error Loading Application</CardTitle></CardHeader>
          <CardContent><p>{error}</p></CardContent>
          <CardFooter><Button onClick={fetchApplicationData}>Try Again</Button></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Freelancer Application</CardTitle>
          <CardDescription>
            {application?.status === 'pending' ? 'Your application is currently under review.' : application?.status === 'rejected' ? 'Your previous application was rejected. You can update and resubmit.' : 'Complete this application to join our freelancer network.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <label className="text-sm font-medium leading-none">{question.question}{question.required && <span className="text-destructive ml-1">*</span>}</label>
              {question.type === 'file' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor={`file-upload-${question.id}`} className="cursor-pointer w-full">
                      <Button variant="outline" asChild className="w-full">
                        <div>
                          <Upload className="mr-2 h-4 w-4" />
                          <span>{fileAnswers[question.id] ? 'Change file' : 'Upload file'}</span>
                          <Input id={`file-upload-${question.id}`} type="file" className="hidden" onChange={(e) => handleFileChange(question.id, e.target.files ? e.target.files[0] : null)} disabled={application?.status === 'pending'} />
                        </div>
                      </Button>
                    </label>
                  </div>
                  {(answers[question.id] && !fileAnswers[question.id]) && (
                    <div className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                      <a href={answers[question.id]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 truncate hover:underline">
                        <File className="h-4 w-4" />
                        <span className="truncate">View Uploaded File</span>
                      </a>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFileChange(question.id, null)}><X className="h-4 w-4" /></Button>
                    </div>
                  )}
                  {fileAnswers[question.id] && (
                    <div className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                      <p className="flex items-center gap-2 truncate"><File className="h-4 w-4" /><span className="truncate">{fileAnswers[question.id]?.name}</span></p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFileChange(question.id, null)}><X className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              ) : (
                <Textarea value={answers[question.id] || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder="Your answer" className="min-h-[100px]" disabled={application?.status === 'pending'} />
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {application && application.status !== 'approved' && (<Button variant="outline" onClick={() => setShowDeleteConfirm(true)} disabled={submitting}>Delete Application</Button>)}
          <Button onClick={handleSubmit} disabled={submitting || application?.status === 'pending' || application?.status === 'approved'}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{application?.status === 'rejected' ? 'Resubmit Application' : application?.status === 'approved' ? 'Application Approved' : 'Submit Application'}</Button>
        </CardFooter>
      </Card>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete your freelancer application.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteApplication} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}