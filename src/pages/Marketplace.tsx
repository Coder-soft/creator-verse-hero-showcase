import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowDownAZ, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarketplaceSearchBar } from "@/components/marketplace/MarketplaceSearchBar";
import { PostCardSkeleton } from "@/components/marketplace/PostCardSkeleton";

interface Post {
  id: string;
  title: string;
  content: string;
  price: number;
  category: string;
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
  average_rating?: number;
  review_count?: number;
}

interface Review {
  rating: number;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("recommended");
  const [activeTab, setActiveTab] = useState("all");
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const categories = [
    "Design", 
    "Development", 
    "Writing", 
    "Video", 
    "Animation", 
    "Music", 
    "Marketing"
  ];

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('freelancer_posts')
        .select(`
          *,
          freelancer_post_reviews (rating)
        `)
        .eq('status', 'published');
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.textSearch('fts', searchQuery, {
          type: 'websearch',
          config: 'english',
        });
      }
      
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          // Client-side sorting for rating
          query = query.order('created_at', { ascending: false });
          break;
        default:
          // 'recommended' will also be sorted by creation date for now
          query = query.order('created_at', { ascending: false });
      }
      
      const { data: postsData, error } = await query;
      
      if (error) throw error;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get all unique user IDs from the posts
      const userIds = [...new Set(postsData.map(p => p.user_id))];

      // Fetch all profiles for these user IDs in one query
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.warn("Could not fetch some freelancer profiles:", profilesError);
      }

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]));
      
      const processedPosts = postsData.map(post => {
        const reviews = (post as any).freelancer_post_reviews || [];
        const reviewCount = reviews.length;
        const averageRating = reviewCount > 0
          ? reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / reviewCount
          : 0;
        
        return {
          ...post,
          profiles: profilesMap.get(post.user_id),
          freelancer_post_reviews: undefined,
          average_rating: averageRating,
          review_count: reviewCount,
        };
      });
      
      if (sortBy === 'rating') {
        processedPosts.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      }
      
      setPosts(processedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = () => {
    setSearchQuery(searchTerm);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const renderStars = (rating?: number) => {
    const roundedRating = Math.round(rating || 0);
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            className={`h-3 w-3 ${star <= roundedRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Find the perfect freelancer for your next project. Browse our categories or search for specific skills.
            </p>
          </div>
          
          <div className="mb-10">
            <MarketplaceSearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              categories={categories}
              onSearch={handleSearch}
            />
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
              Showing <strong>{posts.length}</strong> services
              {searchQuery && <span> for "<strong>{searchQuery}</strong>"</span>}
              {selectedCategory && <span> in <strong>{selectedCategory}</strong></span>}
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="featured" className="flex items-center">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Featured
              </TabsTrigger>
              <TabsTrigger value="top-rated" className="flex items-center">
                <Star className="h-3.5 w-3.5 mr-1.5" />
                Top Rated
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center">
                <ArrowDownAZ className="h-3.5 w-3.5 mr-1.5" />
                Newest
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <Card key={post.id} className="shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1">
                      {post.cover_image_url && (
                        <div className="w-full h-40 overflow-hidden">
                          <img 
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={post.profiles?.avatar_url || ""} />
                            <AvatarFallback>{getInitials(post.profiles?.display_name)}</AvatarFallback>
                          </Avatar>
                          <span>{post.profiles?.display_name || post.profiles?.username || "Freelancer"}</span>
                          {post.review_count ? (
                            <>
                              <span className="mx-2">•</span>
                              <div className="flex items-center">
                                {renderStars(post.average_rating)}
                                <span className="ml-1">({post.review_count})</span>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content.replace(/[#*_~`]/g, '')}
                        </p>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <span className="font-medium">${post.price.toFixed(2)}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/marketplace/post/${post.id}`)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border rounded-lg">
                  <p className="text-muted-foreground">No posts found matching your criteria.</p>
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setSearchTerm("");
                      setSearchQuery("");
                      setSelectedCategory(null);
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="featured" className="mt-6">
              <div className="text-center py-20 border rounded-lg">
                <Sparkles className="h-10 w-10 mx-auto opacity-50 mb-2" />
                <p className="text-muted-foreground">Featured freelancers will appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="top-rated" className="mt-6">
              <div className="text-center py-20 border rounded-lg">
                <Star className="h-10 w-10 mx-auto opacity-50 mb-2" />
                <p className="text-muted-foreground">Top rated freelancers will appear here</p>
              </div>
            </TabsContent>
            
            <TabsContent value="new" className="mt-6">
              <div className="text-center py-20 border rounded-lg">
                <ArrowDownAZ className="h-10 w-10 mx-auto opacity-50 mb-2" />
                <p className="text-muted-foreground">New freelancers will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}