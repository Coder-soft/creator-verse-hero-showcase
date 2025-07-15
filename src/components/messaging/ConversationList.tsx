import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Conversation {
  id: string;
  post_id: string | null;
  buyer_id: string;
  freelancer_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  post?: {
    title: string;
  };
  buyer_profile?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  freelancer_profile?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  unread_count?: number;
  latest_message?: {
    content: string;
    created_at: string;
  };
}

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
}

export function ConversationList({ onSelectConversation, selectedConversationId }: ConversationListProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user's role to determine how to filter conversations
      const userRole = profile?.role;
      
      let query = supabase
        .from("conversations")
        .select(`
          *,
          post:freelancer_posts!conversations_post_id_fkey (title),
          buyer_profile:profiles!conversations_buyer_id_fkey (username, display_name, avatar_url),
          freelancer_profile:profiles!conversations_freelancer_id_fkey (username, display_name, avatar_url)
        `);
      
      if (userRole === 'buyer') {
        query = query.eq('buyer_id', user.id);
      } else if (userRole === 'freelancer') {
        query = query.eq('freelancer_id', user.id);
      } else {
        // Admin can see all, but we'll still filter by user id for simplicity
        query = query.or(`buyer_id.eq.${user.id},freelancer_id.eq.${user.id}`);
      }
      
      // Order by most recent message
      query = query.order('last_message_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;

      // Get the latest message and unread count for each conversation
      const conversationsWithMeta = await Promise.all(
        (data || []).map(async (conversation) => {
          // Get latest message
          const { data: latestMessageData } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          // Get unread count
          const { data: unreadCountData } = await supabase
            .from("messages")
            .select("id", { count: 'exact' })
            .eq("conversation_id", conversation.id)
            .eq("read", false)
            .neq("sender_id", user.id);

          return {
            ...conversation,
            latest_message: latestMessageData || undefined,
            unread_count: unreadCountData?.length || 0
          };
        })
      );
      
      setConversations(conversationsWithMeta);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast]);

  useEffect(() => {
    if (user) {
      loadConversations();

      // Subscribe to updates
      const channel = supabase
        .channel('conversation-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
        }, () => {
          // Reload conversations when messages change
          loadConversations();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, loadConversations]);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getOtherUserInfo = (conversation: Conversation) => {
    if (!user) return { displayName: "User", avatarUrl: null };
    
    const isUserBuyer = conversation.buyer_id === user.id;
    
    if (isUserBuyer) {
      return {
        displayName: conversation.freelancer_profile?.display_name || 
                    conversation.freelancer_profile?.username || 
                    "Freelancer",
        avatarUrl: conversation.freelancer_profile?.avatar_url
      };
    } else {
      return {
        displayName: conversation.buyer_profile?.display_name || 
                    conversation.buyer_profile?.username || 
                    "Buyer",
        avatarUrl: conversation.buyer_profile?.avatar_url
      };
    }
  };

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No conversations yet</h3>
          <p className="text-sm text-muted-foreground">
            Your conversations will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Conversations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-y-auto max-h-[500px]">
          {conversations.map((conversation) => {
            const { displayName, avatarUrl } = getOtherUserInfo(conversation);
            const isSelected = conversation.id === selectedConversationId;
            
            return (
              <Button
                key={conversation.id}
                variant={isSelected ? "secondary" : "ghost"}
                className={`w-full justify-start rounded-none p-3 h-auto ${
                  conversation.unread_count && !isSelected ? 'font-semibold' : ''
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-center w-full gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl || ""} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-sm truncate">{displayName}</h3>
                      <span className="text-xs text-muted-foreground">
                        {conversation.latest_message 
                          ? new Date(conversation.latest_message.created_at).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric' 
                            }) 
                          : new Date(conversation.created_at).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric'
                            })
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-muted-foreground truncate max-w-[80%]">
                        {conversation.post && (
                          <span className="text-primary">{conversation.post.title}: </span>
                        )}
                        {conversation.latest_message?.content || "No messages yet"}
                      </p>
                      {conversation.unread_count > 0 && !isSelected && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.5rem] text-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
 