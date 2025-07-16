import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PlusCircle, Pencil, Eye, Trash2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PostEditor } from "@/components/freelancer/PostEditor";
import { Badge } from "@/components/ui/badge";

interface Post {
  id: string;
  title: string;
  content: string;
  price: number;
  status: "draft" | "published" | "archived";
  cover_image_url?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function FreelancerPostsManager() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in or not a freelancer
    if (!loading && ((!user) || (profile && profile.role !== "freelancer"))) {
      toast({
        title: "Access denied",
        description: "You must be a freelancer to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, profile, loading, navigate, toast]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("freelancer_posts")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      
      setPosts((data || []).map(post => ({...post, status: post.status as 'published' | 'draft' | 'archived'})));
    } catch (error) {
      console.error("Error loading posts:", error);
      toast({
        title: "Error",
        description: "Failed to load your posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user, loadPosts]);

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    loadPosts();
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedPostId(null);
    loadPosts();
  };

  const handleDelete = async () => {
    if (!deletingPostId) return;
    
    try {
      const { error } = await supabase
        .from("freelancer_posts")
        .delete()
        .eq("id", deletingPostId);
      
      if (error) throw error;
      
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully",
      });
      
      loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingPostId(null);
    }
  };

  const filteredPosts = activeTab === "all" 
    ? posts 
    : posts.filter(post => post.status === activeTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold">My Posts</h1>
              <p className="text-muted-foreground mt-2">Manage your freelancer posts</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Create Post</span>
              </Button>
            </div>
          </div>
          
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full mb-8"
          >
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="h-40 bg-muted relative">
                    {post.cover_image_url ? (
                      <img 
                        src={post.cover_image_url} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-sm">No cover image</p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(post.status)}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg truncate">{post.title}</CardTitle>
                    <CardDescription>${post.price.toFixed(2)}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.content.replace(/[#*_~`]/g, '')}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/marketplace/post/${post.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setDeletingPostId(post.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border rounded-lg">
              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === "all" 
                  ? "You haven't created any posts yet." 
                  : `You don't have any ${activeTab} posts.`}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                Create your first post
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Create a new post to showcase your services to potential clients
            </DialogDescription>
          </DialogHeader>
          <PostEditor onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post
            </DialogDescription>
          </DialogHeader>
          {selectedPostId && (
            <PostEditor postId={selectedPostId} onSuccess={handleEditSuccess} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and remove it from the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 