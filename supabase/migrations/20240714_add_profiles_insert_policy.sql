-- Add RLS policy for inserting profiles
CREATE POLICY "Allow authenticated users to create profiles" ON profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');