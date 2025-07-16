import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface MessageStreamProps {
  conversationId: string;
}

export const MessageStream = ({ conversationId }: MessageStreamProps) => {
  const { user } = useAuth();
  const { data: messages, isLoading, error } = useMessages(conversationId);
  const queryClient = useQueryClient();
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const markAsRead = async () => {
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      });
      if (error) {
        console.error('Error marking messages as read:', error);
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    markAsRead();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on<Message>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
            return oldData ? [...oldData, payload.new] : [payload.new];
          });
          markAsRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, queryClient]);

  if (isLoading) return <div>Loading messages...</div>;
  if (error) return <div>Error loading messages: {error.message}</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages?.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={endOfMessagesRef} />
      </div>
      <MessageInput conversationId={conversationId} />
    </div>
  );
};