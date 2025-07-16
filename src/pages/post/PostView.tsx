import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FreelancerProfileCard from '@/components/FreelancerProfileCard';
import { Button } from '@/components/ui/button';

type Package = {
  name: string;
  description: string;
  delivery_days: number;
  price: number;
};

type Profile = {
  display_name: string;
  avatar_url: string;
  bio: string;
};

type Post = {
  id: string;
  title: string;
  category: string;
  content: string;
  price: number | null;
  packages: Package[] | null;
  user_id: string;
  profiles: Profile;
};

export default function PostView() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('freelancer_posts')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Failed to fetch post details.');
        console.error(error);
      } else if (data) {
        const postData = { ...data, profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles };
        setPost(postData as Post);
      }
      setIsLoading(false);
    };

    fetchPost();
  }, [id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (!post) {
    return <div className="text-center py-10">Post not found.</div>;
  }

  const showPackages = !post.price && post.packages && post.packages.length > 0;

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 order-2 lg:order-1">
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <p className="text-muted-foreground text-lg mb-6">{post.category}</p>
        
        <Card>
          <CardHeader>
            <CardTitle>About This Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>{post.content}</p>
            </div>
          </CardContent>
        </Card>

        {showPackages && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Compare Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {post.packages?.map((pkg, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>${pkg.price}</CardTitle>
                    <p className="font-semibold">{pkg.name}</p>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                    <p className="font-semibold">{pkg.delivery_days} Days Delivery</p>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button className="w-full">Continue (${pkg.price})</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-1 order-1 lg:order-2 sticky top-4">
        {post.profiles && <FreelancerProfileCard profile={post.profiles} price={post.price} />}
      </div>
    </div>
  );
}