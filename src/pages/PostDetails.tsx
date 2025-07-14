import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Star, MessageSquare, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Post {
  id: string;
  title: string;
  content: string;
  price: number;
  category?: string;
  status: string;
  cover_image_url?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface Review {
  id: string;
  post_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export default function PostDetails() {
  const { id: postId } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  
  // Review form states
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load post and reviews
  useEffect(() => {
    if (postId) {
      loadPostAndReviews();
    }
  }, [postId]);

  const loadPostAndReviews = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      // Load post
      const { data: postData, error: postError } = await supabase
        .from("freelancer_posts")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("id", postId)
        .eq("status", "published")
        .single();
      
      if (postError) throw postError;
      if (!postData) throw new Error("Post not found");
      
      setPost(postData);
      
      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("freelancer_post_reviews")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });
      
      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);
      
      // Check if user has already reviewed
      if (user) {
        const userReviewData = reviewsData?.find(r => r.user_id === user.id) || null;
        setUserReview(userReviewData);
        
        if (userReviewData) {
          setRating(userReviewData.rating);
          setComment(userReviewData.comment || "");
        }
      }
    } catch (error) {
      console.error("Error loading post details:", error);
      toast({
        title: "Error",
        description: "Failed to load post details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to leave a review",
        variant: "destructive",
      });
      return;
    }
    
    if (!postId) return;
    
    setSubmitting(true);
    try {
      // Check if user is the post owner
      if (post?.user_id === user.id) {
        toast({
          title: "Cannot review your own post",
          description: "You cannot leave a review on your own post",
          variant: "destructive",
        });
        return;
      }
      
      // Check if user is a buyer
      if (profile?.role !== 'buyer') {
        toast({
          title: "Only buyers can leave reviews",
          description: "You must be a buyer to leave reviews",
          variant: "destructive",
        });
        return;
      }
      
      const reviewData = {
        post_id: postId,
        user_id: user.id,
        rating,
        comment,
      };
      
      let result;
      
      if (userReview) {
        // Update existing review
        result = await supabase
          .from("freelancer_post_reviews")
          .update({
            rating,
            comment,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userReview.id);
      } else {
        // Create new review
        result = await supabase
          .from("freelancer_post_reviews")
          .insert(reviewData);
      }
      
      if (result.error) throw result.error;
      
      toast({
        title: userReview ? "Review updated" : "Review submitted",
        description: userReview ? "Your review has been updated" : "Thank you for your review",
      });
      
      setReviewDialogOpen(false);
      loadPostAndReviews(); // Reload reviews
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange }: { value: number, onChange?: (rating: number) => void }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-6 w-6 ${i <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          onClick={() => onChange && onChange(i)}
        />
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
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

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Post not found</h2>
            <p className="text-muted-foreground mb-6">The post you're looking for doesn't exist or has been removed.</p>
            <Link to="/marketplace">
              <Button>Back to Marketplace</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <Link to="/marketplace" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Marketplace</span>
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Post Details */}
            <div className="lg:col-span-2">
              {post.cover_image_url && (
                <div className="mb-8 rounded-lg overflow-hidden">
                  <img 
                    src={post.cover_image_url} 
                    alt={post.title} 
                    className="w-full h-64 object-cover" 
                  />
                </div>
              )}
              
              <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
              
              {post.category && (
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {post.category}
                  </span>
                </div>
              )}
              
              <div className="flex items-center mb-6">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={post.profiles?.avatar_url || ""} />
                  <AvatarFallback>{getInitials(post.profiles?.display_name)}</AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">
                  {post.profiles?.display_name || post.profiles?.username || "Freelancer"}
                </span>
              </div>
              
              {post.image_url && (
                <div className="mb-8">
                  <img 
                    src={post.image_url} 
                    alt="Post illustration" 
                    className="max-w-full rounded-lg" 
                  />
                </div>
              )}
              
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-full">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Reviews</CardTitle>
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(averageRating)} />
                    <span>({reviews.length})</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="pb-6 border-b last:border-b-0">
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={review.profiles?.avatar_url || ""} />
                                <AvatarFallback>{getInitials(review.profiles?.display_name)}</AvatarFallback>
                              </Avatar>
                              <span>
                                {review.profiles?.display_name || review.profiles?.username || "User"}
                              </span>
                            </div>
                            <StarRating value={review.rating} />
                          </div>
                          {review.comment && (
                            <p className="text-muted-foreground mt-2">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 mx-auto opacity-50 mb-2" />
                      <p>No reviews yet</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {user && profile?.role === 'buyer' && post.user_id !== user.id && (
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          {userReview ? "Edit Your Review" : "Leave a Review"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{userReview ? "Edit Review" : "Leave a Review"}</DialogTitle>
                          <DialogDescription>
                            Share your experience with this service
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Rating</label>
                            <StarRating 
                              value={rating} 
                              onChange={(value) => setRating(value)} 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Comment (Optional)</label>
                            <Textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Share your experience with this service"
                              className="min-h-[100px]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={submitting} onClick={handleSubmitReview}>
                            {submitting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            {userReview ? "Update Review" : "Submit Review"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardFooter>
              </Card>
            </div>
            
            {/* Right Column: Price and Action */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold">${post.price.toFixed(2)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">Contact the freelancer to discuss this service</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      if (!user) {
                        toast({
                          title: "Authentication required",
                          description: "Please login to contact the freelancer",
                          variant: "destructive",
                        });
                        navigate("/auth");
                        return;
                      }
                      
                      // Check if user is a buyer
                      if (profile?.role !== 'buyer') {
                        toast({
                          title: "Buyer account required",
                          description: "You need a buyer account to contact freelancers",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Navigate to messaging with post and freelancer info
                      navigate(`/messaging`, { 
                        state: { 
                          postId: post.id,
                          freelancerId: post.user_id 
                        }
                      });
                    }}
                  >
                    Contact Freelancer
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 