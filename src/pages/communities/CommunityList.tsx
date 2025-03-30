
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Users, Search, ExternalLink } from 'lucide-react';
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
}

const CommunityList: React.FC = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCommunities = async () => {
      setIsLoading(true);
      try {
        // Fetch all communities
        const { data: allCommunitiesData, error: allCommunitiesError } = await supabase
          .from('communities')
          .select('*')
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

    fetchCommunities();
  }, [user]);

  const filteredCommunities = communities.filter(community => 
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyCommunities = myCommunities.filter(community => 
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold">Communities</h1>
            <p className="text-muted-foreground">Browse and manage crypto communities</p>
          </div>
          <Link to="/communities/create">
            <Button className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
              <Plus className="mr-2 h-4 w-4" /> Add Community
            </Button>
          </Link>
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
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">
              <Users className="mr-2 h-4 w-4" /> All Communities
            </TabsTrigger>
            <TabsTrigger value="mine">
              <Users className="mr-2 h-4 w-4" /> My Communities
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCommunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommunities.map((community) => (
                  <Link to={`/communities/${community.id}`} key={community.id}>
                    <Card className="h-full hover:border-crypto-blue/50 transition-colors border border-border/50 bg-crypto-darkgray/50">
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {community.reach.toLocaleString()} members
                          </span>
                          <span className="font-medium text-crypto-green">
                            ${community.price_per_announcement}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? 'No communities found matching your search.' : 'No communities available.'}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mine" className="mt-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMyCommunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyCommunities.map((community) => (
                  <Link to={`/communities/${community.id}`} key={community.id}>
                    <Card className="h-full hover:border-crypto-blue/50 transition-colors border border-border/50 bg-crypto-darkgray/50">
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {community.reach.toLocaleString()} members
                          </span>
                          <span className="font-medium text-crypto-green">
                            ${community.price_per_announcement}
                          </span>
                        </div>
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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default CommunityList;
