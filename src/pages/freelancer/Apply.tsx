import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type Question = {
  id: string;
  question: string;
  required: boolean;
  type: 'text' | 'textarea';
};

const fetchQuestions = async () => {
  const { data, error } = await supabase
    .from('freelancer_questions')
    .select('*')
    .order('order_position', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Question[];
};

const fetchUserApplication = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('freelancer_applications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
    
    if (error) throw new Error(error.message);
    return data;
}

const Apply = () => {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  const { data: questions, isLoading: isLoadingQuestions, error: questionsError } = useQuery({
    queryKey: ['freelancer_questions'],
    queryFn: fetchQuestions,
  });

  const { data: application, isLoading: isLoadingApplication } = useQuery({
      queryKey: ['user_application'],
      queryFn: fetchUserApplication
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to apply.');

      const { data: appData, error: appError } = await supabase
        .from('freelancer_applications')
        .insert({ user_id: user.id, status: 'pending', submitted_at: new Date().toISOString() })
        .select()
        .single();

      if (appError) throw appError;

      const answerPayload = Object.keys(answers).map(questionId => ({
          application_id: appData.id,
          question_id: questionId,
          answer: answers[questionId]
      }));

      const { error: answersError } = await supabase
        .from('freelancer_application_answers')
        .insert(answerPayload);

      if (answersError) throw answersError;
    },
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['user_application'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit application: ${error.message}`);
    },
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (isLoadingQuestions || isLoadingApplication) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (questionsError) {
    return <div className="text-red-500">Error loading questions: {questionsError.message}</div>;
  }

  if (application) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                  <CardDescription>You have already submitted an application.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p>Your application status is: <span className="font-semibold">{application.status}</span></p>
                  {application.submitted_at && <p>Submitted at: {new Date(application.submitted_at).toLocaleString()}</p>}
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Become a Freelancer</CardTitle>
        <CardDescription>Fill out the application below to join our platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions?.map(q => (
            <div key={q.id}>
              <Label htmlFor={q.id}>{q.question} {q.required && '*'}</Label>
              {q.type === 'textarea' ? (
                <Textarea
                  id={q.id}
                  value={answers[q.id] || ''}
                  onChange={e => handleAnswerChange(q.id, e.target.value)}
                  required={q.required}
                />
              ) : (
                <Input
                  id={q.id}
                  value={answers[q.id] || ''}
                  onChange={e => handleAnswerChange(q.id, e.target.value)}
                  required={q.required}
                />
              )}
            </div>
          ))}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Apply;