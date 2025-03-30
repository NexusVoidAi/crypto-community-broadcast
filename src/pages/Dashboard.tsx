
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import StatCard from '@/components/dashboard/StatCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import CreateAnnouncementButton from '@/components/dashboard/CreateAnnouncementButton';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight, 
  Wallet, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  ChevronRight 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock activity data
  const activities = [
    {
      id: '1',
      type: 'announcement' as const,
      title: 'Announcement Delivered',
      description: 'Your announcement was delivered to 3 communities',
      timestamp: '2 hours ago',
      status: 'success' as const,
    },
    {
      id: '2',
      type: 'payment' as const,
      title: 'Payment Completed',
      description: 'You paid $80.00 for announcement distribution',
      timestamp: '3 hours ago',
      status: 'success' as const,
    },
    {
      id: '3',
      type: 'validation' as const,
      title: 'Content Validated',
      description: 'AI validation passed with 95% confidence',
      timestamp: '3 hours ago',
      status: 'success' as const,
    },
    {
      id: '4',
      type: 'notification' as const,
      title: 'New Community Available',
      description: 'NFT Collectors community is now available',
      timestamp: '1 day ago',
      status: 'info' as const,
    },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's an overview of your platform activity.
            </p>
          </div>
          <CreateAnnouncementButton className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90" />
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            title="Wallet Balance"
            value="$1,240.50"
            description="Available for announcements"
            icon={<Wallet />}
          />
          <StatCard
            title="Total Reach"
            value="58,200"
            description="Across all communities"
            icon={<Users />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Announcements"
            value="8"
            description="Published this month"
            icon={<MessageSquare />}
            trend={{ value: 25, isPositive: true }}
          />
          <StatCard
            title="Engagement"
            value="32%"
            description="Avg. click-through rate"
            icon={<TrendingUp />}
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-6">
          <Card className="lg:col-span-2 border border-border/50 glassmorphism bg-crypto-darkgray/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-space">Recent Announcements</CardTitle>
                <CardDescription>Your last 3 published announcements</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/announcements')}>
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, title: 'New Token Launch', date: '2 days ago', engagement: '45%', communities: 3 },
                  { id: 2, title: 'Platform Update', date: '5 days ago', engagement: '38%', communities: 2 },
                  { id: 3, title: 'Community AMA', date: '1 week ago', engagement: '27%', communities: 4 },
                ].map((announcement) => (
                  <div key={announcement.id} className="flex justify-between items-center p-4 border border-border rounded-md hover:bg-muted/10 transition-colors cursor-pointer">
                    <div>
                      <h3 className="font-medium">{announcement.title}</h3>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-muted-foreground">{announcement.date}</span>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{announcement.communities} communities</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-4">
                        <span className="text-sm font-medium text-crypto-green">{announcement.engagement}</span>
                        <p className="text-xs text-muted-foreground">Engagement</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <ActivityFeed activities={activities} />
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
          <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
            <CardHeader>
              <CardTitle className="text-lg font-space">Community Revenue</CardTitle>
              <CardDescription>Total earnings distributed to communities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">$1,240.50</div>
              <div className="space-y-3">
                {[
                  { name: 'Crypto Traders', platform: 'Telegram', amount: '$450.00' },
                  { name: 'DeFi Hub', platform: 'Discord', amount: '$380.00' },
                  { name: 'NFT Collectors', platform: 'Discord', amount: '$270.50' },
                  { name: 'Web3 Founders', platform: 'WhatsApp', amount: '$140.00' },
                ].map((community, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{community.name}</p>
                      <p className="text-xs text-muted-foreground">{community.platform}</p>
                    </div>
                    <span className="font-medium text-crypto-green">{community.amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
            <CardHeader>
              <CardTitle className="text-lg font-space">AI Moderation Stats</CardTitle>
              <CardDescription>Performance of your announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold">92%</div>
                  <p className="text-sm text-muted-foreground">Avg. approval rate</p>
                </div>
                <div className="w-20 h-20 rounded-full border-4 border-crypto-blue flex items-center justify-center">
                  <div className="text-lg font-bold">A+</div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs">Content quality</span>
                    <span className="text-xs font-medium">95%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-crypto-blue h-1.5 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs">Delivery success</span>
                    <span className="text-xs font-medium">98%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-crypto-green h-1.5 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs">Engagement rate</span>
                    <span className="text-xs font-medium">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-crypto-violet h-1.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
