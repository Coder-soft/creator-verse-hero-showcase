import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type Post = {
  id: string;
  title: string;
  content: string;
  price: number;
  category: string;
  status: string;
  cover_image_url: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  } | null;
};

const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('freelancer_posts')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        setError(error);
      } else {
        setPost(data as Post);
      }
      setLoading(false);
    };

    fetchPost();
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen">Error: {error.message}</div>;
  if (!post) return <div className="flex justify-center items-center h-screen">Post not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{post.title}</CardTitle>
          <div className="flex items-center space-x-4 pt-2">
            <Avatar>
              <AvatarImage src={post.profiles?.avatar_url} alt={post.profiles?.display_name} />
              <AvatarFallback>{post.profiles?.display_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.profiles?.display_name}</p>
              <p className="text-sm text-muted-foreground">Posted on {new Date(post.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-auto max-h-[500px] object-cover rounded-lg mb-6"
            />
          )}
          <div className="flex justify-between items-center mb-4">
            <Badge variant="secondary">{post.category}</Badge>
            <p className="text-2xl font-bold">${post.price}</p>
          </div>
          <div className="prose max-w-none">
            <p>{post.content}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostPage;