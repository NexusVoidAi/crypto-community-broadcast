
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CommunityApproval = () => {
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const fetchPendingCommunities = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          owner:profiles!owner_id(name)
        `)
        .eq('approval_status', 'PENDING')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setCommunities(data || []);
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to load communities");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCommunities();
  }, []);

  const handleApproveCommunity = async (communityId: string) => {
    setProcessingIds(prev => [...prev, communityId]);
    
    try {
      // Call Telegram bot check function
      const { data: botStatus, error: botError } = await supabase.functions.invoke("telegram-check-bot", {
        body: { communityId }
      });
      
      if (botError) throw botError;
      
      if (!botStatus?.botAdded) {
        toast.warning("Bot is not added to the group yet. Please make sure the bot is added to the group before approving.");
        setProcessingIds(prev => prev.filter(id => id !== communityId));
        return;
      }
      
      // Update community approval status
      const { error } = await supabase
        .from('communities')
        .update({ approval_status: 'APPROVED' })
        .eq('id', communityId);
        
      if (error) throw error;
      
      // Refresh the list
      fetchPendingCommunities();
      toast.success("Community approved successfully");
    } catch (error) {
      console.error("Error approving community:", error);
      toast.error("Failed to approve community");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== communityId));
    }
  };

  const handleRejectCommunity = async (communityId: string) => {
    setProcessingIds(prev => [...prev, communityId]);
    
    try {
      // Update community approval status
      const { error } = await supabase
        .from('communities')
        .update({ approval_status: 'REJECTED' })
        .eq('id', communityId);
        
      if (error) throw error;
      
      // Refresh the list
      fetchPendingCommunities();
      toast.success("Community rejected");
    } catch (error) {
      console.error("Error rejecting community:", error);
      toast.error("Failed to reject community");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== communityId));
    }
  };

  return (
    <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
      <CardHeader>
        <CardTitle>Pending Communities</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : communities.length > 0 ? (
          <div className="space-y-4">
            {communities.map((community) => (
              <Card key={community.id} className="border border-border/50 bg-crypto-dark/70">
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold">{community.name}</h3>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="mr-2">
                            {community.platform}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {community.reach?.toLocaleString() || 0} members
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Owner: {community.owner?.name || 'Unknown user'} • 
                          {new Date(community.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        Pending Approval
                      </Badge>
                    </div>
                    
                    {community.description && (
                      <p className="text-sm">{community.description}</p>
                    )}
                    
                    <div className="flex items-center">
                      <p className="text-sm font-medium mr-2">Post Price:</p>
                      <span className="font-bold text-crypto-green">${community.price_per_announcement}</span>
                    </div>
                    
                    {community.platform === 'TELEGRAM' && (
                      <div className="flex items-center space-x-2 bg-yellow-500/10 p-2 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <p className="text-xs">
                          Make sure the bot is added as admin to the Telegram group before approving
                        </p>
                      </div>
                    )}
                    
                    <div className="flex space-x-2 pt-2">
                      <Button
                        onClick={() => handleApproveCommunity(community.id)}
                        disabled={processingIds.includes(community.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        size="sm"
                      >
                        {processingIds.includes(community.id) ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-3 w-3" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectCommunity(community.id)}
                        disabled={processingIds.includes(community.id)}
                        variant="outline"
                        className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                        size="sm"
                      >
                        {processingIds.includes(community.id) ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-3 w-3" />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No pending communities to review</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityApproval;
