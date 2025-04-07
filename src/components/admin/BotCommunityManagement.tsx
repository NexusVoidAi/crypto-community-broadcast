
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, Users, Copy, CheckCircle, AlertTriangle, ExternalLink, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type CommunityBotStatus = {
  id: string;
  name: string;
  platform_id: string;
  reach: number | null;
  botAdded: boolean;
  isAdmin: boolean;
  inviteLink?: string | null;
  memberCount?: number | null;
  status?: string;
  lastChecked: Date;
};

const BotCommunityManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [communities, setCommunities] = useState<CommunityBotStatus[]>([]);
  const [checkingCommunity, setCheckingCommunity] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [hasBot, setHasBot] = useState(false);

  const fetchBotInfo = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('platform_settings')
        .select('telegram_bot_token, telegram_bot_username')
        .single();
        
      if (error) throw error;
      
      setHasBot(Boolean(settings?.telegram_bot_token));
      
      if (settings?.telegram_bot_username) {
        setInviteLink(`https://t.me/${settings.telegram_bot_username}?startgroup=true`);
      }
      
      return settings;
    } catch (error: any) {
      console.error("Error fetching bot info:", error);
      toast.error("Failed to fetch bot information");
      return null;
    }
  };

  const fetchCommunities = async () => {
    try {
      setIsLoading(true);
      const botSettings = await fetchBotInfo();
      
      if (!botSettings?.telegram_bot_token) {
        setIsLoading(false);
        return;
      }
      
      const { data: communitiesData, error } = await supabase
        .from('communities')
        .select('*')
        .eq('platform', 'TELEGRAM');
        
      if (error) throw error;
      
      if (communitiesData) {
        const initialCommunities = communitiesData.map(community => ({
          id: community.id,
          name: community.name,
          platform_id: community.platform_id,
          reach: community.reach,
          botAdded: false,
          isAdmin: false,
          lastChecked: new Date()
        }));
        
        setCommunities(initialCommunities);
        
        // Check bot status for each community
        for (const community of initialCommunities) {
          if (community.platform_id) {
            await checkBotStatus(community.id);
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching communities:", error);
      toast.error(`Failed to fetch communities: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkBotStatus = async (communityId: string) => {
    try {
      setCheckingCommunity(communityId);
      
      const { data, error } = await supabase.functions.invoke('telegram-check-bot', {
        body: { communityId }
      });
      
      if (error) throw error;
      
      setCommunities(prev => prev.map(community => 
        community.id === communityId ? {
          ...community,
          botAdded: data.botAdded,
          isAdmin: data.isAdmin,
          status: data.status,
          inviteLink: data.inviteLink,
          memberCount: data.memberCount,
          lastChecked: new Date()
        } : community
      ));
      
      // Update member count in database if we got it
      if (data.botAdded && data.memberCount) {
        await supabase
          .from('communities')
          .update({ reach: data.memberCount })
          .eq('id', communityId);
      }
      
      return data;
    } catch (error: any) {
      console.error(`Error checking bot status for community ${communityId}:`, error);
      toast.error(`Failed to check bot status: ${error.message}`);
      return null;
    } finally {
      setCheckingCommunity(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard"))
      .catch(err => toast.error("Failed to copy: " + err.message));
  };

  const registerBotCommands = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('register-bot-commands', {});
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully registered ${data.registeredCommands} bot commands`);
      } else {
        toast.error("Failed to register bot commands");
      }
    } catch (error: any) {
      console.error("Error registering bot commands:", error);
      toast.error(`Failed to register commands: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasBot) {
    return (
      <Card className="border border-border/50 bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>Telegram Bot Management</CardTitle>
          <CardDescription>
            Configure your Telegram bot first to use these features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-amber-950/30 border border-amber-700/50 p-4 text-amber-500">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>You need to configure a Telegram bot first in the Platform Settings tab.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border/50 bg-crypto-darkgray/50">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Telegram Bot Communities</CardTitle>
              <CardDescription>
                View and manage communities where your bot is present
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchCommunities}
              >
                <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={registerBotCommands}
                className="bg-crypto-blue hover:bg-crypto-blue/80"
              >
                <Bot className="h-4 w-4 mr-2" />
                Register Commands
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium">Global Bot Invite Link</h3>
            </div>
            <div className="flex items-center gap-2 p-2 bg-crypto-dark rounded border border-border/50">
              <input
                type="text"
                value={inviteLink || "No invite link available"}
                readOnly
                className="flex-1 bg-transparent focus:outline-none text-sm"
              />
              {inviteLink && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(inviteLink)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => window.open(inviteLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Share this link with community admins to add your bot to their Telegram groups
            </p>
          </div>
          
          <Separator className="my-4" />
          
          <div className="rounded-md border border-border">
            <ScrollArea className="h-[400px] w-full rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-crypto-darkgray">
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead>Chat ID</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Bot Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        No Telegram communities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    communities.map((community) => (
                      <TableRow key={community.id}>
                        <TableCell className="font-medium">{community.name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {community.platform_id || "Not set"}
                        </TableCell>
                        <TableCell>
                          {community.memberCount || community.reach || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {checkingCommunity === community.id ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Checking...</span>
                            </div>
                          ) : community.botAdded ? (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className={community.isAdmin ? 
                                "border-green-500 text-green-500 bg-green-900/20" : 
                                "border-amber-500 text-amber-500 bg-amber-900/20"
                              }>
                                {community.isAdmin ? "Admin" : "Member"}
                              </Badge>
                              {community.isAdmin ? (
                                <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500 ml-1" />
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-500 bg-red-900/20">
                              Not added
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => checkBotStatus(community.id)}
                              disabled={checkingCommunity === community.id}
                            >
                              {checkingCommunity === community.id && (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              )}
                              Check
                            </Button>
                            
                            {!community.botAdded && community.inviteLink && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button size="sm" variant="outline" className="bg-crypto-blue/20 hover:bg-crypto-blue/30 text-crypto-blue">
                                    Invite Link
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Bot Invite Link</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Share this link with the community admin to add your bot:
                                    </p>
                                    <div className="flex items-center space-x-2 rounded border p-2">
                                      <input
                                        className="flex-1 bg-transparent text-xs"
                                        value={community.inviteLink}
                                        readOnly
                                      />
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(community.inviteLink || "")}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            
                            {community.botAdded && !community.isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-amber-900/20 hover:bg-amber-900/30 text-amber-500 border-amber-500/30"
                                onClick={() => {
                                  if (community.inviteLink) {
                                    copyToClipboard(community.inviteLink);
                                    toast.info("Copied invite link. Ask the group admin to make the bot an administrator.");
                                  }
                                }}
                              >
                                Need Admin Rights
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-border/50 bg-crypto-darkgray/50">
        <CardHeader>
          <CardTitle>Community Analytics</CardTitle>
          <CardDescription>
            View analytics and insights for your Telegram communities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communities.filter(c => c.botAdded && c.isAdmin).length > 0 ? (
              communities
                .filter(c => c.botAdded && c.isAdmin)
                .map(community => (
                  <Card key={community.id} className="bg-crypto-dark/40 border-border/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{community.name}</CardTitle>
                      <CardDescription>{community.memberCount || community.reach || 0} members</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Engagement Rate</span>
                          <span>35%</span>
                        </div>
                        <Progress value={35} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Active Members</span>
                          <span>{Math.floor((community.memberCount || community.reach || 0) * 0.28)}</span>
                        </div>
                        <Progress value={28} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Message Frequency</span>
                          <span>Medium</span>
                        </div>
                        <Progress value={50} className="h-2" />
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-xs"
                          onClick={() => {
                            supabase.functions.invoke('telegram-analytics', { 
                              body: { communityId: community.id } 
                            })
                            .then(({ data }) => {
                              if (data?.success) {
                                toast.success("Analytics report requested");
                              } else {
                                toast.error("Failed to request analytics");
                              }
                            })
                            .catch(error => {
                              console.error("Error requesting analytics:", error);
                              toast.error("Failed to request analytics");
                            });
                          }}
                        >
                          <BarChart3 className="h-3.5 w-3.5 mr-1" />
                          Request Detailed Analytics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No communities with admin access to analyze</p>
                <p className="text-sm mt-1">Add the bot to communities and grant it admin rights to see analytics</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BotCommunityManagement;
