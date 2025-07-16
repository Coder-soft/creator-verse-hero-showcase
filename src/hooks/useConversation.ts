import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostgrestError } from '@supabase/supabase-js';

export const useConversation = (postId: string, freelancerId: string) => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    const getConversation = async () => {
      if (!user || !postId || !freelancerId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: findError } = await supabase
          .from('conversations')
          .select('id')
          .eq('post_id', postId)
          .eq('buyer_id', user.id)
          .eq('freelancer_id', freelancerId)
          .limit(1)
          .maybeSingle();

        if (findError) {
          setError(findError);
        } else if (data) {
          setConversationId(data.id);
        } else { // No conversation found, create one
          const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
              post_id: postId,
              buyer_id: user.id,
              freelancer_id: freelancerId,
            })
            .select('id')
            .single();

          if (createError) {
            setError(createError);
          } else if (newConversation) {
            setConversationId(newConversation.id);
          }
        }
      } catch (e: any) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    getConversation();
  }, [postId, freelancerId, user]);

  return { conversationId, loading, error };
};