import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Megaphone, 
  BrainCircuit,
  ShoppingBag,
  CreditCard,
  Settings,
  Shield,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset
} from '@/components/ui/sidebar';

import StatCard from '@/components/dashboard/StatCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import CreateAnnouncementButton from '@/components/dashboard/CreateAnnouncementButton';
import CampaignTable from '@/components/dashboard/CampaignTable';
import { ActivityItem } from '@/components/dashboard/types';
import { Loader2 } from 'lucide-react';

// Sample activities for ActivityFeed with string IDs
const sampleActivities: ActivityItem[] = [
  {
    id: "1",
    type: 'announcement',
    title: 'New announcement published',
    time: 'Just now',
    status: 'success',
    description: 'Your ad was approved and is now live',
    timestamp: new Date().toISOString()
  },
  {
    id: "2",
    type: 'payment',
    title: 'Payment received',
    time: '2 hours ago',
    status: 'success',
    description: 'Payment of $250 USDT confirmed',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "3",
    type: 'community',
    title: 'Joined new community',
    time: 'Yesterday',
    status: 'info',
    description: 'Successfully joined Traders Network',
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "4",
    type: 'announcement',
    title: 'Announcement validation failed',
    time: 'Yesterday',
    status: 'error',
    description: 'AI flagged potential policy violation',
    timestamp: new Date(Date.now() - 90000000).toISOString()
  },
  {
    id: "5",
    type: 'payment',
    title: 'Payment processing',
    time: '3 days ago',
    status: 'warning',
    description: 'Waiting for blockchain confirmation',
    timestamp: new Date(Date.now() - 259200000).toISOString()
  }
];

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAdmin, setIsAdmin] = useState(false);

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
        // Check if user is admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();
          
        if (profileData && profileData.account_type === 'admin') {
          setIsAdmin(true);
        }
        
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

  const renderOverviewContent = () => (
    <>
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
          icon={<ShoppingBag className="h-5 w-5" />} 
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
            <CampaignTable campaigns={announcements.map((announcement: any) => ({
              id: announcement.id,
              title: announcement.title,
              status: announcement.status,
              communities: 2, // Placeholder
              impressions: Math.floor(Math.random() * 10000),
              spent: Math.floor(Math.random() * 1000)
            }))} />
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
    </>
  );

  const renderCampaignsContent = () => (
    <div className="mt-4">
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
          <CardDescription>Create and manage your advertising campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => navigate('/announcements/create')}
              className="bg-crypto-green hover:bg-crypto-green/90"
            >
              Create New Campaign
            </Button>
          </div>
          <CampaignTable campaigns={announcements.map((announcement: any) => ({
            id: announcement.id,
            title: announcement.title,
            status: announcement.status,
            communities: 2, // Placeholder
            impressions: Math.floor(Math.random() * 10000),
            spent: Math.floor(Math.random() * 1000)
          }))} />
        </CardContent>
      </Card>
    </div>
  );

  const renderValidationContent = () => (
    <div className="mt-4">
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>AI Validation</CardTitle>
          <CardDescription>AI-powered content validation for your announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-border/50 rounded-md bg-crypto-darkgray/80">
              <h3 className="font-medium mb-2">How AI Validation Works</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our AI engine analyzes your announcements to ensure they comply with community guidelines and optimizes 
                them for maximum engagement.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-md border border-border/50">
                  <BrainCircuit className="h-6 w-6 text-crypto-blue mb-2" />
                  <h4 className="text-sm font-medium mb-1">Content Analysis</h4>
                  <p className="text-xs text-muted-foreground">Checks for compliance with guidelines and policies</p>
                </div>
                <div className="p-3 rounded-md border border-border/50">
                  <Megaphone className="h-6 w-6 text-crypto-green mb-2" />
                  <h4 className="text-sm font-medium mb-1">Engagement Optimization</h4>
                  <p className="text-xs text-muted-foreground">Suggests improvements for maximum reach and engagement</p>
                </div>
                <div className="p-3 rounded-md border border-border/50">
                  <TrendingUp className="h-6 w-6 text-purple-500 mb-2" />
                  <h4 className="text-sm font-medium mb-1">Performance Prediction</h4>
                  <p className="text-xs text-muted-foreground">Estimates potential reach and conversion metrics</p>
                </div>
              </div>
            </div>
            
            <h3 className="font-medium mt-6 mb-2">Recent Validations</h3>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements
                  .filter((a: any) => a.validation_result)
                  .map((announcement: any) => (
                    <div key={announcement.id} className="p-4 border border-border/50 rounded-md">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <Badge variant="outline" className={getStatusColor(announcement.status)}>
                          {announcement.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{announcement.content}</p>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Validated on {formatDate(announcement.updated_at)}</span>
                        <Button variant="link" size="sm" className="h-auto p-0 text-crypto-blue">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No validations yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMarketplaceContent = () => (
    <div className="mt-4">
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>Community Marketplace</CardTitle>
          <CardDescription>Discover and join crypto communities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border border-border/50 rounded-md bg-crypto-darkgray/80">
              <h3 className="font-medium text-center mb-3">My Communities</h3>
              <div className="text-center text-3xl font-bold text-crypto-green">{communities.length}</div>
              <p className="text-xs text-muted-foreground text-center mt-2">Communities you own</p>
              <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => navigate('/communities/create')}>
                Create Community
              </Button>
            </div>
            <div className="p-4 border border-border/50 rounded-md bg-crypto-darkgray/80">
              <h3 className="font-medium text-center mb-3">Available Communities</h3>
              <div className="text-center text-3xl font-bold text-crypto-blue">58</div>
              <p className="text-xs text-muted-foreground text-center mt-2">Communities you can join</p>
              <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => navigate('/communities')}>
                Browse Communities
              </Button>
            </div>
            <div className="p-4 border border-border/50 rounded-md bg-crypto-darkgray/80">
              <h3 className="font-medium text-center mb-3">Potential Reach</h3>
              <div className="text-center text-3xl font-bold text-yellow-500">1.2M+</div>
              <p className="text-xs text-muted-foreground text-center mt-2">Combined audience size</p>
              <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => navigate('/communities')}>
                Maximize Reach
              </Button>
            </div>
          </div>
          
          <h3 className="font-medium mb-3">Featured Communities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                name: "Crypto Traders Network", 
                platform: "TELEGRAM", 
                members: "12,540", 
                price: "$30",
                description: "Connect with professional crypto traders and get real-time market insights."
              },
              { 
                name: "DeFi Developers", 
                platform: "DISCORD", 
                members: "8,320", 
                price: "$25",
                description: "Community for blockchain developers focused on DeFi innovations."
              },
              { 
                name: "NFT Collectors", 
                platform: "TELEGRAM", 
                members: "15,780", 
                price: "$35",
                description: "The largest community for NFT enthusiasts, collectors and creators."
              },
              { 
                name: "Web3 Entrepreneurs", 
                platform: "DISCORD", 
                members: "10,450", 
                price: "$30",
                description: "Connect with founders and investors building the future of Web3."
              }
            ].map((community, index) => (
              <div key={index} className="p-4 border border-border/50 rounded-md">
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">{community.name}</h4>
                  <Badge variant="outline" className={
                    community.platform === "TELEGRAM" 
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                  }>
                    {community.platform}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{community.description}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    <span className="block">{community.members} members</span>
                    <span>{community.price} per announcement</span>
                  </div>
                  <Button size="sm" className="bg-crypto-blue hover:bg-crypto-blue/90">
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => navigate('/communities')}>
              View All Communities <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
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
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">Transaction</th>
                  <th className="text-left py-2 px-4 text-
