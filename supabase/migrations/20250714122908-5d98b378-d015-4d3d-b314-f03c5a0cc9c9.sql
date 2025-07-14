-- Create foreign key relationships to fix Supabase query joins

-- Add foreign key constraints to link tables with profiles
-- This will enable proper joins between tables and resolve the "could not find relation" errors

-- Update conversations table foreign keys
ALTER TABLE conversations 
ADD CONSTRAINT conversations_buyer_id_fkey 
FOREIGN KEY (buyer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE conversations 
ADD CONSTRAINT conversations_freelancer_id_fkey 
FOREIGN KEY (freelancer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Update messages table foreign key
ALTER TABLE messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Update freelancer_posts table foreign key
ALTER TABLE freelancer_posts 
ADD CONSTRAINT freelancer_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Update freelancer_post_reviews table foreign key
ALTER TABLE freelancer_post_reviews 
ADD CONSTRAINT freelancer_post_reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;