
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Megaphone, 
  ShoppingBag,
  CreditCard,
  Settings,
  Shield,
  ArrowRight,
  TrendingUp,
  Check,
  Loader2,
  Eye,
  Edit,
  BarChart2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import StatCard from '@/components/dashboard/StatCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import CreateAnnouncementButton from '@/components/dashboard/CreateAnnouncementButton';
import { ActivityItem, Campaign } from '@/components/dashboard/types';
import { 
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import DashboardNav from '@/components/dashboard/DashboardNav';
import AppLayout from '@/components/layout/AppLayout';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  // Fetch profile, payments, and admin status
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single();
          
        if (error) throw error;
        
        setProfile(data);
      } catch (error: any) {
        toast.error(`Error fetching profile: ${error.message}`);
      }
    };
    
    const fetchPayments = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setPayments(data || []);
      } catch (error: any) {
        toast.error(`Error fetching payments: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    const checkAdminStatus = async () => {
      try {
        // Check if user has admin privileges
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .eq('account_type', 'admin')
          .single();
          
        if (adminError && adminError.code !== 'PGRST116') throw adminError;
        
        setIsAdmin(!!adminData);
      } catch (error: any) {
        console.error("Error checking admin status:", error);
      }
    };
    
    fetchProfile();
    fetchPayments();
    checkAdminStatus();
  }, [user]);

  // Fetch campaigns (announcements) data
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            id,
            title,
            status,
            created_at,
            announcement_communities (
              community_id
            ),
            impressions
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Transform the announcement data to match the Campaign interface
        const formattedCampaigns: Campaign[] = (data || []).map((announcement: any) => ({
          id: announcement.id,
          name: announcement.title,
          title: announcement.title,
          status: announcement.status,
          reach: Math.floor(Math.random() * 1000) + 500, // Placeholder for now
          clicks: Math.floor(Math.random() * 200), // Placeholder for now
          conversionRate: (Math.random() * 0.1).toFixed(2), // Placeholder for now
          budget: 100, // Placeholder for now
          spent: Math.floor(Math.random() * 50) + 10, // Placeholder for now
          communities: announcement.announcement_communities || [],
          impressions: announcement.impressions || 0,
        }));
        
        setCampaigns(formattedCampaigns);
      } catch (error: any) {
        console.error("Error fetching campaigns:", error);
        toast.error("Failed to load campaigns");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      fetchCampaigns();
    }
  }, [user?.id]);

  // Generate activities from payments and campaigns
  useEffect(() => {
    const activities: ActivityItem[] = [];
    
    // Add payment activities
    payments.slice(0, 3).forEach(payment => {
      activities.push({
        id: payment.id,
        timestamp: payment.created_at,
        title: 'Payment processed',
        description: `Payment of $${payment.amount} ${payment.currency} for announcement`,
        type: 'payment',
        status: payment.status === 'PAID' ? 'success' : (payment.status === 'PENDING' ? 'warning' : 'error'),
      });
    });
    
    // Add campaign activities
    campaigns.slice(0, 3).forEach(campaign => {
      activities.push({
        id: campaign.id,
        timestamp: new Date().toISOString(), // Using current time as placeholder
        title: `Campaign "${campaign.title}" ${campaign.status === 'ACTIVE' ? 'is active' : 'status updated'}`,
        description: `Campaign status: ${campaign.status}`,
        type: 'announcement',
        status: campaign.status === 'ACTIVE' ? 'success' : (campaign.status === 'PENDING' ? 'warning' : 'error'),
      });
    });
    
    // Sort by timestamp (newest first) and limit to 5
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivities(activities.slice(0, 5));
  }, [payments, campaigns]);

  // Generate chart data
  useEffect(() => {
    // Generate dummy chart data for the last 7 days
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toLocaleDateString();
      const value = Math.floor(Math.random() * 100); // Random value for demonstration
      data.push({ date: dateString, value });
    }
    setChartData(data);
  }, []);

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-crypto-green';
      case 'PENDING':
        return 'text-yellow-500';
      case 'FAILED':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  // Tab content rendering
  const renderOverviewContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Campaigns"
          value={campaigns.length.toString()}
          trend={{value: "+12%", positive: true}}
          icon={<Megaphone className="h-5 w-5" />}
        />
        <StatCard
          title="Community Reach"
          value={campaigns.reduce((sum, campaign) => sum + campaign.reach, 0).toLocaleString()}
          trend={{value: "+1%", positive: true}}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Total Spent"
          value={`$${payments.reduce((sum, payment) => sum + Number(payment.amount), 0).toFixed(2)}`}
          trend={{value: "+5.3%", positive: true}}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>
      
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Your campaign performance for the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
              <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActivityFeed activities={recentActivities} />
        
        <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Create new campaign</p>
                <p className="text-sm text-muted-foreground">Start a new announcement campaign</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/announcements/create')}>
                <Megaphone className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Add a community</p>
                <p className="text-sm text-muted-foreground">Register a new community</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/communities/create')}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCampaignsContent = () => (
    <div className="mt-4">
      <div className="mb-4 flex justify-between">
        <h2 className="text-xl font-semibold">Your Campaigns</h2>
        <CreateAnnouncementButton />
      </div>
      
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-crypto-darkgray/30">
                <TableHead className="w-[300px]">Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Communities</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="border-border/50 hover:bg-crypto-darkgray/30">
                    <TableCell className="font-medium">{campaign.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign.communities?.length || 0}</TableCell>
                    <TableCell>{campaign.impressions?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-right">${campaign.spent.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Analytics">
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No campaigns found. Create your first campaign!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderMarketplaceContent = () => (
    <div className="mt-4">
      <div className="mb-4 flex justify-between">
        <h2 className="text-xl font-semibold">Community Marketplace</h2>
        <Button
          onClick={() => navigate('/communities/create')}
          className="bg-crypto-blue hover:bg-crypto-blue/90"
        >
          Add Community
        </Button>
      </div>
      
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardContent className="p-6">
          <p className="mb-4">Discover and manage communities for your announcements.</p>
          <Button
            onClick={() => navigate('/communities')}
            variant="outline"
          >
            Browse Communities
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaymentsContent = () => (
    <div className="mt-4">
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>Payments & Transactions</CardTitle>
          <CardDescription>Manage your crypto payments and transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border border-border/50 rounded-md bg-crypto-darkgray/80">
              <h3 className="font-medium text-center mb-3">Total Spent</h3>
              <div className="text-center text-3xl font-bold text-crypto-green">
                ${payments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0)} USDT
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">Lifetime spending</p>
            </div>
            <div className="p-4 border border-border/50 rounded-md bg-crypto-darkgray/80">
              <h3 className="font-medium text-center mb-3">Pending Payments</h3>
              <div className="text-center text-3xl font-bold text-yellow-500">
                ${payments.filter((p: any) => p.status === 'PENDING').reduce((sum: number, payment: any) => sum + Number(payment.amount), 0)} USDT
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">Payments awaiting confirmation</p>
            </div>
            <div className="p-4 border border-border/50 rounded-md bg-crypto-darkgray/80">
              <h3 className="font-medium text-center mb-3">Community Earnings</h3>
              <div className="text-center text-3xl font-bold text-crypto-blue">$0 USDT</div>
              <p className="text-xs text-muted-foreground text-center mt-2">Revenue from your communities</p>
            </div>
          </div>
          
          <h3 className="font-medium mb-3">Transaction History</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : payments.length > 0 ? (
                  payments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.created_at)}</TableCell>
                      <TableCell>
                        <span className="font-medium">Announcement Payment</span>
                        <span className="block text-xs text-muted-foreground">TX: {payment.transaction_hash ? payment.transaction_hash.substring(0, 10) + '...' : 'N/A'}</span>
                      </TableCell>
                      <TableCell>${payment.amount} {payment.currency}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPaymentStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No transaction history
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render the appropriate content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewContent();
      case "campaigns":
        return renderCampaignsContent();
      case "marketplace":
        return renderMarketplaceContent();
      case "payments":
        return renderPaymentsContent();
      default:
        return renderOverviewContent();
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {isAdmin && (
            <Button
              onClick={() => navigate('/admin')}
              variant="outline"
              className="flex items-center"
            >
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Button>
          )}
        </div>
        
        <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
