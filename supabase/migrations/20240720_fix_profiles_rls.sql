-- Fix profiles RLS policies to ensure proper permissions

-- First drop potentially conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Re-create basic policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Allow authenticated users to create their own profile
CREATE POLICY "Users can create their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow admins to create/update any profile
CREATE POLICY "Admins can create any profile"
    ON profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
        OR auth.uid() = user_id
    );

CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
        OR auth.uid() = user_id
    ); 