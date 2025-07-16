import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ConversationList } from "@/components/messaging/ConversationList";
import { MessageChat } from "@/components/messaging/MessageChat";

interface LocationState {
  postId?: string;
  freelancerId?: string;
}

export default function Messaging() {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const state = location.state as LocationState;
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    conversationId
  );
  const [postId, setPostId] = useState<string | undefined>(state?.postId);
  const [freelancerId, setFreelancerId] = useState<string | undefined>(state?.freelancerId);
  const [loading, setLoading] = useState(true);
  
  // Clear location state after reading it
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    // Update selectedConversationId when route parameter changes
    setSelectedConversationId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      toast({
        title: "Authentication required",
        description: "Please login to access your messages",
        variant: "destructive",
      });
      navigate("/auth");
    }
    setLoading(false);
  }, [user, loading, navigate, toast]);

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setPostId(undefined);
    setFreelancerId(undefined);
    // Update URL to include conversation ID
    navigate(`/messaging/${id}`);
  };

  const handleCloseChat = () => {
    setSelectedConversationId(undefined);
    setPostId(undefined);
    setFreelancerId(undefined);
    navigate('/messaging');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Messages</h1>
            <div className="h-[600px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Messages</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <ConversationList 
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId}
              />
            </div>
            
            <div className="lg:col-span-3">
              {selectedConversationId ? (
                <MessageChat
                  conversationId={selectedConversationId}
                  onClose={handleCloseChat}
                />
              ) : postId && freelancerId ? (
                <MessageChat
                  postId={postId}
                  freelancerId={freelancerId}
                  onClose={handleCloseChat}
                />
              ) : (
                <div className="h-[600px] flex items-center justify-center bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <h2 className="text-2xl font-medium mb-2">Select a conversation</h2>
                    <p className="text-muted-foreground">
                      Choose a conversation from the list or start a new one from the marketplace
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 