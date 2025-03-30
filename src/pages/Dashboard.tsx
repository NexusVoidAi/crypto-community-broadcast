
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
  TrendingUp,
  Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

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
import { ActivityItem, Campaign, TrendProps } from '@/components/dashboard/types';
import { Loader2 } from 'lucide-react';
import { 
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';

const sampleActivities: ActivityItem[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    title: 'New announcement created',
    description: 'Your announcement "Summer Sale" has been created.',
    icon: 'megaphone',
    variant: 'success',
  },
  {
    id: '2',
    timestamp: new Date().toISOString(),
    title: 'Payment received',
    description: 'You received a payment of $100 for your community.',
    icon: 'creditCard',
    variant: 'success',
  },
  {
    id: '3',
    timestamp: new Date().toISOString(),
    title: 'Announcement validation failed',
    description: 'Your announcement "Winter Sale" failed validation.',
    icon: 'alertTriangle',
    variant: 'warning',
  },
  {
    id: '4',
    timestamp: new Date().toISOString(),
    title: 'New community joined',
    description: 'A new community joined your network.',
    icon: 'users',
    variant: 'info',
  },
];

const sampleCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Sale',
    status: 'active',
    reach: 1000,
    clicks: 100,
    conversionRate: 0.1,
    budget: 100,
    spent: 50,
    title: 'Summer Sale',
    communities: [],
    impressions: 1500
  },
  {
    id: '2',
    name: 'Winter Sale',
    status: 'paused',
    reach: 500,
    clicks: 50,
    conversionRate: 0.05,
    budget: 50,
    spent: 25,
    title: 'Winter Sale',
    communities: [],
    impressions: 800
  },
  {
    id: '3',
    name: 'Spring Sale',
    status: 'draft',
    reach: 0,
    clicks: 0,
    conversionRate: 0,
    budget: 25,
    spent: 0,
    title: 'Spring Sale',
    communities: [],
    impressions: 0
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

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
        // Check if user has admin privileges - using a different approach
        // since 'admins' table doesn't exist in the Supabase schema
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

  const renderOverviewContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Announcements"
          value="124"
          trend={{value: "+12%", positive: true}}
          icon={<Megaphone className="h-5 w-5" />}
        />
        <StatCard
          title="Community Reach"
          value="12,432"
          trend={{value: "+1%", positive: true}}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Avg. CTR"
          value="0.32%"
          trend={{value: "-0.1%", positive: false}}
          icon={<ArrowRight className="h-5 w-5" />}
        />
      </div>
      
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>Your revenue for the last 7 days</CardDescription>
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
        <ActivityFeed activities={sampleActivities} />
        
        <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Your tasks for this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Create new announcement</p>
                <p className="text-sm text-muted-foreground">Due in 2 days</p>
              </div>
              <Button variant="outline" size="sm">
                <Check className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Review community applications</p>
                <p className="text-sm text-muted-foreground">Due in 5 days</p>
              </div>
              <Button variant="outline" size="sm">
                <Check className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCampaignsContent = () => (
    <div className="mt-4">
      <CampaignTable campaigns={sampleCampaigns} />
    </div>
  );

  const renderValidationContent = () => (
    <div className="mt-4">
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>AI Validation</CardTitle>
          <CardDescription>Validate your announcements with AI</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This feature is coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderMarketplaceContent = () => (
    <div className="mt-4">
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>Community Marketplace</CardTitle>
          <CardDescription>Discover new communities to promote your announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This feature is coming soon!</p>
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

  const renderSettingsContent = () => (
    <div className="mt-4">
      <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your profile and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" placeholder="Your Name" value={profile?.name || ''} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" placeholder="your.email@example.com" value={user?.email || ''} readOnly />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates on your announcements</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Announcement Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when your announcements are approved</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Security</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewContent();
      case "campaigns":
        return renderCampaignsContent();
      case "validation":
        return renderValidationContent();
      case "marketplace":
        return renderMarketplaceContent();
      case "payments":
        return renderPaymentsContent();
      case "settings":
        return renderSettingsContent();
      default:
        return renderOverviewContent();
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar className="border-r border-border/50">
          <SidebarHeader className="h-14 flex items-center border-b border-border/50 px-4">
            <h2 className="text-lg font-bold">Dashboard</h2>
          </SidebarHeader>
          <SidebarContent className="pb-4">
            <SidebarMenu>
              <SidebarMenuItem 
                onClick={() => setActiveTab("overview")}
                className={cn("hover:bg-crypto-darkgray/50", activeTab === "overview" && "bg-crypto-darkgray/30")}
              >
                <LayoutDashboard className="h-5 w-5 mr-3" />
                Overview
              </SidebarMenuItem>
              <SidebarMenuItem 
                onClick={() => setActiveTab("campaigns")}
                className={cn("hover:bg-crypto-darkgray/50", activeTab === "campaigns" && "bg-crypto-darkgray/30")}
              >
                <Megaphone className="h-5 w-5 mr-3" />
                Campaigns
              </SidebarMenuItem>
              <SidebarMenuItem 
                onClick={() => setActiveTab("validation")}
                className={cn("hover:bg-crypto-darkgray/50", activeTab === "validation" && "bg-crypto-darkgray/30")}
              >
                <BrainCircuit className="h-5 w-5 mr-3" />
                AI Validation
              </SidebarMenuItem>
              <SidebarMenuItem 
                onClick={() => setActiveTab("marketplace")}
                className={cn("hover:bg-crypto-darkgray/50", activeTab === "marketplace" && "bg-crypto-darkgray/30")}
              >
                <ShoppingBag className="h-5 w-5 mr-3" />
                Community Marketplace
              </SidebarMenuItem>
              <SidebarMenuItem 
                onClick={() => setActiveTab("payments")}
                className={cn("hover:bg-crypto-darkgray/50", activeTab === "payments" && "bg-crypto-darkgray/30")}
              >
                <CreditCard className="h-5 w-5 mr-3" />
                Payments
              </SidebarMenuItem>
              <SidebarMenuItem 
                onClick={() => setActiveTab("settings")}
                className={cn("hover:bg-crypto-darkgray/50", activeTab === "settings" && "bg-crypto-darkgray/30")}
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </SidebarMenuItem>
              
              {isAdmin && (
                <SidebarMenuItem 
                  onClick={() => navigate('/admin')}
                  className="mt-4 border-t border-border/50 pt-4 hover:bg-crypto-darkgray/50"
                >
                  <Shield className="h-5 w-5 mr-3" />
                  Admin Dashboard
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-crypto-blue flex items-center justify-center text-white font-bold">
                {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
              <div className="flex items-center gap-2">
                {activeTab === "campaigns" && (
                  <CreateAnnouncementButton />
                )}
              </div>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
