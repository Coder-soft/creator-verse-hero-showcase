import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImagePlus, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TablesUpdate, Json } from "@/integrations/supabase/types";
import { SectionEditor } from './SectionEditor';
import { Section } from './types';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableFormSection } from './SortableFormSection';

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
  const [price, setPrice] = useState<string>("");
  const [sections, setSections] = useState<Section[]>([]);

  type PackageTier = "basic" | "gold" | "platinum";
  interface PackageInfo {
    title: string;
    description: string;
    price: string;
    deliveryTime: string;
  }

  const [packagesState, setPackagesState] = useState<Record<PackageTier, PackageInfo>>({
    basic: { title: "Basic", description: "", price: "", deliveryTime: "" },
    gold: { title: "Gold", description: "", price: "", deliveryTime: "" },
    platinum: { title: "Platinum", description: "", price: "", deliveryTime: "" },
  });
  const [category, setCategory] = useState<string>("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImageUrl, setPostImageUrl] = useState<string>("");

  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState<string>(profile?.display_name || "");
  const [location, setLocation] = useState<string>(profile?.location || "");
  const [age, setAge] = useState<string>(profile?.age ? profile.age.toString() : "");
  const [bio, setBio] = useState<string>(profile?.bio || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar_url || "");

  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'title',
    'category',
    'images',
    'price',
    'packages',
    'content'
  ]);

  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>({
    title: 'Post Title',
    category: 'Category',
    images: 'Images',
    price: 'General Price',
    packages: 'Service Packages',
    content: 'Post Content'
  });

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

  const loadExistingPost = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data: post, error } = await supabase
        .from("freelancer_posts")
        .select("*, sections, form_layout")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      if (post) {
        setTitle(post.title);
        setPrice(post.price ? post.price.toString() : "");
        setCategory(post.category || "");
        setCoverImageUrl(post.cover_image_url || "");
        setPostImageUrl(post.image_url || "");

        if (post.sections && Array.isArray(post.sections)) {
          setSections(post.sections as unknown as Section[]);
        } else if (post.content) {
          setSections([{ id: uuidv4(), type: 'markdown', content: post.content }]);
        }

        if (post.packages) {
          try {
            const parsed = typeof post.packages === "string" ? JSON.parse(post.packages) : post.packages;
            setPackagesState((prev) => ({ ...prev, ...parsed }));
          } catch (e) {
            console.warn("Failed to parse packages JSON", e);
          }
        }

        if (post.form_layout) {
          const layout = post.form_layout as { titles: Record<string, string>, order: string[] };
          if (layout.titles) {
            setSectionTitles(prev => ({ ...prev, ...layout.titles }));
          }
          if (layout.order && Array.isArray(layout.order)) {
            setSectionOrder(layout.order);
          }
        }
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
  }, [toast]);

  useEffect(() => {
    if (postId) {
      loadExistingPost(postId);
    }
  }, [postId, loadExistingPost]);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCoverImage(e.target.files[0]);
      const url = URL.createObjectURL(e.target.files[0]);
      setCoverImageUrl(url);
    }
  };

  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPostImage(e.target.files[0]);
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    try {
      const updates: TablesUpdate<"profiles"> = {
        display_name: displayName,
        bio,
        location,
        age: parseInt(age, 10) || null,
        updated_at: new Date().toISOString(),
      };
      if (avatarFile) {
        const newUrl = await uploadImage(avatarFile, `avatars/${user.id}`);
        updates.avatar_url = newUrl;
      }
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: "Profile updated" });
    } catch (error) {
      console.error("Error updating profile", error);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
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

    if (sections.length === 0 || sections.every(s => !s.content.trim())) {
      toast({
        title: "Missing content",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return false;
    }

    if (!price && Object.values(packagesState).every((p) => !p.price || parseFloat(p.price) <= 0)) {
      toast({
        title: "Invalid price",
        description: "Please enter at least one valid package price or general price",
        variant: "destructive",
      });
      return false;
    }

    if (!price && Object.values(packagesState).some((p) => p.price && parseFloat(p.price) > 0)) {
      // Using package-only pricing; that's fine.
    } else if (price && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
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

      if (coverImage) {
        finalCoverImageUrl = await uploadImage(coverImage, "post-covers");
      }

      if (postImage) {
        finalPostImageUrl = await uploadImage(postImage, "post-images");
      }

      const postData = {
        packages: JSON.stringify(packagesState),
        title,
        sections: sections as unknown as Json,
        content: sections.map(s => s.content).join('\n\n'),
        price: price ? parseFloat(price) : null,
        category,
        cover_image_url: finalCoverImageUrl,
        image_url: finalPostImageUrl,
        status,
        user_id: user.id,
        form_layout: {
          titles: sectionTitles,
          order: sectionOrder
        } as unknown as Json
      };

      let result;
      
     if (profile) {
      setDisplayName(profile.display_name || "");
      setLocation(profile.location || "");
      setAge(profile.age ? String(profile.age) : "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
    }

    if (postId) {
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleTitleChange = (id: string, newTitle: string) => {
    setSectionTitles(prev => ({ ...prev, [id]: newTitle }));
  };

  const sectionComponents: Record<string, { component: React.ReactNode }> = {
    title: {
      component: (
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a catchy title" />
        </div>
      )
    },
    category: {
      component: (
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      )
    },
    images: {
      component: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image</Label>
            <div className="border border-dashed border-border rounded-lg p-4 text-center">
              {coverImageUrl ? (
                <div className="relative">
                  <img src={coverImageUrl} alt="Cover preview" className="mx-auto max-h-40 object-contain mb-2" />
                  <Button variant="outline" size="sm" onClick={() => { setCoverImage(null); setCoverImageUrl(""); }} className="mt-2">Remove</Button>
                </div>
              ) : (
                <>
                  <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Upload a cover image</p>
                  <Input id="coverImage" type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
                  <Button variant="outline" onClick={() => document.getElementById("coverImage")?.click()}>Select Image</Button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="postImage">Post Image</Label>
            <div className="border border-dashed border-border rounded-lg p-4 text-center">
              {postImageUrl ? (
                <div className="relative">
                  <img src={postImageUrl} alt="Post image preview" className="mx-auto max-h-40 object-contain mb-2" />
                  <Button variant="outline" size="sm" onClick={() => { setPostImage(null); setPostImageUrl(""); }} className="mt-2">Remove</Button>
                </div>
              ) : (
                <>
                  <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Upload a main image</p>
                  <Input id="postImage" type="file" accept="image/*" onChange={handlePostImageChange} className="hidden" />
                  <Button variant="outline" onClick={() => document.getElementById("postImage")?.click()}>Select Image</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )
    },
    price: {
      component: (
        <div className="space-y-2">
          <Label htmlFor="price">General Price (optional if using packages)</Label>
          <div className="relative">
            <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="pl-10" />
          </div>
        </div>
      )
    },
    packages: {
      component: (
        <div className="space-y-4">
          {(["basic", "gold", "platinum"] as PackageTier[]).map((tier) => (
            <Card key={tier} className="p-4 bg-background">
              <CardHeader className="p-0 mb-4"><CardTitle className="capitalize text-primary">{packagesState[tier].title || tier}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-0">
                <div className="space-y-2"><Label>Title</Label><Input value={packagesState[tier].title} onChange={(e) => setPackagesState((prev) => ({ ...prev, [tier]: { ...prev[tier], title: e.target.value } }))} placeholder="Package title" /></div>
                <div className="space-y-2"><Label>Price</Label><Input type="number" min="0" step="0.01" value={packagesState[tier].price} onChange={(e) => setPackagesState((prev) => ({ ...prev, [tier]: { ...prev[tier], price: e.target.value } }))} placeholder="0.00" /></div>
                <div className="space-y-2"><Label>Delivery Time (days)</Label><Input type="number" min="1" value={packagesState[tier].deliveryTime} onChange={(e) => setPackagesState((prev) => ({ ...prev, [tier]: { ...prev[tier], deliveryTime: e.target.value } }))} placeholder="3" /></div>
                <div className="col-span-full space-y-2"><Label>Description</Label><Textarea value={packagesState[tier].description} onChange={(e) => setPackagesState((prev) => ({ ...prev, [tier]: { ...prev[tier], description: e.target.value } }))} placeholder="Describe what is included" /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    },
    content: {
      component: (
        <SectionEditor sections={sections} setSections={setSections} />
      )
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
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{postId ? "Edit Post" : "Create New Post"}</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {sectionOrder.map((sectionId) => (
                    <SortableFormSection 
                      key={sectionId} 
                      id={sectionId} 
                      title={sectionTitles[sectionId]}
                      onTitleChange={handleTitleChange}
                    >
                      {sectionComponents[sectionId].component}
                    </SortableFormSection>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={saveAsDraft} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save as Draft
            </Button>
            <Button onClick={publishPost} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Publish Post
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-2">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{displayName ? displayName.substring(0,2).toUpperCase() : "U"}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={() => document.getElementById("avatarInput")?.click()}>Change Avatar</Button>
              <Input id="avatarInput" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <Input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={saveProfile}>Save Profile</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}