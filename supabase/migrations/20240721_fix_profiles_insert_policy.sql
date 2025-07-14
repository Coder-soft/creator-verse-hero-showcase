-- Ensure the profiles table has the proper policies in place

-- First, make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can create any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Recreate the essential policies

-- Everyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Authenticated users can create their own profile
CREATE POLICY "Users can create their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can create any profile (using service role key)
CREATE POLICY "Admins can create any profile"
    ON profiles FOR INSERT
    WITH CHECK (
        (auth.jwt() -> 'role')::text = '"service_role"'
        OR auth.uid() = user_id
    );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE
    USING (
        (auth.jwt() -> 'role')::text = '"service_role"'
        OR auth.uid() = user_id
    ); 