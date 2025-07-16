import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/use-auth';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/ui/sidebar';
import Index from '@/pages/Index';
import FreelancerApplication from '@/pages/FreelancerApplication';
import Login from '@/pages/login';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminRoute from '@/components/routes/admin-route';
import GuestRoute from '@/components/routes/guest-route';
import UserProfile from '@/pages/profile';
import AuthRoute from '@/components/routes/auth-route';
import FreelancerPosts from '@/pages/freelancer/posts';
import FreelancerPost from '@/pages/freelancer/post';
import Post from '@/pages/post';
import Messages from '@/pages/messages';
import Conversation from '@/pages/conversation';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="/freelancer-application" element={<AuthRoute><FreelancerApplication /></AuthRoute>} />
                <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/profile/:username" element={<UserProfile />} />
                <Route path="/freelancer/posts" element={<AuthRoute><FreelancerPosts /></AuthRoute>} />
                <Route path="/freelancer/post/:id" element={<AuthRoute><FreelancerPost /></AuthRoute>} />
                <Route path="/post/:id" element={<Post />} />
                <Route path="/messages" element={<AuthRoute><Messages /></AuthRoute>} />
                <Route path="/messages/:conversationId" element={<AuthRoute><Conversation /></AuthRoute>} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;