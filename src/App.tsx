
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import Communities from '@/pages/Communities';
import Settings from '@/pages/Settings';
import Admin from '@/pages/Admin';
import Analytics from '@/pages/Analytics';
import Campaigns from '@/pages/Campaigns';
import Payments from '@/pages/Payments';
import Users from '@/pages/Users';
import CreateAnnouncement from '@/pages/announcements/Create';
import PreviewAnnouncement from '@/pages/announcements/Preview';
import MyAnnouncements from '@/pages/announcements/MyAnnouncements';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';
import { Toaster } from 'sonner';

function App() {
  useEffect(() => {
    // Initialize storage bucket on app load
    const initStorageBucket = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-storage-bucket');
        if (error) {
          console.error('Error initializing storage bucket:', error);
        } else {
          console.log('Storage bucket initialization result:', data);
        }
      } catch (error) {
        console.error('Failed to initialize storage bucket:', error);
      }
    };
    
    initStorageBucket();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/users" element={<Users />} />
            <Route path="/announcements/create" element={<CreateAnnouncement />} />
            <Route path="/announcements/preview" element={<PreviewAnnouncement />} />
            <Route path="/announcements/my" element={<MyAnnouncements />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
