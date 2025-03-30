
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Users, 
  Send,
  MessageSquare,
  Hash,
  BotMessageSquare,
  ShieldCheck,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CommunityApproval = () => {
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [checkingBot, setCheckingBot] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingCommunities();
  }, []);

  const fetchPendingCommunities = async () => {
    try {
      setIsLoading(true);
      
      // First fetch the communities
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('*')
        .eq('approval_status', 'PENDING')
        .order('created_at', { ascending: false });
        
      if (communitiesError) throw communitiesError;
      
      if (!communitiesData || communitiesData.length === 0) {
        setCommunities([]);
        setIsLoading(false);
        return;
      }
      
      // Now fetch profiles for these communities
      const ownerIds = communitiesData.map(c => c.owner_id);
      const { data: ownersData, error: ownersError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', ownerIds);
        
      if (ownersError) throw ownersError;
      
      // Create a profiles map for easy lookup
      const ownersMap = new Map();
      if (ownersData) {
        ownersData.forEach(owner => {
          ownersMap.set(owner.id, owner);
        });
      }
      
      // Combine all data
      const enhancedCommunities = communitiesData.map(community => {
        return {
          ...community,
          owner: ownersMap.get(community.owner_id) || { name: 'Unknown' }
        };
      });
      
      setCommunities(enhancedCommunities);
    } catch (error: any) {
      toast.error(`Error loading communities: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTelegramBot = async (community: any) => {
    if (community.platform !== 'TELEGRAM' || !community.platform_id) {
      toast.error("This community doesn't have a valid Telegram ID");
      return false;
    }

    setCheckingBot(community.id);
    
    try {
      // Get the bot token
      const { data: settings, error: settingsError } = await supabase
        .from('platform_settings')
        .select('telegram_bot_token')
        .limit(1)
        .single();
        
      if (settingsError) throw settingsError;
      
      if (!settings.telegram_bot_token) {
        toast.error("Telegram bot token not configured");
        return false;
      }
      
      // Check if the bot is in the group
      const { data, error } = await supabase.functions.invoke("telegram-check-bot", {
        body: { 
          token: settings.telegram_bot_token,
          chat_id: community.platform_id
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success("Bot is successfully added to the group");
        return true;
      } else {
        toast.error(data.message || "Bot is not in the group");
        return false;
      }
    } catch (error: any) {
      console.error("Error checking bot:", error);
      toast.error(`Failed to check bot status: ${error.message}`);
      return false;
    } finally {
      setCheckingBot(null);
    }
  };

  const handleApproval = async (communityId: string, approved: boolean) => {
    const community = communities.find(c => c.id === communityId);
    
    if (approved && community.platform === 'TELEGRAM') {
      const botAdded = await checkTelegramBot(community);
      if (!botAdded) {
        toast.error("Cannot approve community - bot is not added to the group");
        return;
      }
    }
    
    setIsProcessing(communityId);
    
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          approval_status: approved ? 'APPROVED' : 'REJECTED'
        })
        .eq('id', communityId);
        
      if (error) throw error;
      
      toast.success(`Community ${approved ? 'approved' : 'rejected'} successfully`);
      
      // Remove the processed community from the list
      setCommunities(prevCommunities => 
        prevCommunities.filter(c => c.id !== communityId)
      );
    } catch (error: any) {
      toast.error(`Error processing community: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'TELEGRAM':
        return <Send className="h-5 w-5 text-blue-400" />;
      case 'DISCORD':
        return <Hash className="h-5 w-5 text-indigo-400" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-5 w-5 text-green-400" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border/50 bg-crypto-darkgray/50 backdrop-blur-md glassmorphic-card">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-crypto-green" />
            <span className="text-gradient">Pending Communities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {communities.length === 0 ? (
            <div className="text-center py-8 glassmorphism rounded-lg">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending communities to review</p>
            </div>
          ) : (
            <div className="space-y-6">
              {communities.map((community) => (
                <div 
                  key={community.id} 
                  className="border border-border rounded-md p-4 bg-crypto-dark/50 glassmorphism hover:glow-blue transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row justify-between mb-2">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getPlatformIcon(community.platform)}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{community.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Registered by {community.owner?.name || 'Unknown'} on {new Date(community.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center">
                      <Badge variant="outline" className="ml-2">
                        {community.platform}
                      </Badge>
                      <Badge variant="outline" className="ml-2 bg-crypto-blue/10 text-crypto-blue">
                        ${community.price_per_announcement}
                      </Badge>
                    </div>
                  </div>
                  
                  {community.description && (
                    <div className="my-4 p-3 bg-crypto-darkgray/50 rounded-md backdrop-blur-sm">
                      <p className="text-sm">{community.description}</p>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-2">Reach:</span>
                        <span className="font-medium">{community.reach?.toLocaleString() || 'Unknown'} members</span>
                      </div>
                      {community.platform_id && (
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground mr-2">Platform ID:</span>
                          <span className="font-medium">{community.platform_id}</span>
                        </div>
                      )}
                      {community.wallet_address && (
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground mr-2">Wallet:</span>
                          <span className="font-medium truncate max-w-[200px]">{community.wallet_address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex flex-wrap gap-2 justify-end">
                    {community.platform === 'TELEGRAM' && (
                      <Button
                        variant="outline"
                        onClick={() => checkTelegramBot(community)}
                        disabled={checkingBot === community.id}
                        className="hover:bg-crypto-blue/10 hover:text-crypto-blue transition-colors"
                      >
                        {checkingBot === community.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <BotMessageSquare className="h-4 w-4 mr-2" />
                        )}
                        Check Bot Status
                      </Button>
                    )}
                    
                    <Button
                      variant="destructive"
                      onClick={() => handleApproval(community.id, false)}
                      disabled={isProcessing === community.id}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isProcessing === community.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproval(community.id, true)}
                      disabled={isProcessing === community.id}
                      className="bg-crypto-green hover:bg-crypto-green/90 animate-pulse-glow"
                    >
                      {isProcessing === community.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityApproval;
