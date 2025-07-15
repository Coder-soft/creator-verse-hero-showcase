import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/ui/navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableCheckResult, checkRequiredTables, runRequiredMigrations } from "@/utils/db-check";
import { Loader2, Check, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function DbSetup() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TableCheckResult[]>([]);

  const checkDatabaseTables = useCallback(async () => {
    setChecking(true);
    try {
      const tableResults = await checkRequiredTables();
      setResults(tableResults);
    } catch (error) {
      console.error("Error checking tables:", error);
      toast({
        title: "Error",
        description: "Failed to check database tables.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Check if user is admin
    if (profile && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can access the database setup page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (user) {
      checkDatabaseTables();
    }
  }, [user, profile, isAdmin, navigate, toast, checkDatabaseTables]);

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

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-24 px-4">
          <div className="flex justify-center items-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </>
    );
  }

  // Count how many tables exist
  const existingTables = results.filter(r => r.exists).length;
  const totalTables = results.length;

  return (
    <>
      <Navbar />
      <div className="container mx-auto py-24 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Database Setup</CardTitle>
            <CardDescription>
              Check and fix database tables required for the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between mb-3">
                <h3 className="text-lg font-medium">Database Status</h3>
                <Badge variant={existingTables === totalTables ? "default" : "destructive"}>
                  {existingTables} of {totalTables} tables ready
                </Badge>
              </div>
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={result.table} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center">
                      {result.exists ? (
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span>{result.table}</span>
                    </div>
                    <Badge variant={result.exists ? "outline" : "destructive"}>
                      {result.exists ? "Ready" : "Missing"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {existingTables < totalTables && (
              <Card className="bg-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    Missing Tables Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    Some required tables are missing in your database. Run the migrations to create them.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={runMigrations} 
                    disabled={running || checking}
                  >
                    {running && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Run Migrations
                  </Button>
                </CardFooter>
              </Card>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/")}>
              Return to Home
            </Button>
            <Button 
              onClick={checkDatabaseTables} 
              disabled={checking || running}
              variant="secondary"
            >
              {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Refresh
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
} 