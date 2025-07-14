import { supabase } from '@/integrations/supabase/client';

export type TableCheckResult = {
  table: string;
  exists: boolean;
  error?: string;
};

/**
 * Checks if the required database tables exist
 * @returns Promise<TableCheckResult[]> Results of table checks
 */
export async function checkRequiredTables(): Promise<TableCheckResult[]> {
  const requiredTables = [
    'profiles',
    'freelancer_questions',
    'freelancer_applications',
    'freelancer_application_answers',
    'freelancer_posts',
    'freelancer_post_reviews'
  ];
  
  const results: TableCheckResult[] = [];
  
  for (const table of requiredTables) {
    try {
      // Try to select a single row from the table to check if it exists
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('does not exist')) {
        results.push({
          table,
          exists: false,
          error: error.message
        });
      } else {
        results.push({
          table,
          exists: true
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        table,
        exists: false,
        error: errorMessage
      });
    }
  }
  
  return results;
}

/**
 * Run migrations for tables that don't exist
 */
export async function runRequiredMigrations(): Promise<{ success: boolean; message: string }> {
  try {
    // Get current table status
    const tableChecks = await checkRequiredTables();
    const missingTables = tableChecks.filter(check => !check.exists);
    
    if (missingTables.length === 0) {
      return { success: true, message: 'All required tables exist.' };
    }
    
    // Create tables that don't exist
    if (missingTables.some(t => t.table === 'freelancer_questions')) {
      // Create freelancer_questions table
      const { error: questionsError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS freelancer_questions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            question TEXT NOT NULL,
            required BOOLEAN DEFAULT true,
            order_position INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Insert some default questions
          INSERT INTO freelancer_questions (question, required, order_position)
          VALUES 
          ('What skills and services do you offer?', true, 1),
          ('How many years of experience do you have in your field?', true, 2),
          ('Describe your previous work experience and projects', true, 3),
          ('What are your rate expectations?', true, 4),
          ('What is your availability (hours per week)?', true, 5);
        `
      });
      
      if (questionsError) {
        return { 
          success: false, 
          message: `Failed to create freelancer_questions table: ${questionsError.message}` 
        };
      }
    }
    
    if (missingTables.some(t => t.table === 'freelancer_applications')) {
      // Create freelancer_applications table
      const { error: appsError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS freelancer_applications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            reviewed_at TIMESTAMP WITH TIME ZONE,
            reviewed_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT freelancer_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
          );
        `
      });
      
      if (appsError) {
        return { 
          success: false, 
          message: `Failed to create freelancer_applications table: ${appsError.message}` 
        };
      }
    }
    
    if (missingTables.some(t => t.table === 'freelancer_application_answers')) {
      // Create freelancer_application_answers table
      const { error: answersError } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS freelancer_application_answers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            application_id UUID NOT NULL,
            question_id UUID NOT NULL,
            answer TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT freelancer_application_answers_application_id_fkey FOREIGN KEY (application_id) REFERENCES freelancer_applications(id) ON DELETE CASCADE,
            CONSTRAINT freelancer_application_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES freelancer_questions(id) ON DELETE CASCADE
          );
        `
      });
      
      if (answersError) {
        return { 
          success: false, 
          message: `Failed to create freelancer_application_answers table: ${answersError.message}` 
        };
      }
    }
    
    return { success: true, message: 'Successfully created missing tables.' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      message: `An error occurred while running migrations: ${errorMessage}` 
    };
  }
} 