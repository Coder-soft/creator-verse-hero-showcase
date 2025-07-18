import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Button } from './button';
import { supabase } from '@/integrations/supabase/client';

interface FreelancerCard {
  id: string;
  name: string;
  avatar: string;
  title?: string;
  rating: number;
  reviews: number;
  skills: string[];
}

const placeholderAvatar = '/placeholder.svg';

/* STATIC PLACEHOLDER DATA (disabled after migration to dynamic fetch)


  {
    id: 1,
    name: 'Elena Rodriguez',
    avatar: '/placeholder.svg',
    title: 'UI/UX Designer',
    rating: 4.9,
    reviews: 124,
    skills: ['Figma', 'Webflow', 'Branding'],
  },
  {
    id: 2,
    name: 'Marcus Chen',
    avatar: '/placeholder.svg',
    title: 'Frontend Developer',
    rating: 4.8,
    reviews: 98,
    skills: ['React', 'Next.js', 'TypeScript'],
  },
  {
    id: 3,
    name: 'Aisha Patel',
    avatar: '/placeholder.svg',
    title: 'Content Strategist',
    rating: 5.0,
    reviews: 210,
    skills: ['SEO', 'Copywriting', 'Marketing'],
*/


const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

export function TrendingFreelancers() {
  const navigate = useNavigate();
  const [freelancers, setFreelancers] = useState<FreelancerCard[]>([]);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url, role')
          .eq('role', 'freelancer')
          .limit(6);

        if (error) throw error;
        if (!profiles) return;

        const userIds = profiles.map((p) => p.user_id);

        const { data: reviews, error: revError } = await supabase
          .from('freelancer_post_reviews')
          .select('rating, post:freelancer_posts(user_id)')
          .in('post.user_id', userIds);

        if (revError) console.warn(revError);

        const ratingMap = new Map<string, { sum: number; count: number }>();
        type ReviewRow = { rating: number; post?: { user_id?: string } };
        reviews?.forEach((r: ReviewRow) => {
          const uid = r.post?.user_id;
          if (!uid) return;
          const entry = ratingMap.get(uid) || { sum: 0, count: 0 };
          entry.sum += r.rating;
          entry.count += 1;
          ratingMap.set(uid, entry);
        });

        const cards: FreelancerCard[] = profiles.map((p) => {
          const ratingInfo = ratingMap.get(p.user_id) || { sum: 0, count: 0 };
          const avg = ratingInfo.count ? ratingInfo.sum / ratingInfo.count : 0;
          return {
            id: p.user_id,
            name: p.display_name || p.username || 'Freelancer',
            avatar: p.avatar_url || placeholderAvatar,
            title: 'Freelancer',
            rating: Number(avg.toFixed(1)),
            reviews: ratingInfo.count,
            skills: [],
          };
        });

        setFreelancers(cards);
      } catch (err) {
        console.error('Error fetching freelancers', err);
      }
    };

    fetchFreelancers();
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tighter">Trending Freelancers</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Meet our top-rated freelancers who are making waves with their exceptional skills and client satisfaction.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {freelancers.length > 0 ? (
            freelancers.map((freelancer, i) => (
              <motion.div
                key={freelancer.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                <Card className="h-full flex flex-col overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="flex-row items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                      <AvatarFallback>{freelancer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{freelancer.name}</CardTitle>
                      <p className="text-muted-foreground">{freelancer.title}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      <span className="font-bold text-lg">{freelancer.rating}</span>
                      <span className="text-muted-foreground text-sm">({freelancer.reviews} reviews)</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {freelancer.skills.map(skill => (
                        <span key={skill} className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => navigate(`/freelancer/${freelancer.id}`)}>View Profile</Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <p>No freelancers found.</p>
          )}
        </div>
      </div>
    </section>
  );
}