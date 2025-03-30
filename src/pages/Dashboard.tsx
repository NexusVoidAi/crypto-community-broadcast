
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import DashboardNav from '@/components/dashboard/DashboardNav';
import StatCards from '@/components/dashboard/StatCards';
import CampaignTable from '@/components/dashboard/CampaignTable';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, LayoutDashboard, Megaphone, ShoppingBag, CreditCard, Users, Coins, MessageSquare } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activity, setActivity] = useState<any[]>([]);
  const [statCards, setStatCards] = useState<any[]>([]);

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
          .eq('user_id', user?.id);

        if (error) throw error;

        // Transform the announcements data into campaign format
        const campaignsData = announcements.map((announcement: any) => {
          const communities = announcement.announcement_communities.map((ac: any) => ac.community);
          const totalReach = announcement.announcement_communities.reduce((sum: number, ac: any) => sum + (ac.community?.reach || 0), 0);
          const totalClicks = announcement.announcement_communities.reduce((sum: number, ac: any) => sum + (ac.clicks || 0), 0);
          
          // Use views instead of impressions
          const totalViews = announcement.announcement_communities.reduce((sum: number, ac: any) => sum + (ac.views || 0), 0);
          
          // Calculate conversion rate using views instead of impressions
          const conversionRate = totalViews > 0 ? parseFloat((totalClicks / totalViews * 100).toFixed(1)) : 0;
          
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
      } catch (error: any) {
        console.error('Error fetching campaigns:', error);
        toast.error('Failed to fetch campaigns');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchActivity = async () => {
      try {
        // Mock activity data
        const mockActivity = [
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
      // Stat card data
      const statsCards = [
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
      setStatCards(statsCards);
    };

    if (user?.id) {
      fetchCampaigns();
      fetchActivity();
    }

    if (campaigns.length > 0) {
      calculateStats();
    }
  }, [user?.id, campaigns.length]);

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      path: '/'
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: Megaphone,
      path: '/campaigns'
    },
    {
      id: 'marketplace',
      label: 'Community Marketplace',
      icon: ShoppingBag,
      path: '/communities'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      path: '/payments'
    }
  ];

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        
        <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {activeTab === 'overview' && (
          <>
            <StatCards cards={statCards} isLoading={isLoading} />
            <CampaignTable campaigns={campaigns} />
            <ActivityFeed activities={activity} />
          </>
        )}
        
        {activeTab !== 'overview' && (
          <div className="text-muted-foreground text-center py-12">
            This section is under construction. Please check back later!
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
