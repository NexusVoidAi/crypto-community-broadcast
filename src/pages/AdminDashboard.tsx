import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Settings, MessageSquare, Users, BarChart3, RefreshCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AnnouncementApproval from '@/components/admin/AnnouncementApproval';
import CommunityApproval from '@/components/admin/CommunityApproval';
import PlatformSettings from '@/components/admin/PlatformSettings';

// Dashboard summary types
interface DashboardStats {
  pendingAnnouncements: number;
  pendingCommunities: number;
  totalAnnouncements: number;
  totalCommunities: number;
  recentPayments: any[];
  isLoading: boolean;
  error: string | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    pendingAnnouncements: 0,
    pendingCommunities: 0,
    totalAnnouncements: 0,
    totalCommunities: 0,
    recentPayments: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }
        
        // Check if user has admin role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', session.user.id)
          .single();
          
        if (error) throw error;
        
        if (profile?.account_type === 'admin') {
          setIsAdmin(true);
          fetchDashboardStats();
        } else {
          toast.error("You don't have permission to access this page");
          navigate('/');
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast.error("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch pending announcements count
      const { count: pendingAnnouncementsCount, error: announcementsError } = await supabase
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDING_VALIDATION');

      if (announcementsError) throw announcementsError;

      // Fetch pending communities count
      const { count: pendingCommunitiesCount, error: communitiesError } = await supabase
        .from('communities')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'PENDING');

      if (communitiesError) throw communitiesError;

      // Fetch total announcements
      const { count: totalAnnouncementsCount, error: totalAnnouncementsError } = await supabase
        .from('announcements')
        .select('id', { count: 'exact', head: true });

      if (totalAnnouncementsError) throw totalAnnouncementsError;

      // Fetch total communities
      const { count: totalCommunitiesCount, error: totalCommunitiesError } = await supabase
        .from('communities')
        .select('id', { count: 'exact', head: true });

      if (totalCommunitiesError) throw totalCommunitiesError;

      // Fetch recent payments (separate from profiles)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (paymentsError) throw paymentsError;

      // If we have payment data, fetch the associated user profiles separately
      let recentPayments: any[] = [];
      
      if (paymentsData && paymentsData.length > 0) {
        const userIds = paymentsData.map(payment => payment.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;
        
        // Create a map of user IDs to profile names for easy lookup
        const profileMap = new Map();
        if (profilesData) {
          profilesData.forEach(profile => {
            profileMap.set(profile.id, profile.name);
          });
        }
        
        // Combine payment data with profile names
        recentPayments = paymentsData.map(payment => ({
          ...payment,
          profileName: profileMap.get(payment.user_id) || 'Unknown User'
        }));
      }

      setStats({
        pendingAnnouncements: pendingAnnouncementsCount || 0,
        pendingCommunities: pendingCommunitiesCount || 0,
        totalAnnouncements: totalAnnouncementsCount || 0,
        totalCommunities: totalCommunitiesCount || 0,
        recentPayments: recentPayments,
        isLoading: false,
        error: null
      });

    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      setStats(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Failed to load dashboard statistics: ${error.message}` 
      }));
      toast.error(`Failed to load dashboard statistics: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
        </div>
      </AppLayout>
    );
  }

  const renderOverviewContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard Overview</h2>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={fetchDashboardStats}
          disabled={stats.isLoading}
        >
          {stats.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCcw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>
      
      {stats.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{stats.error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-crypto-darkgray/50 border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Pending Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats.pendingAnnouncements
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Awaiting review and approval
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-crypto-darkgray/50 border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Pending Communities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats.pendingCommunities
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-crypto-darkgray/50 border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Total Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats.totalAnnouncements
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Platform-wide
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-crypto-darkgray/50 border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Total Communities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats.totalCommunities
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Registered on platform
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-crypto-darkgray/50 border border-border/50">
        <CardHeader>
          <CardTitle className="text-xl">Recent Payments</CardTitle>
          <CardDescription>Latest payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stats.recentPayments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No recent payment activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentPayments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-3 border border-border/30 rounded-md bg-crypto-dark/30">
                  <div>
                    <p className="font-medium">{payment.profileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${payment.amount} {payment.currency}</p>
                    <Badge variant="outline" className={
                      payment.status === 'PAID' ? 'text-green-500 bg-green-500/10' : 
                      payment.status === 'PENDING' ? 'text-yellow-500 bg-yellow-500/10' : 
                      'text-red-500 bg-red-500/10'
                    }>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage announcements, communities, and platform settings</p>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-crypto-darkgray/80 mb-6">
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Platform Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {renderOverviewContent()}
          </TabsContent>
          
          <TabsContent value="announcements">
            <AnnouncementApproval />
          </TabsContent>
          
          <TabsContent value="communities">
            <CommunityApproval />
          </TabsContent>
          
          <TabsContent value="settings">
            <PlatformSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
