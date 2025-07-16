import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

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
  buyer?: {
    profiles: {
      username?: string;
      display_name?: string;
      avatar_url?: string;
    };
  };
  freelancer?: {
    profiles: {
      username?: string;
      display_name?: string;
      avatar_url?: string;
    };
  };
}

interface MessageChatProps {
  conversationId?: string; // For an existing conversation
  postId?: string; // For starting a new conversation from a post
  freelancerId?: string; // For starting a new conversation with a freelancer
  onClose?: () => void;
}

export function MessageChat({ conversationId, postId, freelancerId, onClose }: MessageChatProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<{
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null>(null);

  const markMessagesAsRead = useCallback(async () => {
    if (!conversation || !user) return;
    
    try {
      // Call the stored function to mark messages as read
      await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversation.id,
        p_user_id: user.id
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [conversation, user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender_profile:profiles!messages_sender_id_fkey(username, display_name, avatar_url)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      setMessages(data || []);
      markMessagesAsRead();
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [markMessagesAsRead]);

  const loadExistingConversation = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // Load conversation details
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .select(`
          *,
          post:freelancer_posts!conversations_post_id_fkey (title),
          buyer_profile:profiles!conversations_buyer_id_fkey (username, display_name, avatar_url),
          freelancer_profile:profiles!conversations_freelancer_id_fkey (username, display_name, avatar_url)
        `)
        .eq("id", id)
        .single();
      
      if (conversationError) throw conversationError;
      
      setConversation(conversationData);
      
      // Determine the other user in the conversation
      const isUserBuyer = conversationData.buyer_id === user?.id;
      const otherUserData = isUserBuyer 
        ? {
            id: conversationData.freelancer_id,
            displayName: conversationData.freelancer_profile?.display_name || 
                        conversationData.freelancer_profile?.username || 
                        "Freelancer",
            avatarUrl: conversationData.freelancer_profile?.avatar_url
          }
        : {
            id: conversationData.buyer_id,
            displayName: conversationData.buyer_profile?.display_name || 
                        conversationData.buyer_profile?.username || 
                        "Buyer",
            avatarUrl: conversationData.buyer_profile?.avatar_url
          };
      
      setOtherUser(otherUserData);
      
      // Load messages
      loadMessages(id);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, loadMessages]);

  const initNewConversation = useCallback(async (postId: string, freelancerId: string) => {
    setLoading(true);
    try {
      if (!user || !profile) {
        toast({
          title: "Authentication required",
          description: "Please login to message a freelancer",
          variant: "destructive",
        });
        return;
      }
      
      if (profile.role !== 'buyer') {
        toast({
          title: "Action not allowed",
          description: "Only buyers can initiate conversations",
          variant: "destructive",
        });
        return;
      }
      
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from("conversations")
        .select("id")
        .eq("post_id", postId)
        .eq("buyer_id", user.id)
        .eq("freelancer_id", freelancerId)
        .single();
      
      if (existingConversation) {
        // Conversation already exists, load it
        loadExistingConversation(existingConversation.id);
        return;
      }
      
      // Load freelancer info
      const { data: freelancerData, error: freelancerError } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", freelancerId)
        .single();
      
      if (freelancerError) throw freelancerError;
      
      // Load post info
      const { data: postData, error: postError } = await supabase
        .from("freelancer_posts")
        .select("title")
        .eq("id", postId)
        .single();
      
      if (postError) throw postError;
      
      // Set other user data
      setOtherUser({
        id: freelancerId,
        displayName: freelancerData?.display_name || freelancerData?.username || "Freelancer",
        avatarUrl: freelancerData?.avatar_url
      });
      
      // Create a new conversation object (will be saved when first message is sent)
      setConversation({
        id: "", // Will be filled when first message is sent
        post_id: postId,
        buyer_id: user.id,
        freelancer_id: freelancerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        post: { title: postData?.title },
        buyer: {
          profiles: {
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url
          }
        },
        freelancer: {
          profiles: {
            username: freelancerData?.username,
            display_name: freelancerData?.display_name,
            avatar_url: freelancerData?.avatar_url
          }
        }
      });
      
      setMessages([]);
    } catch (error) {
      console.error("Error initializing conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast, loadExistingConversation]);

  useEffect(() => {
    if (user) {
      if (conversationId) {
        loadExistingConversation(conversationId);
      } else if (postId && freelancerId && profile?.role === 'buyer') {
        // Buyer initiating a conversation about a post
        initNewConversation(postId, freelancerId);
      } else if (conversationId === undefined && postId === undefined && freelancerId === undefined) {
        // No props provided - invalid state
        toast({
          title: "Error",
          description: "Invalid chat parameters",
          variant: "destructive",
        });
      }
    }
  }, [user, conversationId, postId, freelancerId, profile, loadExistingConversation, initNewConversation, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to new messages for this conversation
  useEffect(() => {
    if (!conversation) return;
    
    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, (payload) => {
        // Add the new message to the messages list
        loadMessages(conversation.id);
      })
      .subscribe();
    
    // Mark messages as read when conversation is opened
    markMessagesAsRead();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, loadMessages, markMessagesAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to send messages",
        variant: "destructive",
      });
      return;
    }
    
    setSending(true);
    try {
      let activeConversationId = conversation?.id;
      
      // If this is a new conversation, create it first
      if (!activeConversationId && conversation) {
        const { data: newConversation, error: conversationError } = await supabase
          .from("conversations")
          .insert({
            post_id: conversation.post_id,
            buyer_id: conversation.buyer_id,
            freelancer_id: conversation.freelancer_id
          })
          .select()
          .single();
        
        if (conversationError) throw conversationError;
        
        activeConversationId = newConversation.id;
        setConversation({
          ...conversation,
          id: newConversation.id
        });
      }
      
      // Send the message
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: activeConversationId,
          sender_id: user.id,
          content: newMessage
        });
      
      if (messageError) throw messageError;
      
      // Clear the input
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={otherUser?.avatarUrl || ""} />
              <AvatarFallback>{getInitials(otherUser?.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{otherUser?.displayName}</CardTitle>
              {conversation?.post && (
                <p className="text-sm text-muted-foreground">
                  Re: {conversation.post.title}
                </p>
              )}
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="text-muted-foreground">
              <p>No messages yet.</p>
              <p className="text-sm">Send a message to start the conversation.</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === user?.id;
            const avatarUrl = isCurrentUser 
              ? profile?.avatar_url 
              : message.profiles?.avatar_url;
            const displayName = isCurrentUser 
              ? profile?.display_name || profile?.username || "You" 
              : message.profiles?.display_name || message.profiles?.username || "User";
              
            return (
              <div 
                key={message.id} 
                className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || ""} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                )}
                <div 
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    isCurrentUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 block mt-1">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {isCurrentUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl || ""} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      
      <CardFooter className="border-t p-3">
        <form 
          className="flex w-full items-center space-x-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
 