import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./components/auth/AuthPage";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import FreelancerApplication from "./pages/FreelancerApplication";
import Marketplace from "./pages/Marketplace";
import FreelancerPostsManager from "./pages/FreelancerPostsManager";
import FreelancerPostCreate from "./pages/FreelancerPostCreate";
import PostDetails from "./pages/PostDetails";
import DbSetup from "./pages/DbSetup";
import Messaging from "./pages/Messaging";
import Footer from "./components/ui/footer";
import AuthGuard from "./components/auth/AuthGuard";
import "./shiny-text.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/post/:id" element={<PostDetails />} />
                
                {/* Protected Routes - Require Authentication */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/messaging" element={
                  <AuthGuard>
                    <Messaging />
                  </AuthGuard>
                } />
                <Route path="/messaging/:conversationId" element={
                  <AuthGuard>
                    <Messaging />
                  </AuthGuard>
                } />
                
                {/* Freelancer Only Routes */}
                <Route path="/freelancer-application" element={
                  <AuthGuard>
                    <FreelancerApplication />
                  </AuthGuard>
                } />
                <Route path="/freelancer/posts" element={
                  <AuthGuard freelancerOnly={true}>
                    <FreelancerPostsManager />
                  </AuthGuard>
                } />
                <Route path="/freelancer/posts/create" element={
                  <AuthGuard freelancerOnly={true}>
                    <FreelancerPostCreate />
                  </AuthGuard>
                } />
                
                {/* Admin Only Routes */}
                <Route path="/admin" element={
                  <AuthGuard adminOnly={true}>
                    <Admin />
                  </AuthGuard>
                } />
                <Route path="/db-setup" element={
                  <AuthGuard adminOnly={true}>
                    <DbSetup />
                  </AuthGuard>
                } />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
