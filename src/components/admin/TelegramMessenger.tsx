
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Send, Users, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Community = {
  id: string;
  name: string;
  platform: 'TELEGRAM' | 'DISCORD' | 'WHATSAPP';
  platform_id: string;
  reach: number | null;
  price_per_announcement: number;
  selected?: boolean;
};

const TelegramMessenger = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<{
    success: string[];
    failed: { name: string; error: string }[];
  } | null>(null);
  
  useEffect(() => {
    fetchCommunities();
  }, []);
  
  const fetchCommunities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, platform, platform_id, reach, price_per_announcement')
        .eq('platform', 'TELEGRAM')
        .order('name');
        
      if (error) throw error;
      
      // Add selected property to each community
      const communitiesWithSelection = (data || []).map(community => ({
        ...community,
        selected: false
      }));
      
      setCommunities(communitiesWithSelection);
    } catch (error: any) {
      console.error('Error fetching communities:', error);
      toast.error(`Failed to load communities: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleCommunity = (id: string) => {
    setCommunities(
      communities.map(community => 
        community.id === id 
          ? { ...community, selected: !community.selected } 
          : community
      )
    );
  };
  
  const selectAll = () => {
    setCommunities(
      communities.map(community => ({ ...community, selected: true }))
    );
  };
  
  const deselectAll = () => {
    setCommunities(
      communities.map(community => ({ ...community, selected: false }))
    );
  };
  
  const sendMessage = async () => {
    const selectedCommunities = communities.filter(community => community.selected);
    
    if (selectedCommunities.length === 0) {
      toast.error('Please select at least one community');
      return;
    }
    
    if (!message.trim()) {
      toast.error('Please enter a message to send');
      return;
    }
    
    setIsSending(true);
    setSendResults(null);
    
    const successfulSends: string[] = [];
    const failedSends: { name: string; error: string }[] = [];
    
    // Get token from platform settings
    try {
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('telegram_bot_token')
        .maybeSingle();
      
      if (!settings || !settings.telegram_bot_token) {
        toast.error('Telegram bot token not configured in platform settings');
        setIsSending(false);
        return;
      }
      
      const botToken = settings.telegram_bot_token;
      
      // Send to each selected community
      for (const community of selectedCommunities) {
        try {
          if (!community.platform_id) {
            failedSends.push({ 
              name: community.name, 
              error: 'Missing platform ID' 
            });
            continue;
          }
          
          const response = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: community.platform_id,
                text: message,
                parse_mode: 'HTML',
              }),
            }
          );
          
          const result = await response.json();
          
          if (result.ok) {
            successfulSends.push(community.name);
          } else {
            failedSends.push({ 
              name: community.name, 
              error: result.description || 'Unknown error' 
            });
          }
        } catch (error: any) {
          failedSends.push({ 
            name: community.name, 
            error: error.message || 'Network error' 
          });
        }
      }
      
      setSendResults({
        success: successfulSends,
        failed: failedSends,
      });
      
      if (failedSends.length === 0) {
        toast.success(`Message sent to ${successfulSends.length} communities`);
      } else {
        toast.error(`Failed to send message to ${failedSends.length} communities`);
      }
    } catch (error: any) {
      console.error('Error sending messages:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Card className="border border-border/50 bg-crypto-darkgray/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Send className="mr-2 h-5 w-5" /> Telegram Messenger
        </CardTitle>
        <CardDescription>
          Send messages to ACHO AI Telegram communities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message to send to selected communities..."
            className="min-h-[120px] bg-crypto-dark border-border/50"
          />
          <p className="text-xs text-muted-foreground">
            You can use HTML formatting tags like &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, etc.
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Select Communities
            </Label>
            <div className="space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={selectAll}
                disabled={isLoading}
              >
                Select All
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={deselectAll}
                disabled={isLoading}
              >
                Deselect All
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No Telegram communities available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {communities.map((community) => (
                <div
                  key={community.id}
                  className="flex items-center space-x-2 border border-border/30 rounded-md p-2 hover:bg-crypto-dark/50"
                >
                  <Checkbox
                    id={`community-${community.id}`}
                    checked={community.selected}
                    onCheckedChange={() => toggleCommunity(community.id)}
                  />
                  <Label
                    htmlFor={`community-${community.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="font-medium">{community.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {community.reach ? `${community.reach} members` : 'Unknown members'}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {sendResults && (
          <div className="space-y-3">
            {sendResults.success.length > 0 && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <AlertDescription className="text-green-400">
                  Successfully sent to: {sendResults.success.join(', ')}
                </AlertDescription>
              </Alert>
            )}
            
            {sendResults.failed.length > 0 && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <AlertDescription className="text-red-400">
                  <p className="font-medium">Failed to send to:</p>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    {sendResults.failed.map((fail, index) => (
                      <li key={index}>
                        {fail.name}: {fail.error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={sendMessage}
          disabled={isLoading || isSending || communities.filter(c => c.selected).length === 0 || !message.trim()}
          className="bg-crypto-blue hover:bg-crypto-blue/90"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TelegramMessenger;
