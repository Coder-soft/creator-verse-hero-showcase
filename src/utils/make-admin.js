/*
 * Utility script to make an existing user an admin
 * Run this script with Node.js
 * 
 * Usage:
 * 1. Update the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY below
 * 2. Set the USER_EMAIL to the email of the user you want to make an admin
 * 3. Run with: node make-admin.js
 */

const { createClient } = require('@supabase/supabase-js');

// Replace these with your actual values
const SUPABASE_URL = "https://xectigebisfntlcoxqmo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "YOUR_SUPABASE_SERVICE_ROLE_KEY"; // Use service role key, not anon key
const USER_EMAIL = "admin@example.com"; // Replace with the user's email

async function makeUserAdmin() {
  console.log(`Making user ${USER_EMAIL} an admin...`);

  // Create Supabase admin client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // First, get the user's ID from their email
    // Note: Using auth.admin methods requires service role key
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(USER_EMAIL);

    if (userError) {
      console.error('Error finding user:', userError.message);
      return;
    }

    if (!userData || !userData.user) {
      console.error(`User with email ${USER_EMAIL} not found`);
      return;
    }

    const userId = userData.user.id;
    console.log(`Found user with ID: ${userId}`);

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // Not found is ok
      console.error('Error checking for existing profile:', profileError.message);
      return;
    }

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user to admin:', error.message);
      } else {
        console.log(`Successfully updated user ${USER_EMAIL} to admin role`);
      }
    } else {
      // Create new profile with admin role
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          role: 'admin',
          display_name: 'Admin',
          account_status: 'active',
          username: USER_EMAIL.split('@')[0]
        });

      if (error) {
        console.error('Error creating admin profile:', error.message);
      } else {
        console.log(`Successfully created admin profile for ${USER_EMAIL}`);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

makeUserAdmin(); 