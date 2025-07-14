import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Sparkles, ArrowDownAZ, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Post {
  id: string;
  title: string;
  content: string;
  price: number;
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

  useEffect(() => {
    fetchPosts();
  }, [sortBy, selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    
    try {
      // Create a query for published posts with profile info
      let query = supabase
        .from('freelancer_posts')
        .select(`
          *,
          profiles (username, display_name, avatar_url),
          freelancer_post_reviews (rating)
        `)
        .eq('status', 'published');
      
      // Add category filter if selected
      if (selectedCategory) {
        // Filter posts by category
        query = query.eq('category', selectedCategory);
      }
      
      // Add sort options
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
          // Rating will be calculated client-side for now
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process posts to add average rating
      const processedPosts = data?.map(post => {
        const reviews = post.freelancer_post_reviews || [];
        const reviewCount = reviews.length;
        const averageRating = reviewCount > 0
          ? reviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / reviewCount
          : 0;
        
        return {
          ...post,
          freelancer_post_reviews: undefined, // Remove the reviews array to clean up the object
          average_rating: averageRating,
          review_count: reviewCount,
        };
      }) || [];
      
      // Apply additional sorting if needed
      if (sortBy === 'rating') {
        processedPosts.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      }
      
      setPosts(processedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const filteredPosts = searchTerm
    ? posts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : posts;

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
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold">Marketplace</h1>
              <p className="text-muted-foreground mt-2">Find the perfect freelancer for your next project</p>
            </div>
          </div>
          
          {/* Search and filters */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
            <Card className="lg:col-span-3 shadow-md">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Search for services or freelancers..."
                    className="w-full rounded-md pl-10 pr-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="lg:col-span-1">
              <Button className="w-full flex items-center justify-between py-3 px-4" variant="outline">
                <span className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Advanced Filters
                </span>
                <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">New</span>
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8 overflow-x-auto">
            <div className="flex space-x-2 pb-2 min-w-max">
              <Button 
                variant={selectedCategory === null ? "default" : "outline"} 
                className="rounded-full" 
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button 
                  key={category} 
                  variant={selectedCategory === category ? "default" : "outline"} 
                  className="rounded-full" 
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Sort options */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
              Showing <strong>{filteredPosts.length}</strong> services
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select 
                className="bg-background border border-input rounded-md text-sm py-1 px-2"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recommended">Recommended</option>
                <option value="newest">Newest</option>
                <option value="rating">Top Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
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
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map((post) => (
                    <Card key={post.id} className="shadow-sm hover:shadow-md transition-shadow">
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
                  <p className="text-muted-foreground">No posts found.</p>
                  {searchTerm && (
                    <Button 
                      variant="link" 
                      onClick={() => setSearchTerm("")}
                    >
                      Clear search
                    </Button>
                  )}
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