-- This migration creates a trigger to automatically create a user profile upon registration.

-- Step 1: Define the function to create a profile
-- This function will be triggered when a new user is created in the auth.users table.
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  -- Do not use `new.raw_user_meta_data->>'initial_role'` as it is not reliable
  -- Instead, we will set a default role and let the user update it later
  user_role TEXT;
BEGIN
  -- Set a default role, for example 'buyer'
  user_role := 'buyer';

  -- Insert a new profile record for the new user
  INSERT INTO public.profiles (user_id, role, display_name, email)
  VALUES (
    new.id,
    user_role::user_role,
    new.raw_user_meta_data->>'display_name',
    new.email
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop the old trigger if it exists
-- This prevents conflicts with the new trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create the new trigger
-- This trigger will execute the `create_user_profile` function after each new user is inserted
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- Step 4: Add comments to explain the fix
-- The previous implementation likely had a faulty trigger that was created manually.
-- This migration replaces it with a reliable, version-controlled trigger.
-- The `initial_role` from the client-side was removed to avoid inconsistencies.
-- A default role is assigned, and users can update it in their profile settings.
