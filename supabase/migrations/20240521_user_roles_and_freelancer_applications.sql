-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'buyer', 'freelancer');

-- Add role column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'buyer',
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active';

-- Create table for freelancer questions (configurable by admin)
CREATE TABLE freelancer_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    required BOOLEAN DEFAULT true,
    order_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for freelancer applications
CREATE TABLE freelancer_applications (
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

-- Create table for freelancer application answers
CREATE TABLE freelancer_application_answers (
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

-- Insert default admin user (use this after creating the first user manually)
-- INSERT INTO profiles (id, user_id, role, username, display_name)
-- VALUES (uuid_generate_v4(), 'YOUR-ADMIN-USER-ID', 'admin', 'admin', 'Administrator');

-- Insert some default questions for freelancer applications
INSERT INTO freelancer_questions (question, required, order_position)
VALUES 
('What skills and services do you offer?', true, 1),
('How many years of experience do you have in your field?', true, 2),
('Describe your previous work experience and projects', true, 3),
('What are your rate expectations?', true, 4),
('What is your availability (hours per week)?', true, 5);

-- Create RLS policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_application_answers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Freelancer questions policies
CREATE POLICY "Freelancer questions viewable by everyone"
    ON freelancer_questions FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify freelancer questions"
    ON freelancer_questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Freelancer applications policies
CREATE POLICY "Users can view their own applications"
    ON freelancer_applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
    ON freelancer_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all freelancer applications"
    ON freelancer_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update freelancer application status"
    ON freelancer_applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Freelancer application answers policies
CREATE POLICY "Users can view their own application answers"
    ON freelancer_application_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM freelancer_applications
            WHERE id = application_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own application answers"
    ON freelancer_application_answers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM freelancer_applications
            WHERE id = application_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all freelancer application answers"
    ON freelancer_application_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create function to check if user is admin
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