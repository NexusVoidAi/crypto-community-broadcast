
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, MousePointerClick, BarChart2, MessageSquareHeart } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Type definitions
interface Announcement {
  // Database fields that come from Supabase
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  user_id: string;
  // Optional database fields
  impressions?: number | null;
  cta_text?: string | null;
  cta_url?: string | null;
  media_url?: string | null;
  payment_status?: string;
  updated_at?: string;
  validation_result?: any;
  // Fields we'll compute or mock for UI
  views: number;
  clicks: number;
  engagement: number;
}

interface EngagementData {
  name: string;
  views: number;
  clicks: number;
  engagement: number;
}

// Generate sample data for charts
const generateSampleData = (seed: number): EngagementData[] => {
  const data = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Use seed to generate consistent but unique-looking data
    const views = Math.floor(100 + Math.sin(seed + i * 0.5) * 50 + Math.random() * 20);
    const clicks = Math.floor(views * (0.2 + Math.sin(seed + i * 0.7) * 0.1));
    const engagement = Math.floor(clicks * (0.5 + Math.sin(seed + i * 0.3) * 0.2));
    
    data.push({ name: dateString, views, clicks, engagement });
  }
  
  return data;
};

// AnnouncementCard component
const AnnouncementCard: React.FC<{ announcement: Announcement }> = ({ announcement }) => {
  const navigate = useNavigate();
  const chartData = generateSampleData(parseInt(announcement.id.replace(/\D/g, '').slice(0, 5) || '1'));
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'PUBLISHED':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'PENDING':
      case 'PENDING_VALIDATION':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'REJECTED':
      case 'VALIDATION_FAILED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'DRAFT':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className="mb-4 bg-crypto-darkgray/40 border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-space text-white">{announcement.title}</CardTitle>
            <p className="text-sm text-white/70 mt-1">
              {new Date(announcement.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="outline" className={getStatusColor(announcement.status)}>
            {announcement.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-white/80 mb-4 line-clamp-2">{announcement.content}</p>
        
        <div className="h-[180px] w-full mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1A1F2C', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff'
                }}
              />
              <Line type="monotone" dataKey="views" stroke="#008B8B" strokeWidth={2} />
              <Line type="monotone" dataKey="clicks" stroke="#3671E9" strokeWidth={2} />
              <Line type="monotone" dataKey="engagement" stroke="#9945FF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex items-center text-white">
            <Eye className="h-4 w-4 mr-1.5 text-crypto-green" />
            <span>{announcement.views || Math.floor(Math.random() * 1000)} views</span>
          </div>
          <div className="flex items-center text-white">
            <MousePointerClick className="h-4 w-4 mr-1.5 text-crypto-blue" />
            <span>{announcement.clicks || Math.floor(Math.random() * 200)} clicks</span>
          </div>
          <div className="flex items-center text-white">
            <MessageSquareHeart className="h-4 w-4 mr-1.5 text-crypto-violet" />
            <span>{announcement.engagement || Math.floor(Math.random() * 50)} engagement</span>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="outline"
            size="sm"
            className="mr-2 text-white border-white/30 hover:bg-white/10"
            onClick={() => navigate(`/announcements/preview?id=${announcement.id}`)}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            View
          </Button>
          <Button 
            size="sm"
            className="bg-crypto-blue hover:bg-crypto-blue/90 text-white"
            onClick={() => navigate(`/announcements/analytics?id=${announcement.id}`)}
          >
            <BarChart2 className="h-4 w-4 mr-1.5" />
            Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main component
const AnnouncementList: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');

  // Fetch announcements from Supabase
  const { data: rawAnnouncements, isLoading, error } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching announcements:', error);
        throw error;
      }
    },
  });

  // Transform raw announcements to match our Announcement interface
  const announcements: Announcement[] = React.useMemo(() => {
    if (!rawAnnouncements) return [];
    
    return rawAnnouncements.map(announcement => ({
      ...announcement,
      // Add UI-specific fields with mock or computed data
      views: announcement.impressions || Math.floor(Math.random() * 1000),
      clicks: Math.floor((announcement.impressions || Math.random() * 1000) * 0.2),
      engagement: Math.floor((announcement.impressions || Math.random() * 1000) * 0.05)
    }));
  }, [rawAnnouncements]);

  // Show error in toast if query fails
  useEffect(() => {
    if (error) {
      toast.error('Failed to load announcements');
    }
  }, [error]);

  // Filter announcements based on current tab
  const filteredAnnouncements = React.useMemo(() => {
    if (!announcements) return [];
    
    if (filter === 'all') return announcements;
    
    return announcements.filter(ann => {
      if (filter === 'active') {
        return ['ACTIVE', 'PUBLISHED'].includes(ann.status);
      } else if (filter === 'pending') {
        return ['PENDING', 'PENDING_VALIDATION'].includes(ann.status);
      } else {
        return ann.status === filter.toUpperCase();
      }
    });
  }, [announcements, filter]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white font-space">Announcements</h1>
          <Button 
            onClick={() => navigate('/announcements/create')}
            variant="secondary"
            className="bg-crypto-green hover:bg-crypto-green/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Announcement
          </Button>
        </div>
        
        <Tabs defaultValue="all" onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-crypto-dark/70 text-white">
            <TabsTrigger value="all" className="data-[state=active]:bg-crypto-blue data-[state=active]:text-white">All</TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-crypto-blue data-[state=active]:text-white">Active</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-crypto-blue data-[state=active]:text-white">Pending</TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-crypto-blue data-[state=active]:text-white">Drafts</TabsTrigger>
          </TabsList>
          
          {['all', 'active', 'pending', 'draft'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-white/70">Loading announcements...</p>
                </div>
              ) : filteredAnnouncements.length > 0 ? (
                <div className="space-y-4">
                  {filteredAnnouncements.map(announcement => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40">
                  <p className="text-white/70 mb-4">No announcements found.</p>
                  <Button 
                    onClick={() => navigate('/announcements/create')}
                    variant="outline"
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first announcement
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        
        <Button 
          variant="secondary"
          className="fixed right-4 bottom-4 md:right-8 md:bottom-8 bg-crypto-green hover:bg-crypto-green/90 text-white shadow-lg"
          onClick={() => navigate('/announcements/create')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Announcement
        </Button>
      </div>
    </AppLayout>
  );
};

export default AnnouncementList;
