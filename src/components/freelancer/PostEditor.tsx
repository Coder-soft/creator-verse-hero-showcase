import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImagePlus, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PostEditorProps {
  postId?: string; // Optional for editing existing post
  onSuccess?: (postId: string) => void;
}

export function PostEditor({ postId, onSuccess }: PostEditorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImageUrl, setPostImageUrl] = useState<string>("");
  
  // For markdown preview
  const [activeTab, setActiveTab] = useState<string>("write");

  // Available categories
  const categories = [
    "Design", 
    "Development", 
    "Writing", 
    "Video", 
    "Animation", 
    "Music", 
    "Marketing",
    "Other"
  ];

  useEffect(() => {
    if (postId) {
      loadExistingPost(postId);
    }
  }, [postId]);

  const loadExistingPost = async (id: string) => {
    setLoading(true);
    try {
      const { data: post, error } = await supabase
        .from("freelancer_posts")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      if (post) {
        setTitle(post.title);
        setContent(post.content);
        setPrice(post.price.toString());
        setCategory(post.category || "");
        setCoverImageUrl(post.cover_image_url || "");
        setPostImageUrl(post.image_url || "");
      }
    } catch (error) {
      console.error("Error loading post:", error);
      toast({
        title: "Error",
        description: "Failed to load post data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCoverImage(e.target.files[0]);
      // Create preview URL
      const url = URL.createObjectURL(e.target.files[0]);
      setCoverImageUrl(url);
    }
  };

  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPostImage(e.target.files[0]);
      // Create preview URL
      const url = URL.createObjectURL(e.target.files[0]);
      setPostImageUrl(url);
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("public")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("public").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for your post",
        variant: "destructive",
      });
      return false;
    }

    if (!content.trim()) {
      toast({
        title: "Missing content",
        description: "Please add content to your post",
        variant: "destructive",
      });
      return false;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const saveAsDraft = async () => {
    if (!validateForm()) return;
    await savePost("draft");
  };

  const publishPost = async () => {
    if (!validateForm()) return;
    await savePost("published");
  };

  const savePost = async (status: "draft" | "published") => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to create posts",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let finalCoverImageUrl = coverImageUrl;
      let finalPostImageUrl = postImageUrl;

      // Upload new images if selected
      if (coverImage) {
        finalCoverImageUrl = await uploadImage(coverImage, "post-covers");
      }

      if (postImage) {
        finalPostImageUrl = await uploadImage(postImage, "post-images");
      }

      const postData = {
        title,
        content,
        price: parseFloat(price),
        category,
        cover_image_url: finalCoverImageUrl,
        image_url: finalPostImageUrl,
        status,
        user_id: user.id,
      };

      let result;
      
      if (postId) {
        // Update existing post
        result = await supabase
          .from("freelancer_posts")
          .update({
            ...postData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", postId)
          .select()
          .single();
      } else {
        // Create new post
        result = await supabase
          .from("freelancer_posts")
          .insert(postData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: status === "published" ? "Post published" : "Draft saved",
        description: status === "published" 
          ? "Your post is now live on the marketplace" 
          : "Your draft has been saved",
      });

      if (onSuccess && result.data) {
        onSuccess(result.data.id);
      } else {
        // Navigate to the post or post list
        navigate("/freelancer/posts");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        title: "Error",
        description: "Failed to save your post",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{postId ? "Edit Post" : "Create New Post"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a catchy title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={category}
            onValueChange={setCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image</Label>
            <div className="border border-dashed border-border rounded-lg p-4 text-center">
              {coverImageUrl ? (
                <div className="relative">
                  <img 
                    src={coverImageUrl} 
                    alt="Cover preview" 
                    className="mx-auto max-h-40 object-contain mb-2" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverImageUrl("");
                    }}
                    className="mt-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a cover image for your post
                  </p>
                  <Input
                    id="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById("coverImage")?.click()}
                  >
                    Select Image
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postImage">Post Image</Label>
            <div className="border border-dashed border-border rounded-lg p-4 text-center">
              {postImageUrl ? (
                <div className="relative">
                  <img 
                    src={postImageUrl} 
                    alt="Post image preview" 
                    className="mx-auto max-h-40 object-contain mb-2" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setPostImage(null);
                      setPostImageUrl("");
                    }}
                    className="mt-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a main image for your post
                  </p>
                  <Input
                    id="postImage"
                    type="file"
                    accept="image/*"
                    onChange={handlePostImageChange}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById("postImage")?.click()}
                  >
                    Select Image
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <div className="relative">
            <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Content (Markdown supported)</Label>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-2">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="write" className="mt-0">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your services in detail. Markdown is supported."
                className="min-h-[300px] font-mono"
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <div className="border rounded-md p-4 min-h-[300px] prose dark:prose-invert max-w-full">
                {content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground text-center py-10">
                    Your preview will appear here
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={saveAsDraft}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save as Draft
        </Button>
        <Button
          onClick={publishPost}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Publish Post
        </Button>
      </CardFooter>
    </Card>
  );
} 