import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';
import { Message, Profile } from '@/types';

export function useConversation(postId: string, freelancerId: string) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recipient, setRecipient] = useState<Profile | null>(null);

  const getRecipientProfile = useCallback(async () => {
    if (!freelancerId) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', freelancerId)
      .single();
    if (error) {
      console.error('Error fetching recipient profile:', error);
    } else {
      setRecipient(data);
    }
  }, [freelancerId]);

  const getOrCreateConversation = useCallback(async () => {
    if (!user) return null;

    const query = supabase
      .from('conversations')
      .select('id')
      .eq('post_id', postId)
      .eq('buyer_id', user.id)
      .eq('freelancer_id', freelancerId);

    const { data: existing, error: existingError } = await query;

    if (existingError) {
      console.error('Error fetching conversation:', existingError);
      return null;
    }

    if (existing && existing.length > 0) {
      if (existing.length > 1) {
        console.warn(`Duplicate conversations found for post ${postId}. Using the first one.`);
      }
      return existing[0].id;
    }

    const { data: newConversation, error: newError } = await supabase
      .from('conversations')
      .insert({
        post_id: postId,
        buyer_id: user.id,
        freelancer_id: freelancerId,
      })
      .select('id')
      .single();

    if (newError) {
      // This handles the race condition where another client created the conversation
      // between our SELECT and INSERT. The error code for unique violation is '23505'.
      if ((newError as any).code === '23505') {
        console.warn('Race condition on conversation creation. Re-fetching.');
        const { data: raceExisting, error: raceError } = await query;
        if (raceError || !raceExisting || raceExisting.length === 0) {
          console.error('Failed to fetch conversation after race condition:', raceError);
          return null;
        }
        return raceExisting[0].id;
      } else {
        console.error('Error creating conversation:', newError);
        return null;
      }
    }

    return newConversation.id;
  }, [user, postId, freelancerId]);

  const fetchMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(user_id, display_name, avatar_url)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data as any);
    }
  }, []);

  const markMessagesAsRead = useCallback(async (convId: string) => {
    if (!user) return;
    const { error } = await supabase.rpc('mark_messages_as_read', {
      p_conversation_id: convId,
      p_user_id: user.id,
    });
    if (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  useEffect(() => {
    getRecipientProfile();
  }, [getRecipientProfile]);

  useEffect(() => {
    const setupConversation = async () => {
      setLoading(true);
      const convId = await getOrCreateConversation();
      setConversationId(convId);

      if (convId) {
        await fetchMessages(convId);
        await markMessagesAsRead(convId);
      }
      setLoading(false);
    };

    if (user && postId && freelancerId) {
      setupConversation();
    }
  }, [getOrCreateConversation, fetchMessages, markMessagesAsRead, user, postId, freelancerId]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url')
            .eq('user_id', payload.new.sender_id)
            .single();

          if (error) {
            console.error('Error fetching sender profile for new message:', error);
            return;
          }
          
          const newMessage = {
            ...payload.new,
            sender: profile,
          } as Message;

          if (!messages.some(m => m.id === newMessage.id)) {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
            if (newMessage.sender_id !== user.id) {
              await markMessagesAsRead(conversationId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, messages, markMessagesAsRead, user]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !user || !recipient) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      read: false,
      updated_at: new Date().toISOString(),
      sender: {
        user_id: user.id,
        display_name: 'You',
        avatar_url: (user.user_metadata as any)?.avatar_url || null,
      },
    };

    setMessages((prev) => [...prev, newMessage]);

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });

    if (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    }
  };

  return { messages, sendMessage, loading, recipient, conversationId };
}