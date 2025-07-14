import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
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
  const { user, profile, isFreelancer, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [application, setApplication] = useState<Application | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  console.log('FreelancerApplication rendering', { user, profile, loading });

  useEffect(() => {
    console.log('FreelancerApplication useEffect triggered', { user, profile, loading });
    
    // If not logged in and authentication is done loading, redirect to auth page
    if (!user && profile === null) {
      console.log('Redirecting to auth, no user found');
      navigate('/auth');
      return;
    }

    // If user is not a buyer or freelancer, redirect to home
    if (profile && profile.role !== 'buyer' && profile.role !== 'freelancer') {
      console.log('Redirecting to home, user is not buyer or freelancer', profile.role);
      navigate('/');
      return;
    }

    // Only fetch data if we have a user
    if (user) {
      console.log('User exists, calling fetchApplicationData');
      fetchApplicationData();
    } else {
      // If we're still waiting for user data, keep loading state true
      console.log('No user yet, waiting...');
    }
  }, [user, profile, navigate]);

  const fetchApplicationData = async () => {
    console.log('Starting fetchApplicationData');
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching application data for user', user?.id);
      // Check if user already has an application
      const { data: applications, error: appError } = await supabase
        .from('freelancer_applications')
        .select('*, freelancer_application_answers(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Application query result:', { applications, appError });
      if (appError) {
        if (appError.message && appError.message.includes('does not exist')) {
          console.error('Table does not exist:', appError.message);
          setError('The required database tables do not exist. Please ensure migrations have been run.');
          toast({
            title: "Database setup required",
            description: "The freelancer application tables are not set up. Please contact the administrator.",
            variant: "destructive",
          });
          return; // Exit early but still set loading to false in finally block
        }
        throw appError;
      }

      const appData = applications && applications.length > 0 ? applications[0] : null;
      setApplication(appData);
      console.log('Application data set:', appData);
      
      if (appData?.freelancer_application_answers) {
        console.log('Pre-populating answers from existing application');
        // Pre-populate answers
        const answerMap: Record<string, string> = {};
        appData.freelancer_application_answers.forEach((answer: ApplicationAnswer) => {
          answerMap[answer.question_id] = answer.answer || '';
        });
        setAnswers(answerMap);
        console.log('Answers pre-populated:', answerMap);
      }

      // Fetch questions
      console.log('Fetching questions');
      const { data: questionsData, error: questionsError } = await supabase
        .from('freelancer_questions')
        .select('*')
        .order('order_position', { ascending: true });
      
      console.log('Questions query result:', { questionsData, questionsError });
      
      if (questionsError) {
        if (questionsError.message && questionsError.message.includes('does not exist')) {
          console.error('freelancer_questions table does not exist');
          setError('The questions table does not exist. Please ensure migrations have been run.');
          toast({
            title: "Database setup required",
            description: "The freelancer questions table is not set up. Please contact the administrator.",
            variant: "destructive",
          });
          return; // Exit early but still set loading to false in finally block
        }
        throw questionsError;
      }
      
      // If no questions found
      if (!questionsData || questionsData.length === 0) {
        console.warn('No questions found in the database');
        setError('No application questions found. Please contact the administrator.');
        toast({
          title: "Configuration Issue",
          description: "No application questions were found. Please contact the administrator.",
          variant: "destructive",
        });
        // We'll still set questions to empty array and proceed
        setQuestions([]);
        return;
      }
      
      setQuestions(questionsData);
      console.log('Questions set:', questionsData);
      
      // Initialize answers object with empty strings if not already set
      if (!appData?.freelancer_application_answers) {
        console.log('Initializing empty answers');
        const initialAnswers: Record<string, string> = {};
        questionsData?.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
        console.log('Empty answers initialized:', initialAnswers);
      }
    } catch (error: unknown) {
      console.error('Error fetching application data:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError('Failed to load application data. Please try again later.');
      
      let description = 'Failed to load application data. Please check your network connection.';
      if (errorMessage.includes('fetch')) {
        description = 'A network error occurred. Please ensure you are connected to the internet and that Supabase services are available.';
      }
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    } finally {
      console.log('Finished fetchApplicationData, setting loading to false');
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleDeleteApplication = async () => {
    setSubmitting(true);
    try {
      if (!user || !application?.id) throw new Error('No application to delete or user not authenticated');

      // Delete answers first
      const { error: answersError } = await supabase
        .from('freelancer_application_answers')
        .delete()
        .eq('application_id', application.id);

      if (answersError) throw answersError;

      // Then delete the application
      const { error: appError } = await supabase
        .from('freelancer_applications')
        .delete()
        .eq('id', application.id);

      if (appError) throw appError;

      // Update profile status back to 'active' or default
      await supabase
        .from('profiles')
        .update({ account_status: 'active' }) // Assuming 'active' is the default for non-freelancers
        .eq('user_id', user.id);

      await refreshProfile();

      setApplication(null);
      setAnswers({}); // Clear answers
      toast({
        title: 'Application deleted',
        description: 'Your freelancer application has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete application.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false); // Close the dialog
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Check required fields
      const missingRequired = questions
        .filter(q => q.required && !answers[q.id])
        .map(q => q.question);
      
      if (missingRequired.length > 0) {
        toast({
          title: 'Required fields missing',
          description: `Please answer all required questions`,
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      let applicationId = application?.id;

      // Create or update application
      if (!applicationId) {
        const { data: newApp, error: appError } = await supabase
          .from('freelancer_applications')
          .insert({
            user_id: user.id,
            status: 'pending',
            submitted_at: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (appError) throw appError;
        applicationId = newApp.id;
      } else {
        // Update existing application
        await supabase
          .from('freelancer_applications')
          .update({
            status: 'pending', 
            updated_at: new Date().toISOString(),
            submitted_at: new Date().toISOString()
          })
          .eq('id', applicationId);
      }

      // Create or update answers
      for (const questionId in answers) {
        if (application?.freelancer_application_answers?.some((a: ApplicationAnswer) => a.question_id === questionId)) {
          // Update existing answer
          await supabase
            .from('freelancer_application_answers')
            .update({
              answer: answers[questionId],
              updated_at: new Date().toISOString()
            })
            .eq('application_id', applicationId)
            .eq('question_id', questionId);
        } else {
          // Create new answer
          await supabase
            .from('freelancer_application_answers')
            .insert({
              application_id: applicationId,
              question_id: questionId,
              answer: answers[questionId],
            });
        }
      }

      // Update profile status
      await supabase
        .from('profiles')
        .update({ account_status: 'pending_approval' })
        .eq('user_id', user.id);
      
      await refreshProfile();

      toast({
        title: 'Application submitted',
        description: 'Your application is under review. We\'ll notify you once it\'s approved.',
      });

      // Update local application data
      setApplication(prev => ({
        ...prev,
        status: 'pending',
      }));

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error Loading Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p className="mt-4">Please ensure that:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>The database migrations have been run</li>
              <li>You have an internet connection</li>
              <li>The Supabase service is available</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={fetchApplicationData}>Try Again</Button>
            <Button variant="outline" className="ml-2" onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </CardFooter>
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
            {application?.status === 'pending' 
              ? 'Your application is currently under review.' 
              : application?.status === 'rejected'
              ? 'Your previous application was rejected. You can update and resubmit.'
              : 'Complete this application to join our freelancer network.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <div className="flex items-center">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {question.question}
                  {question.required && <span className="text-destructive ml-1">*</span>}
                </label>
              </div>
              <Textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Your answer"
                className="min-h-[100px]"
                disabled={application?.status === 'pending'}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {application && application.status !== 'approved' && (
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={submitting}
            >
              Delete Application
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || application?.status === 'pending'}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {application?.status === 'rejected' ? 'Resubmit Application' : 'Submit Application'}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your freelancer application 
              and you will need to submit a new one if you wish to apply again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteApplication} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 