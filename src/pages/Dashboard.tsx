
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import StatCard from '@/components/dashboard/StatCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import CreateAnnouncementButton from '@/components/dashboard/CreateAnnouncementButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Megaphone, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Loader2, 
  BarChart4,
  BrainCircuit,
  ShoppingBag,
  Wallet,
  Settings as SettingsIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CampaignTable from '@/components/dashboard/CampaignTable';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { ActivityItem } from '@/components/dashboard/types';

// Sample activities for ActivityFeed
const sampleActivities: ActivityItem[] = [
  {
    id: 1,
    type: 'announcement',
    title: 'New announcement published',
    time: 'Just now',
    status: 'success',
    description: 'Your ad was approved and is now live',
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    type: 'payment',
    title: 'Payment received',
    time: '2 hours ago',
    status: 'success',
    description: 'Payment of $250 USDT confirmed',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 3,
    type: 'community',
    title: 'Joined new community',
    time: 'Yesterday',
    status: 'info',
    description: 'Successfully joined Traders Network',
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 4,
    type: 'announcement',
    title: 'Announcement validation failed',
    time: 'Yesterday',
    status: 'error',
    description: 'AI flagged potential policy violation',
    timestamp: new Date(Date.now() - 90000000).toISOString()
  },
  {
    id: 5,
    type: 'payment',
    title: 'Payment processing',
    time: '3 days ago',
    status: 'warning',
    description: 'Waiting for blockchain confirmation',
    timestamp: new Date(Date.now() - 259200000).toISOString()
  }
];

// Sample campaign data
const campaignData = [
  { id: 1, title: "Q2 Token Launch", status: "ACTIVE", communities: 4, impressions: 12540, spent: 500 },
  { id: 2, title: "NFT Collection Promo", status: "PENDING", communities: 2, impressions: 0, spent: 250 },
  { id: 3, title: "DeFi Protocol Update", status: "REJECTED", communities: 0, impressions: 0, spent: 0 },
  { id: 4, title: "Governance Vote", status: "ACTIVE", communities: 3, impressions: 5280, spent: 375 }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for charts
  const performanceData = [
    { name: 'Jan', views: 400, clicks: 240, conversion: 40 },
    { name: 'Feb', views: 300, clicks: 139, conversion: 30 },
    { name: 'Mar', views: 200, clicks: 120, conversion: 25 },
    { name: 'Apr', views: 278, clicks: 198, conversion: 45 },
    { name: 'May', views: 189, clicks: 110, conversion: 30 },
    { name: 'Jun', views: 239, clicks: 150, conversion: 38 },
    { name: 'Jul', views: 349, clicks: 210, conversion: 55 },
  ];

  const communityReachData = [
    { name: 'Traders', value: 4000 },
    { name: 'Investors', value: 3000 },
    { name: 'Developers', value: 2000 },
    { name: 'NFT', value: 2780 },
    { name: 'DeFi', value: 1890 },
  ];

  const paymentStatusData = [
    { name: 'Jan', paid: 1200, pending: 300, failed: 50 },
    { name: 'Feb', paid: 1500, pending: 400, failed: 30 },
    { name: 'Mar', paid: 1700, pending: 200, failed: 20 },
    { name: 'Apr', paid: 1400, pending: 350, failed: 40 },
    { name: 'May', paid: 2000, pending: 450, failed: 25 },
    { name: 'Jun', paid: 1800, pending: 300, failed: 30 },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Fetch announcements
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (announcementsError) throw announcementsError;
        setAnnouncements(announcementsData || []);
        
        // Fetch communities for community owners
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (communitiesError) throw communitiesError;
        setCommunities(communitiesData || []);
        
        // Fetch payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (paymentsError) throw paymentsError;
        setPayments(paymentsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'DRAFT':
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'PENDING_VALIDATION':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'VALIDATION_FAILED':
      case 'REJECTED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'FAILED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Your crypto announcement platform overview</p>
          </div>
          <CreateAnnouncementButton />
        </div>

        {/* Dashboard Navigation */}
        <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Campaigns" 
              value={announcements.length} 
              description="Active, Pending, Rejected" 
              icon={<Megaphone className="h-5 w-5" />} 
              trend={{ value: 12, isPositive: true }}
              className="border-l-4 border-l-crypto-green"
            />
            <StatCard 
              title="Community Engagement" 
              value={communities.length} 
              description="Approvals, Rejections, Growth" 
              icon={<Users className="h-5 w-5" />} 
              trend={{ value: 5, isPositive: true }}
              className="border-l-4 border-l-crypto-blue"
            />
            <StatCard 
              title="Crypto Payments" 
              value={`$${payments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0)}`} 
              description="Balance, Payouts, Revenue" 
              icon={<CreditCard className="h-5 w-5" />} 
              trend={{ value: 18, isPositive: true }}
              className="border-l-4 border-l-purple-500"
            />
            <StatCard 
              title="Engagement Rate" 
              value="24.8%" 
              description="Conversion, CTR, Growth" 
              icon={<TrendingUp className="h-5 w-5" />} 
              trend={{ value: 7, isPositive: true }}
              className="border-l-4 border-l-yellow-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="performance" className="w-full">
              <TabsList className="bg-crypto-darkgray/80">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="reach">Community Reach</TabsTrigger>
                <TabsTrigger value="payments">Payment Status</TabsTrigger>
              </TabsList>
              <TabsContent value="performance">
                <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
                  <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>Views, clicks and conversion rates over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={performanceData}
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="name" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e1e2a',
                              borderColor: '#333',
                              color: '#fff'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="views"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="clicks"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="conversion"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="reach">
                <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
                  <CardHeader>
                    <CardTitle>Community Reach</CardTitle>
                    <CardDescription>Distribution by community type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={communityReachData}
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="name" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e1e2a',
                              borderColor: '#333',
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="payments">
                <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
                  <CardHeader>
                    <CardTitle>Payment Status</CardTitle>
                    <CardDescription>Paid, pending and failed payments over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={paymentStatusData}
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="name" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e1e2a',
                              borderColor: '#333',
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="paid" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="pending" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="failed" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <ActivityFeed activities={sampleActivities} />
          </div>
        </div>

        <div className="mt-6">
          <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Campaign Management</CardTitle>
                <CardDescription>Track and manage your advertising campaigns</CardDescription>
              </div>
              <Link to="/announcements/create" className="text-sm text-crypto-blue hover:underline">
                Create New Campaign
              </Link>
            </CardHeader>
            <CardContent>
              <CampaignTable campaigns={campaignData} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Announcements</CardTitle>
                <CardDescription>Your latest announcements</CardDescription>
              </div>
              <Link to="/announcements/create" className="text-sm text-crypto-blue hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement: any) => (
                    <div key={announcement.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{announcement.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{announcement.content.substring(0, 60)}...</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(announcement.created_at)}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(announcement.status)}>
                        {announcement.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No announcements yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </div>
              <Link to="/payments" className="text-sm text-crypto-blue hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">${payment.amount} {payment.currency}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(payment.created_at)}</p>
                      </div>
                      <Badge variant="outline" className={getPaymentStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No payment history</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
