import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { supabase } from '@/integrations/supabase/client';
import { FreelancerPost, Profile, FreelancerPostReview } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star } from 'lucide-react';
import PostPricingCard from '@/components/posts/PostPricingCard';
import { Link } from 'react-router-dom';

type PostWithProfileAndReviews = FreelancerPost & {
  profiles: Profile;
  freelancer_post_reviews: FreelancerPostReviewWithProfile[];
};

type FreelancerPostReviewWithProfile = FreelancerPostReview & {
  profiles: Profile;
};

const PostPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: post, isLoading, error } = useQuery<PostWithProfileAndReviews>(
    ['post', id],
    async () => {
      const { data, error } = await supabase
        .from('freelancer_posts')
        .select(
          `
          *,
          profiles:user_id (
            user_id,
            display_name,
            avatar_url,
            username
          ),
          freelancer_post_reviews (
            *,
            profiles:user_id (
              user_id,
              display_name,
              avatar_url
            )
          )
        `
        )
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    }
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !post) {
    return <div>Error loading post. It may not exist or is not published.</div>;
  }

  const freelancer = post.profiles;
  const reviews = post.freelancer_post_reviews || [];
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold">{post.title}</h1>

          <div className="flex items-center space-x-4">
            <Link to={`/users/${freelancer.username}`}>
              <Avatar>
                <AvatarImage src={freelancer.avatar_url || undefined} />
                <AvatarFallback>{freelancer.display_name?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link to={`/users/${freelancer.username}`}>
                <p className="font-semibold">{freelancer.display_name}</p>
              </Link>
              <div className="flex items-center text-sm text-muted-foreground">
                {reviews.length > 0 && (
                  <>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{averageRating.toFixed(1)}</span>
                    <span className="mx-2">|</span>
                    <span>{reviews.length} Reviews</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-2xl font-semibold mb-4">About This Gig</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
          </div>

          {post.image_url && (
            <>
              <Separator />
              <div>
                <h2 className="text-2xl font-semibold mb-4">Gallery</h2>
                <img src={post.image_url} alt="Post gallery" className="rounded-md w-full" />
              </div>
            </>
          )}

          {post.sections && post.sections.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-2xl font-semibold mb-4">More Details</h2>
                <div className="space-y-4">
                  {post.sections.map((section, index) => (
                    <div key={index}>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-muted-foreground">{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={review.profiles.avatar_url || undefined} />
                          <AvatarFallback>{review.profiles.display_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">{review.profiles.display_name}</p>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'fill-muted-foreground text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p>No reviews yet.</p>
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <PostPricingCard post={post} />
        </div>
      </div>
    </div>
  );
};

export default PostPage;