import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type Package = {
  name: string;
  description: string;
  delivery_days: number | string;
  price: number | string;
};

type PostData = {
  id?: string;
  title: string;
  category: string;
  content: string;
  price: number | string;
  cover_image_url: string;
  packages: Package[];
};

const initialFormData: PostData = {
  title: '',
  category: '',
  content: '',
  price: '',
  cover_image_url: '',
  packages: [
    { name: 'Basic', description: '', delivery_days: '', price: '' },
    { name: 'Standard', description: '', delivery_days: '', price: '' },
    { name: 'Premium', description: '', delivery_days: '', price: '' },
  ],
};

export default function PostEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PostData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('freelancer_posts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          toast.error('Failed to fetch post data.');
          console.error(error);
        } else if (data) {
          setFormData({
            ...data,
            price: data.price || '',
            packages: data.packages || initialFormData.packages,
          });
        }
        setIsLoading(false);
      };
      fetchPost();
    }
  }, [id]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePackageChange = (index: number, field: keyof Package, value: string) => {
    const updatedPackages = [...formData.packages];
    updatedPackages[index] = { ...updatedPackages[index], [field]: value };
    setFormData(prev => ({ ...prev, packages: updatedPackages }));
  };

  const handleCoverImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, cover_image_url: previewUrl }));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) {
        toast.error('You must be logged in to upload images.');
        return null;
    }
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('public')
      .upload(`post-covers/${fileName}`, file);

    if (error) {
      console.error('Error uploading image:', error);
      toast.error(`Image upload failed: ${error.message}`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(data.path);
      
    return publicUrl;
  };

  const savePost = async (status: 'draft' | 'published') => {
    if (status === 'published' && !formData.title) {
      toast.error('Title is required to publish.');
      return;
    }

    status === 'draft' ? setIsSaving(true) : setIsPublishing(true);

    let coverUrl = formData.cover_image_url;
    if (coverImageFile) {
      const uploadedUrl = await uploadImage(coverImageFile);
      if (uploadedUrl) {
        coverUrl = uploadedUrl;
      } else {
        // Handle upload failure
        status === 'draft' ? setIsSaving(false) : setIsPublishing(false);
        return;
      }
    }

    const postDataToSave = {
      ...formData,
      user_id: user.id,
      status,
      cover_image_url: coverUrl,
      price: formData.price ? Number(formData.price) : null,
      packages: isPackagesPristine ? null : formData.packages.map(p => ({...p, price: Number(p.price), delivery_days: Number(p.delivery_days)})),
    };

    let result;
    if (id) {
      result = await supabase.from('freelancer_posts').update(postDataToSave).eq('id', id).select().single();
    } else {
      result = await supabase.from('freelancer_posts').insert(postDataToSave).select().single();
    }

    const { data, error } = result;

    if (error) {
      toast.error(`Failed to save post: ${error.message}`);
      console.error('Error saving post:', error);
    } else if (data) {
      toast.success(`Post successfully ${status === 'published' ? 'published' : 'saved'}!`);
      if (!id) {
        navigate(`/freelancer/posts/${data.id}/edit`);
      }
    }

    status === 'draft' ? setIsSaving(false) : setIsPublishing(false);
  };

  const isPackagesPristine = formData.packages.every(p => !p.price && !p.description && !p.delivery_days && p.name !=='');
  const isPriceSet = formData.price !== '' && Number(formData.price) > 0;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit Post' : 'Create New Post'}</CardTitle>
          <CardDescription>Fill out the details for your service offering.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., I will design a modern logo for your business" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g., Logo Design" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Description</Label>
            <Textarea id="content" name="content" value={formData.content} onChange={handleInputChange} placeholder="Describe your service in detail..." rows={6} />
          </div>
          <div className="grid gap-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-20 rounded-md border flex items-center justify-center bg-muted overflow-hidden">
                {formData.cover_image_url ? (
                  <img src={formData.cover_image_url} alt="Cover preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <Input id="cover_image_url" type="file" onChange={handleCoverImageChange} className="max-w-xs" accept="image/*" />
            </div>
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="price">General Price ($)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              placeholder="e.g., 50"
              value={formData.price}
              onChange={handleInputChange}
              disabled={!isPackagesPristine}
            />
            {!isPackagesPristine && (
              <p className="text-sm text-muted-foreground">
                Package details are filled in. Clear them to set a general price.
              </p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-2">Packages</h3>
            <fieldset disabled={isPriceSet} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.packages.map((pkg, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Input
                      placeholder={['Basic', 'Standard', 'Premium'][index]}
                      value={pkg.name}
                      onChange={(e) => handlePackageChange(index, 'name', e.target.value)}
                      className="text-lg font-bold p-0 border-none focus-visible:ring-0"
                    />
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="grid gap-1">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Package description"
                        value={pkg.description}
                        onChange={(e) => handlePackageChange(index, 'description', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label>Delivery Days</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 3"
                        value={pkg.delivery_days}
                        onChange={(e) => handlePackageChange(index, 'delivery_days', e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label>Price ($)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 100"
                        value={pkg.price}
                        onChange={(e) => handlePackageChange(index, 'price', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </fieldset>
            {isPriceSet && (
              <p className="text-sm text-muted-foreground mt-2">
                A general price is set. Clear it to enable packages.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => savePost('draft')} disabled={isSaving || isPublishing}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Draft
          </Button>
          <Button onClick={() => savePost('published')} disabled={isSaving || isPublishing}>
            {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}