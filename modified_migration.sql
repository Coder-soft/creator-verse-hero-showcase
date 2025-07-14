-- Create enum for user roles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'buyer', 'freelancer');
    END IF;
END$$;

-- Add role column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'buyer',
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active';

-- Create table for freelancer questions if it doesn't exist
CREATE TABLE IF NOT EXISTS freelancer_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    required BOOLEAN DEFAULT true,
    order_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for freelancer applications if it doesn't exist
CREATE TABLE IF NOT EXISTS freelancer_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT freelancer_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT freelancer_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);

-- Create table for freelancer application answers if it doesn't exist
CREATE TABLE IF NOT EXISTS freelancer_application_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    question_id UUID NOT NULL,
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(application_id, question_id),
    CONSTRAINT freelancer_application_answers_application_id_fkey FOREIGN KEY (application_id) REFERENCES freelancer_applications(id) ON DELETE CASCADE,
    CONSTRAINT freelancer_application_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES freelancer_questions(id) ON DELETE CASCADE
);

-- Insert default questions if freelancer_questions is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM freelancer_questions LIMIT 1) THEN
        INSERT INTO freelancer_questions (question, required, order_position)
        VALUES 
        ('What skills and services do you offer?', true, 1),
        ('How many years of experience do you have in your field?', true, 2),
        ('Describe your previous work experience and projects', true, 3),
        ('What are your rate expectations?', true, 4),
        ('What is your availability (hours per week)?', true, 5);
    END IF;
END$$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_application_answers ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
    -- Public profiles are viewable by everyone
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone"
            ON profiles FOR SELECT
            USING (true);
    END IF;

    -- Users can update their own profile - ALREADY EXISTS, SKIPPING
    -- CREATE POLICY "Users can update their own profile"
    --    ON profiles FOR UPDATE
    --    USING (auth.uid() = user_id);

    -- Freelancer questions viewable by everyone
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_questions' AND policyname = 'Freelancer questions viewable by everyone') THEN
        CREATE POLICY "Freelancer questions viewable by everyone"
            ON freelancer_questions FOR SELECT
            USING (true);
    END IF;

    -- Only admins can modify freelancer questions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_questions' AND policyname = 'Only admins can modify freelancer questions') THEN
        CREATE POLICY "Only admins can modify freelancer questions"
            ON freelancer_questions FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE user_id = auth.uid()
                    AND role = 'admin'
                )
            );
    END IF;

    -- Users can view their own applications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_applications' AND policyname = 'Users can view their own applications') THEN
        CREATE POLICY "Users can view their own applications"
            ON freelancer_applications FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    -- Users can create their own applications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_applications' AND policyname = 'Users can create their own applications') THEN
        CREATE POLICY "Users can create their own applications"
            ON freelancer_applications FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Admins can view all freelancer applications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_applications' AND policyname = 'Admins can view all freelancer applications') THEN
        CREATE POLICY "Admins can view all freelancer applications"
            ON freelancer_applications FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE user_id = auth.uid()
                    AND role = 'admin'
                )
            );
    END IF;

    -- Admins can update freelancer application status
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_applications' AND policyname = 'Admins can update freelancer application status') THEN
        CREATE POLICY "Admins can update freelancer application status"
            ON freelancer_applications FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE user_id = auth.uid()
                    AND role = 'admin'
                )
            );
    END IF;

    -- Users can view their own application answers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_application_answers' AND policyname = 'Users can view their own application answers') THEN
        CREATE POLICY "Users can view their own application answers"
            ON freelancer_application_answers FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM freelancer_applications
                    WHERE id = application_id
                    AND user_id = auth.uid()
                )
            );
    END IF;

    -- Users can create their own application answers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_application_answers' AND policyname = 'Users can create their own application answers') THEN
        CREATE POLICY "Users can create their own application answers"
            ON freelancer_application_answers FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM freelancer_applications
                    WHERE id = application_id
                    AND user_id = auth.uid()
                )
            );
    END IF;

    -- Admins can view all freelancer application answers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'freelancer_application_answers' AND policyname = 'Admins can view all freelancer application answers') THEN
        CREATE POLICY "Admins can view all freelancer application answers"
            ON freelancer_application_answers FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE user_id = auth.uid()
                    AND role = 'admin'
                )
            );
    END IF;
END$$;

-- Create function to check if user is admin if it doesn't exist
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- Fix profiles insert policy
-- First drop potentially conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to create profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can create any profile" ON profiles;

-- Create a simpler insert policy that just checks if the user is authenticated
CREATE POLICY "Allow authenticated users to create profiles"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Make sure we have RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 