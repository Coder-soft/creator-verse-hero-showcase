import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, X, Loader2, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TableCheckResult, checkRequiredTables, runRequiredMigrations } from "@/utils/db-check";
import { useNavigate } from "react-router-dom";

export default function AdminDatabaseTools() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [checking, setChecking] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TableCheckResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const checkDatabaseTables = async () => {
    setChecking(true);
    try {
      const tableResults = await checkRequiredTables();
      setResults(tableResults);
      setShowResults(true);
      
      // Show toast with summary
      const missingTables = tableResults.filter(r => !r.exists);
      if (missingTables.length > 0) {
        toast({
          title: "Missing Database Tables",
          description: `${missingTables.length} tables are missing. Use the DB Setup page to fix this.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Database Check Complete",
          description: "All required tables exist.",
        });
      }
    } catch (error) {
      console.error("Error checking tables:", error);
      toast({
        title: "Error",
        description: "Failed to check database tables.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const runMigrations = async () => {
    setRunning(true);
    try {
      const result = await runRequiredMigrations();
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        // Refresh the table list after running migrations
        await checkDatabaseTables();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error running migrations:", error);
      toast({
        title: "Error",
        description: "Failed to run database migrations.",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  // Count how many tables exist if we have results
  const existingTables = results.filter(r => r.exists).length;
  const totalTables = results.length;
  const allTablesExist = existingTables === totalTables && totalTables > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <Database className="h-4 w-4 mr-2" />
          Database Tools
        </CardTitle>
        <CardDescription>
          Check if required database tables exist
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button 
            onClick={checkDatabaseTables} 
            disabled={checking}
            variant="outline"
            size="sm"
          >
            {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Check Database Tables
          </Button>
          
          <Button
            onClick={() => navigate('/db-setup')}
            variant="default"
            size="sm"
          >
            Advanced Database Setup
          </Button>
        </div>

        {showResults && (
          <div className="mt-4">
            <div className="flex justify-between mb-3">
              <h3 className="text-sm font-medium">Database Status</h3>
              <Badge variant={allTablesExist ? "default" : "destructive"}>
                {existingTables} of {totalTables} tables ready
              </Badge>
            </div>
            
            {!allTablesExist && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mt-3">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                  <p className="text-sm">
                    Missing database tables detected. Go to the Database Setup page to fix this issue.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {showResults && !allTablesExist && (
        <CardFooter>
          <Button
            onClick={runMigrations}
            disabled={running}
            size="sm"
          >
            {running && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Quick Fix Database Tables
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 