-- Fix foreign key relationships to point to profiles table instead of auth.users
-- This will allow proper joins between tables

-- Drop existing foreign keys that point to auth.users
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_buyer_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_freelancer_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE freelancer_posts DROP CONSTRAINT IF EXISTS freelancer_posts_user_id_fkey;
ALTER TABLE freelancer_post_reviews DROP CONSTRAINT IF EXISTS freelancer_post_reviews_user_id_fkey;

-- Add new foreign keys that point to profiles table
ALTER TABLE conversations 
ADD CONSTRAINT conversations_buyer_id_fkey 
FOREIGN KEY (buyer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE conversations 
ADD CONSTRAINT conversations_freelancer_id_fkey 
FOREIGN KEY (freelancer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE freelancer_posts 
ADD CONSTRAINT freelancer_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE freelancer_post_reviews 
ADD CONSTRAINT freelancer_post_reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;