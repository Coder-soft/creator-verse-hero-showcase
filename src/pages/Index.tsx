import { useSession, useSupabase } from '../contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const session = useSession();
  const supabase = useSupabase();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome!</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Session Information</h2>
        <p className="text-sm text-gray-600">You are logged in with Discord.</p>
        {session && (
          <pre className="mt-4 bg-white p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default Index;