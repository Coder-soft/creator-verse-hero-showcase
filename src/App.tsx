import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import { navItems } from '@/components/Sidebar';
import Apply from '@/pages/freelancer/Apply';
import PostEditor from '@/pages/freelancer/post/PostEditor';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import FreelancerApplications from '@/pages/admin/FreelancerApplications';
import Application from '@/pages/application/Application';
import FreelancerPosts from '@/pages/freelancer/FreelancerPosts';
import SettingsPage from '@/pages/settings/Settings';
import PostView from '@/pages/post/PostView';

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router>
          <Routes>
            <Route element={<Layout navItems={navItems} />}>
              <Route index element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/freelancer/apply" element={<Apply />} />
              <Route path="/freelancer/posts" element={<FreelancerPosts />} />
              <Route path="/freelancer/posts/new" element={<PostEditor />} />
              <Route path="/freelancer/posts/:id/edit" element={<PostEditor />} />
              <Route path="/post/:id" element={<PostView />} />
              <Route path="/application" element={<Application />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/applications" element={<FreelancerApplications />} />
            </Route>
            <Route path="/login" element={<Login />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
export default App;