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
        .from(table as any)
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
    
    // Log missing tables - they should be created via Supabase migrations
    console.warn('Missing tables detected:', missingTables.map(t => t.table).join(', '));
    console.warn('Please run the appropriate database migrations to create these tables.');
    
    return { 
      success: false, 
      message: `Missing tables: ${missingTables.map(t => t.table).join(', ')}. Please run database migrations.` 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      message: `An error occurred while checking tables: ${errorMessage}` 
    };
  }
}