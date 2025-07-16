-- Drop the old migration's objects if they were partially created
-- We can ignore errors if they don't exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
  DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
EXCEPTION
  WHEN OTHERS THEN
    -- ignore errors
END;
$$;

-- Delete the bucket if it was created by the previous migration
-- This will fail if the bucket doesn't exist, which is fine.
-- We are doing this to clean up the failed migration.
DO $$
BEGIN
  PERFORM storage.delete_bucket('public');
EXCEPTION
  WHEN OTHERS THEN
    -- ignore errors, maybe the bucket was not created
END;
$$;


-- Create the 'public' bucket using the recommended function
-- This handles setting up the bucket and its default permissions.
SELECT storage.create_bucket(
  'public',
  public => true,
  file_size_limit => 5242880, -- 5MB
  allowed_mime_types => ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for fine-grained access control
-- These policies are standard for allowing public read and authenticated writes.

-- 1. Allow public read access to all objects in the 'public' bucket.
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'public' );

-- 2. Allow authenticated users to upload to the 'public' bucket.
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'public' );

-- 3. Allow authenticated users to update their own objects.
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'public' );

-- 4. Allow authenticated users to delete their own objects.
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( auth.uid() = owner );
