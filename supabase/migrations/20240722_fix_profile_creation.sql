-- Fix profiles insert policy
-- First drop potentially conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can create any profile" ON profiles;

-- Create a simpler insert policy that allows any authenticated user to create a profile
CREATE POLICY "Allow authenticated users to create profiles"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- This ensures the table has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Make sure we have the other essential policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Everyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id); 