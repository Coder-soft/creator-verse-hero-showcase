import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/ui/navbar';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Profile {
  display_name?: string;
  username?: string;
  bio?: string | null;
  avatar_url?: string | null;
}

interface Post {
  id: string;
  title: string;
  price: number;
  cover_image_url?: string | null;
}

export default function FreelancerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('display_name, username, bio, avatar_url')
          .eq('user_id', id)
          .single();
        setProfile(prof || null);

        const { data: postsData } = await supabase
          .from('freelancer_posts')
          .select('id, title, price, cover_image_url')
          .eq('status', 'published')
          .eq('user_id', id)
          .order('created_at', { ascending: false });
        setPosts(postsData || []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Freelancer not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center gap-6 mb-10">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback>{(profile.display_name || profile.username || 'F')[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{profile.display_name || profile.username}</h1>
            {profile.bio && <p className="text-muted-foreground mt-2 max-w-xl">{profile.bio}</p>}
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Services</h2>
        {posts.length === 0 ? (
          <p className="text-muted-foreground">No services published yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full flex flex-col overflow-hidden">
                  {post.cover_image_url && (
                    <img src={post.cover_image_url} alt={post.title} className="w-full h-40 object-cover" />
                  )}
                  <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-end justify-between">
                    <span className="font-medium">${post.price.toFixed(2)}</span>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/marketplace/post/${post.id}`)}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
