-- Create table for freelancer posts
CREATE TABLE IF NOT EXISTS freelancer_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    cover_image_url TEXT,
    image_url TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT freelancer_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create table for buyer reviews on posts
CREATE TABLE IF NOT EXISTS freelancer_post_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT freelancer_post_reviews_post_id_fkey FOREIGN KEY (post_id) REFERENCES freelancer_posts(id) ON DELETE CASCADE,
    CONSTRAINT freelancer_post_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT freelancer_post_reviews_unique UNIQUE (post_id, user_id)
);

-- Enable RLS on the tables
ALTER TABLE freelancer_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_post_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for freelancer_posts

-- Everyone can view published posts
CREATE POLICY "Published posts are viewable by everyone"
    ON freelancer_posts FOR SELECT
    USING (status = 'published');

-- Freelancers can manage their own posts
CREATE POLICY "Freelancers can insert their own posts"
    ON freelancer_posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Freelancers can update their own posts"
    ON freelancer_posts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Freelancers can delete their own posts"
    ON freelancer_posts FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can see all posts including drafts
CREATE POLICY "Admins can select all posts"
    ON freelancer_posts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for freelancer_post_reviews

-- Everyone can view reviews
CREATE POLICY "Reviews are viewable by everyone"
    ON freelancer_post_reviews FOR SELECT
    USING (true);

-- Buyers can create reviews
CREATE POLICY "Buyers can insert reviews"
    ON freelancer_post_reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'buyer'
        )
    );

-- Buyers can update their own reviews
CREATE POLICY "Buyers can update their own reviews"
    ON freelancer_post_reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- Buyers can delete their own reviews
CREATE POLICY "Buyers can delete their own reviews"
    ON freelancer_post_reviews FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can update all reviews"
    ON freelancer_post_reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete all reviews"
    ON freelancer_post_reviews FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    ); 