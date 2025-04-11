
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Save, 
  Users, 
  LineChart, 
  Ban, 
  Send, 
  MessagesSquare,
  AlertTriangle,
  Loader2,
  Eye,
  MousePointer,
  Clock,
  BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Community {
  id: string;
  name: string;
  description: string;
  platform: 'TELEGRAM' | 'DISCORD' | 'WHATSAPP';
  platform_id: string | null;
  reach: number;
  price_per_announcement: number;
  wallet_address: string | null;
  owner_id: string;
  created_at: string;
}

interface AnnouncementCommunity {
  id: string;
  announcement_id: string;
  views: number;
  clicks: number;
  created_at: string;
  announcement: {
    title: string;
    content: string;
    status: string;
    created_at: string;
  };
}

interface CommunityStats {
  member_count: number;
  active_users: number;
  total_messages: number;
  engagement_rate: number;
}

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementCommunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [reach, setReach] = useState('');
  const [price, setPrice] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isOwner = community && user && community.owner_id === user.id;

  // Function to track announcement views
  const trackView = async (announcementId: string) => {
    if (!id || !announcementId) return;
    
    try {
      await supabase.functions.invoke('telegram-analytics', {
        body: {
          communityId: id,
          announcementId,
          action: 'view'
        }
      });
      
      // Update local state
      setAnnouncements(prev => 
        prev.map(item => 
          item.announcement_id === announcementId 
            ? { ...item, views: (item.views || 0) + 1 } 
            : item
        )
      );
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  // Function to track announcement clicks
  const trackClick = async (announcementId: string) => {
    if (!id || !announcementId) return;
    
    try {
      await supabase.functions.invoke('telegram-analytics', {
        body: {
          communityId: id,
          announcementId,
          action: 'click'
        }
      });
      
      // Update local state
      setAnnouncements(prev => 
        prev.map(item => 
          item.announcement_id === announcementId 
            ? { ...item, clicks: (item.clicks || 0) + 1 } 
            : item
        )
      );
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  };
  
  const fetchAnalytics = async () => {
    if (!id) return;

    setIsLoadingAnalytics(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('telegram-analytics', {
        body: { communityId: id }
      });

      if (error) throw error;
      
      if (response && response.success) {
        setCommunityStats(response.stats);
        
        // Update announcements with latest metrics
        if (response.announcements && response.announcements.length > 0) {
          setAnnouncements(response.announcements);
        }
      }
    } catch (error: any) {
      toast.error(`Error loading analytics: ${error.message}`);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };
  
  useEffect(() => {
    const fetchCommunityData = async () => {
      setIsLoading(true);
      try {
        if (!id) return;
        
        // Fetch community details
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setCommunity(data);
        
        // Set form data
        setName(data.name);
        setDescription(data.description || '');
        setPlatformId(data.platform_id || '');
        setReach(data.reach ? data.reach.toString() : '0');
        setPrice(data.price_per_announcement ? data.price_per_announcement.toString() : '25');
        setWalletAddress(data.wallet_address || '');
        
        // Fetch related announcements
        const { data: announcementData, error: announcementError } = await supabase
          .from('announcement_communities')
          .select(`
            id,
            announcement_id,
            views,
            clicks,
            created_at,
            announcement:announcements (
              title,
              content,
              status,
              created_at
            )
          `)
          .eq('community_id', id)
          .order('created_at', { ascending: false });
          
        if (announcementError) throw announcementError;
        setAnnouncements(announcementData || []);
      } catch (error: any) {
        toast.error(`Error loading community: ${error.message}`);
        navigate('/communities');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCommunityData();
  }, [id, navigate, user]);
  
  const handleUpdateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !community) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          name,
          description,
          platform_id: platformId,
          reach: parseInt(reach) || 0,
          price_per_announcement: parseFloat(price) || 25.00,
          wallet_address: walletAddress
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setCommunity({
        ...community,
        name,
        description,
        platform_id: platformId,
        reach: parseInt(reach) || 0,
        price_per_announcement: parseFloat(price) || 25.00,
        wallet_address: walletAddress
      });
      
      setIsEditing(false);
      toast.success('Community updated successfully');
    } catch (error: any) {
      toast.error(`Error updating community: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteCommunity = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Community deleted successfully');
      navigate('/communities');
    } catch (error: any) {
      toast.error(`Error deleting community: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'TELEGRAM':
        return <Send className="h-5 w-5 text-blue-400" />;
      case 'DISCORD':
        return <MessagesSquare className="h-5 w-5 text-indigo-400" />;
      case 'WHATSAPP':
        return <Send className="h-5 w-5 text-green-400" />;
      default:
        return <MessagesSquare className="h-5 w-5" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }
  
  if (!community) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Community not found.</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/communities')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Communities
          </Button>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/communities')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Communities
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{community.name}</h1>
              <Badge variant="outline" className="uppercase">
                {community.platform}
              </Badge>
            </div>
            
            {isOwner && !isEditing && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-crypto-darkgray border border-border/50">
                    <DialogHeader>
                      <DialogTitle>Delete Community</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this community? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDeleteDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteCommunity}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Community'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            
            {isEditing && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateCommunity}
                  className="bg-crypto-blue hover:bg-crypto-blue/90"
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {!isEditing ? (
              <Card className="border border-border/50 bg-crypto-darkgray/50">
                <CardHeader>
                  <CardTitle>Community Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Platform</h3>
                    <div className="flex items-center">
                      {getPlatformIcon(community.platform)}
                      <span className="ml-2">{community.platform}</span>
                    </div>
                  </div>
                  
                  {community.platform_id && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Channel/Group ID</h3>
                      <p>{community.platform_id}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Community Size</h3>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{community.reach.toLocaleString()} members</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Price per Announcement</h3>
                    <p className="text-crypto-green font-medium">${community.price_per_announcement}</p>
                  </div>
                  
                  {community.wallet_address && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Wallet Address</h3>
                      <p className="text-xs break-all">{community.wallet_address}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                    <p>{formatDate(community.created_at)}</p>
                  </div>
                  
                  {community.description && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                      <p className="text-sm">{community.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-border/50 bg-crypto-darkgray/50">
                <CardHeader>
                  <CardTitle>Edit Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Community Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-crypto-dark border-border/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-crypto-dark border-border/50 min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="platformId">Channel/Group ID</Label>
                      <Input
                        id="platformId"
                        value={platformId}
                        onChange={(e) => setPlatformId(e.target.value)}
                        className="bg-crypto-dark border-border/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reach">Community Size</Label>
                      <Input
                        id="reach"
                        type="number"
                        value={reach}
                        onChange={(e) => setReach(e.target.value)}
                        className="bg-crypto-dark border-border/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price">Price per Announcement ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        step="0.01"
                        min="0"
                        className="bg-crypto-dark border-border/50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="wallet">Wallet Address</Label>
                      <Input
                        id="wallet"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="bg-crypto-dark border-border/50"
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-2">
            <Tabs defaultValue="announcements" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="announcements">
                  <Send className="mr-2 h-4 w-4" /> Announcements
                </TabsTrigger>
                <TabsTrigger value="analytics" onClick={fetchAnalytics}>
                  <LineChart className="mr-2 h-4 w-4" /> Analytics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="announcements" className="mt-0">
                <Card className="border border-border/50 bg-crypto-darkgray/50">
                  <CardHeader>
                    <CardTitle>Recent Announcements</CardTitle>
                    <CardDescription>
                      Announcements that have been published to this community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {announcements.length > 0 ? (
                      <div className="space-y-4">
                        {announcements.map((item) => (
                          <div 
                            key={item.id} 
                            className="p-4 border border-border/50 rounded-md"
                            onClick={() => trackView(item.announcement_id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium">{item.announcement.title}</h3>
                              <Badge 
                                variant={item.announcement.status === 'PUBLISHED' ? 'default' : 'outline'}
                                className={
                                  item.announcement.status === 'PUBLISHED' 
                                    ? 'bg-green-500/20 text-green-500 border-green-500/40' 
                                    : ''
                                }
                              >
                                {item.announcement.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {item.announcement.content}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDate(item.announcement.created_at)}</span>
                              <div className="flex space-x-4">
                                <span className="flex items-center">
                                  <Eye className="h-3 w-3 mr-1" /> {item.views || 0} views
                                </span>
                                <span className="flex items-center">
                                  <MousePointer className="h-3 w-3 mr-1" /> {item.clicks || 0} clicks
                                </span>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 h-auto text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    trackClick(item.announcement_id);
                                  }}
                                >
                                  Record Click
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Ban className="mx-auto h-12 w-12 opacity-30 mb-4" />
                        <p className="mb-2">No announcements yet</p>
                        <p className="text-sm">
                          This community hasn't had any announcements published yet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-0">
                <Card className="border border-border/50 bg-crypto-darkgray/50">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Performance Analytics</CardTitle>
                        <CardDescription>
                          Engagement metrics for your community
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchAnalytics} 
                        disabled={isLoadingAnalytics}
                      >
                        {isLoadingAnalytics ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Clock className="h-4 w-4 mr-1" />
                        )}
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingAnalytics ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : communityStats ? (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-crypto-dark/50 p-4 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xs text-muted-foreground">Members</h3>
                              <Users className="h-4 w-4 text-blue-400" />
                            </div>
                            <p className="text-xl font-bold">{communityStats.member_count.toLocaleString()}</p>
                          </div>
                          
                          <div className="bg-crypto-dark/50 p-4 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xs text-muted-foreground">Active Users</h3>
                              <Users className="h-4 w-4 text-green-400" />
                            </div>
                            <p className="text-xl font-bold">{communityStats.active_users.toLocaleString()}</p>
                          </div>
                          
                          <div className="bg-crypto-dark/50 p-4 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xs text-muted-foreground">Messages</h3>
                              <MessagesSquare className="h-4 w-4 text-purple-400" />
                            </div>
                            <p className="text-xl font-bold">{communityStats.total_messages.toLocaleString()}</p>
                          </div>
                          
                          <div className="bg-crypto-dark/50 p-4 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xs text-muted-foreground">Engagement</h3>
                              <BarChart3 className="h-4 w-4 text-amber-400" />
                            </div>
                            <p className="text-xl font-bold">
                              {(communityStats.engagement_rate * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <h3 className="text-md font-medium mb-3">Announcements Performance</h3>
                        
                        {announcements.length > 0 ? (
                          <div className="space-y-3">
                            {announcements.slice(0, 5).map(item => (
                              <div key={item.id} className="p-3 bg-crypto-dark/30 rounded-md border border-border/30">
                                <div className="text-sm font-medium mb-1">{item.announcement.title}</div>
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                  <span>{formatDate(item.created_at)}</span>
                                  <div className="flex space-x-4">
                                    <span className="flex items-center">
                                      <Eye className="h-3 w-3 mr-1" /> {item.views || 0}
                                    </span>
                                    <span className="flex items-center">
                                      <MousePointer className="h-3 w-3 mr-1" /> {item.clicks || 0}
                                    </span>
                                    {item.views > 0 && item.clicks > 0 && (
                                      <span className="flex items-center">
                                        <BarChart3 className="h-3 w-3 mr-1" /> 
                                        {((item.clicks / item.views) * 100).toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No announcement data available yet
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <LineChart className="mx-auto h-12 w-12 opacity-30 mb-4" />
                        <p className="mb-2">No analytics data available</p>
                        <p className="text-sm">
                          Click the refresh button to load analytics data for this community.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={fetchAnalytics}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Load Analytics
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CommunityDetail;
