
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Web3Provider from "./contexts/Web3Provider";

// Dashboard
import Dashboard from "./pages/Dashboard";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Announcement pages
import Create from "./pages/announcements/Create";
import Preview from "./pages/announcements/Preview";

// Community pages
import CommunityList from "./pages/communities/CommunityList";
import CommunityDetail from "./pages/communities/CommunityDetail";
import CommunityCreate from "./pages/communities/CommunityCreate";

// Profile page
import Profile from "./pages/Profile";

// Payment pages
import PaymentSuccess from "./pages/payment/PaymentSuccess";

// Admin Dashboard
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AuthRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Protected Routes */}
    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    
    {/* Announcement Routes */}
    <Route path="/announcements/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
    <Route path="/announcements/preview" element={<ProtectedRoute><Preview /></ProtectedRoute>} />
    
    {/* Community Routes */}
    <Route path="/communities" element={<ProtectedRoute><CommunityList /></ProtectedRoute>} />
    <Route path="/communities/create" element={<ProtectedRoute><CommunityCreate /></ProtectedRoute>} />
    <Route path="/communities/:id" element={<ProtectedRoute><CommunityDetail /></ProtectedRoute>} />
    
    {/* Payment Routes */}
    <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
    
    {/* Admin Routes */}
    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    
    {/* Auth Routes */}
    <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
    <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
    
    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Web3Provider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </Web3Provider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
