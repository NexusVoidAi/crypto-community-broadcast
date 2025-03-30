
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import DashboardNav from '@/components/dashboard/DashboardNav';
import StatCards from '@/components/dashboard/StatCards';
import CampaignTable from '@/components/dashboard/CampaignTable';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { useUser } from '@/context/UserContext'; // Fixed import path
import { Campaign, StatCardData, ActivityItem } from '@/components/dashboard/types';
import { 
  Eye, 
  LayoutDashboard, 
  Megaphone, 
  ShoppingBag,
  CreditCard,
  Users,
  Coins,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { userId } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [statCards, setStatCards] = useState<StatCardData[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        // Fetch the user's announcements
        const { data: announcements, error } = await supabase
          .from('announcements')
          .select(`
            *,
            announcement_communities(
              community_id,
              views,
              clicks,
              community:communities(name, reach, platform)
            )
          `)
          .eq('user_id', userId);

        if (error) throw error;

        // Transform the announcements data into campaign format
        const campaignsData = announcements.map((announcement) => {
          const communities = announcement.announcement_communities.map(ac => ac.community);
          const totalReach = announcement.announcement_communities.reduce(
            (sum, ac) => sum + (ac.community?.reach || 0), 0
          );
          const totalClicks = announcement.announcement_communities.reduce(
            (sum, ac) => sum + (ac.clicks || 0), 0
          );
          // Since impressions column doesn't exist, use views instead
          const totalViews = announcement.announcement_communities.reduce(
            (sum, ac) => sum + (ac.views || 0), 0
          );
          
          // Calculate conversion rate using views instead of impressions
          const conversionRate = totalViews > 0 
            ? parseFloat(((totalClicks / totalViews) * 100).toFixed(1)) 
            : 0;
          
          // Calculate average cost based on communities
          const totalCost = announcement.announcement_communities.length * 25; // simplified calculation

          return {
            id: announcement.id,
            name: `Campaign ${announcement.id.substring(0, 4)}`,
            title: announcement.title,
            status: announcement.status,
            reach: totalReach,
            clicks: totalClicks,
            views: totalViews, // Use views instead of impressions
            conversionRate: conversionRate,
            budget: totalCost,
            spent: announcement.payment_status === 'PAID' ? totalCost : 0,
            communities: communities
          };
        });

        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast.error('Failed to fetch campaigns');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchActivity = async () => {
      try {
        // Mock activity data
        const mockActivity: ActivityItem[] = [
          {
            id: '1',
            type: 'announcement',
            title: 'New Announcement Published',
            description: 'Your announcement "Summer Sale" has been published.',
            timestamp: '2024-08-15T14:30:00Z',
            status: 'success'
          },
          {
            id: '2',
            type: 'payment',
            title: 'Payment Received',
            description: 'You have received a payment of $25 for your announcement.',
            timestamp: '2024-08-14T09:00:00Z',
            status: 'success'
          },
          {
            id: '3',
            type: 'community',
            title: 'New Community Joined',
            description: 'Your community "Tech Enthusiasts" has joined the platform.',
            timestamp: '2024-08-13T18:45:00Z',
            status: 'success'
          }
        ];
        setActivity(mockActivity);
      } catch (error) {
        console.error('Error fetching activity:', error);
        toast.error('Failed to fetch activity');
      }
    };

    const calculateStats = () => {
      // Mock stat card data
      const mockStatCards: StatCardData[] = [
        {
          title: 'Total Reach',
          value: campaigns.reduce((sum, campaign) => sum + campaign.reach, 0).toLocaleString(),
          icon: Users,
          iconColor: 'text-blue-500'
        },
        {
          title: 'Total Views',
          value: campaigns.reduce((sum, campaign) => sum + (campaign.views || 0), 0).toLocaleString(),
          icon: Eye,
          iconColor: 'text-green-500'
        },
        {
          title: 'Total Spent',
          value: `$${campaigns.reduce((sum, campaign) => sum + campaign.spent, 0).toFixed(2)}`,
          icon: Coins,
          iconColor: 'text-red-500'
        },
        {
          title: 'Total Campaigns',
          value: campaigns.length.toLocaleString(),
          icon: MessageSquare,
          iconColor: 'text-yellow-500'
        }
      ];
      setStatCards(mockStatCards);
    };

    if (userId) {
      fetchCampaigns();
      fetchActivity();
    }

    if (campaigns.length > 0) {
      calculateStats();
    }
  }, [userId, campaigns]);

  const renderCampaignsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Campaigns</h2>
        <Button className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
          <Megaphone className="mr-2 h-4 w-4" />
          Create New Campaign
        </Button>
      </div>
      <CampaignTable campaigns={campaigns} />
    </div>
  );

  const renderMarketplaceTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Community Marketplace</h2>
        <Button className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
          <ShoppingBag className="mr-2 h-4 w-4" />
          Browse Communities
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Card key={item} className="border border-border/20 bg-crypto-darkgray/20 hover:bg-crypto-darkgray/30 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle>Community #{item}</CardTitle>
              <CardDescription>Crypto enthusiasts with active engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm mb-2">
                <span>Members:</span>
                <span className="font-medium">{(Math.floor(Math.random() * 10) + 1) * 1000}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Engagement:</span>
                <span className="font-medium">{Math.floor(Math.random() * 30) + 70}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cost:</span>
                <span className="font-medium">${(Math.floor(Math.random() * 5) + 1) * 25}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full border-crypto-green text-crypto-green hover:bg-crypto-green/10">
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment History</h2>
        <Button className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
          <CreditCard className="mr-2 h-4 w-4" />
          Make Payment
        </Button>
      </div>
      
      <Card className="border border-border/20 bg-crypto-darkgray/20">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your payment history for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex justify-between items-center border-b border-border/10 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center">
                  <div className="bg-crypto-darkgray mr-3 p-2 rounded">
                    <CreditCard className="h-4 w-4 text-crypto-green" />
                  </div>
                  <div>
                    <div className="font-medium">Campaign Payment</div>
                    <div className="text-sm text-muted-foreground">Aug {10 + item}, 2024</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${item * 25}</div>
                  <div className="text-xs text-green-500">Completed</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">View All Transactions</Button>
        </CardFooter>
      </Card>
      
      <Card className="border border-border/20 bg-crypto-darkgray/20">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-crypto-darkgray mr-3 p-2 rounded">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium">Visa ending in 4242</div>
                  <div className="text-sm text-muted-foreground">Expires 12/25</div>
                </div>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">Add Payment Method</Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        
        <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'overview' && (
          <>
            <StatCards cards={statCards} isLoading={isLoading} />
            <CampaignTable campaigns={campaigns} />
            <ActivityFeed activity={activity} />
          </>
        )}
        
        {activeTab === 'campaigns' && renderCampaignsTab()}
        
        {activeTab === 'marketplace' && renderMarketplaceTab()}
        
        {activeTab === 'payments' && renderPaymentsTab()}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
