import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Users, Search, MapPin, Target, Wallet } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Community {
  id: string;
  name: string;
  description: string;
  platform: 'TELEGRAM' | 'DISCORD' | 'WHATSAPP';
  reach: number;
  price_per_announcement: number;
  owner_id: string;
  approval_status: string;
  region?: string[];
  focus_areas?: string[];
}

const CommunityList: React.FC = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    fetchCommunities();
    fetchTotalEarnings();
  }, [user]);

  const fetchCommunities = async () => {
    setIsLoading(true);
    try {
      // Fetch all approved communities
      const { data: allCommunitiesData, error: allCommunitiesError } = await supabase
        .from('communities')
        .select('*')
        .eq('approval_status', 'APPROVED')
        .order('created_at', { ascending: false });

      if (allCommunitiesError) throw allCommunitiesError;
      setCommunities(allCommunitiesData || []);
      
      // Fetch user's communities
      if (user) {
        const { data: myCommunitiesData, error: myCommunitiesError } = await supabase
          .from('communities')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });
          
        if (myCommunitiesError) throw myCommunitiesError;
        setMyCommunities(myCommunitiesData || []);
      }
    } catch (error: any) {
      toast.error(`Error loading communities: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTotalEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('community_earnings')
        .select('amount')
        .eq('currency', 'USDT');

      if (error) throw error;
      
      const total = data?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      setTotalEarnings(total);
    } catch (error: any) {
      console.error('Error fetching total earnings:', error);
    }
  };

  const filteredMyCommunities = myCommunities.filter(community => 
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total reach across all communities
  const totalReach = communities.reduce((sum, community) => sum + (community.reach || 0), 0);

  // Helper function to render regions and focus areas
  const renderBadgeList = (items: string[] | undefined, icon: React.ReactNode) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {items.map((item, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="bg-crypto-darkgray/50 text-xs font-normal py-0 h-5 border-border/30 flex items-center"
          >
            {icon}
            <span className="ml-1 truncate max-w-[80px]">{item}</span>
          </Badge>
        ))}
      </div>
    );
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'TELEGRAM':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DISCORD':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'WHATSAPP':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Communities</h1>
            <p className="text-muted-foreground">Browse and manage crypto communities</p>
          </div>
          <Link to="/communities/create">
            <Button className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
              <Plus className="mr-2 h-4 w-4" /> Add Community
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-border/50 bg-crypto-darkgray/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Communities</p>
                  <p className="text-2xl font-bold">{communities.length}</p>
                </div>
                <Users className="h-8 w-8 text-crypto-green opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-crypto-darkgray/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reach</p>
                  <p className="text-2xl font-bold">{totalReach.toLocaleString()}</p>
                </div>
                <Target className="h-8 w-8 text-crypto-blue opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-crypto-darkgray/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">${totalEarnings.toLocaleString()}</p>
                </div>
                <Wallet className="h-8 w-8 text-crypto-green opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            className="pl-10 bg-crypto-darkgray/50 border-border/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Card className="border-border/50 bg-crypto-darkgray/50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Users className="mr-2 h-5 w-5 text-crypto-green" />
              <h2 className="text-lg font-semibold text-white">My Communities</h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMyCommunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyCommunities.map((community) => (
                  <Link to={`/communities/${community.id}`} key={community.id}>
                    <Card className="h-full hover:border-crypto-blue/50 transition-colors border border-border/50 bg-crypto-darkgray/50 backdrop-blur-md hover:shadow-lg hover:shadow-crypto-blue/10 hover:-translate-y-1 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg truncate flex-1">{community.name}</h3>
                          <Badge variant="outline" className={`ml-2 ${getPlatformColor(community.platform)}`}>
                            {community.platform}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {community.description || 'No description provided'}
                        </p>
                        
                        {renderBadgeList(community.region, <MapPin className="h-3 w-3 text-white" />)}
                        
                        {renderBadgeList(community.focus_areas, <Target className="h-3 w-3 text-white" />)}
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Users className="h-3 w-3 mr-1" /> {community.reach.toLocaleString()}
                          </span>
                          <span className="font-medium text-crypto-green">
                            ${community.price_per_announcement}
                          </span>
                        </div>
                        <Badge variant="outline" className={`mt-3 ${
                          community.approval_status === 'APPROVED' 
                            ? 'bg-crypto-green/10 text-crypto-green border-crypto-green/20'
                            : community.approval_status === 'PENDING'
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {community.approval_status}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No communities found matching your search.' : 'You haven\'t created any communities yet.'}
                </p>
                <Link to="/communities/create">
                  <Button className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
                    <Plus className="mr-2 h-4 w-4" /> Create Community
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CommunityList;
