
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Send, Users, Check, Loader2, AlertCircle, AlertTriangle, Bot, Filter, CheckCircle, Image, Link, PanelRight, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

type Community = {
  id: string;
  name: string;
  platform: 'TELEGRAM' | 'DISCORD' | 'WHATSAPP';
  platform_id: string;
  reach: number | null;
  price_per_announcement: number;
  approval_status: string;
  selected?: boolean;
  botStatus?: 'VERIFIED' | 'UNVERIFIED' | 'CHECKING';
};

type Button = {
  text: string;
  url: string;
};

type MediaItem = {
  type: 'image' | 'video';
  url: string;
  caption?: string;
};

const TelegramMessenger = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [botAvailable, setBotAvailable] = useState<boolean | null>(null);
  const [showOnlyVerified, setShowOnlyVerified] = useState(true);
  const [sendResults, setSendResults] = useState<{
    success: string[];
    failed: { name: string; error: string }[];
  } | null>(null);
  
  // New state for enhanced message features
  const [buttons, setButtons] = useState<Button[]>([]);
  const [newButton, setNewButton] = useState<Button>({ text: '', url: '' });
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [newMedia, setNewMedia] = useState<MediaItem>({ type: 'image', url: '', caption: '' });
  const [activeTab, setActiveTab] = useState('text');
  
  useEffect(() => {
    checkBotConfiguration();
    fetchCommunities();
  }, []);
  
  const checkBotConfiguration = async () => {
    try {
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('telegram_bot_token, telegram_bot_username')
        .maybeSingle();
      
      setBotAvailable(Boolean(settings?.telegram_bot_token));
    } catch (error) {
      console.error('Error checking bot configuration:', error);
      setBotAvailable(false);
    }
  };
  
  const fetchCommunities = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name, platform, platform_id, reach, price_per_announcement, approval_status')
        .eq('platform', 'TELEGRAM')
        .eq('approval_status', 'APPROVED') // Only show approved communities
        .order('name');
        
      if (error) throw error;
      
      // Add selected property to each community
      const communitiesWithSelection = (data || []).map(community => ({
        ...community,
        selected: false,
        botStatus: 'UNVERIFIED' as 'VERIFIED' | 'UNVERIFIED' | 'CHECKING'
      }));
      
      setCommunities(communitiesWithSelection);
      
      // Verify bot status for each community in the background
      for (const community of communitiesWithSelection) {
        verifyBotStatus(community.id);
      }
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
      communities.map(community => {
        // Only select communities where the bot is verified
        if (showOnlyVerified && community.botStatus !== 'VERIFIED') {
          return community;
        }
        return { ...community, selected: true };
      })
    );
  };
  
  const deselectAll = () => {
    setCommunities(
      communities.map(community => ({ ...community, selected: false }))
    );
  };
  
  const verifyBotStatus = async (communityId: string) => {
    try {
      // Mark as checking
      setCommunities(prev => 
        prev.map(c => 
          c.id === communityId 
            ? { ...c, botStatus: 'CHECKING' } 
            : c
        )
      );
      
      const { data, error } = await supabase.functions.invoke('telegram-check-bot', {
        body: { communityId }
      });
      
      if (error) throw error;
      
      const isVerified = data.success && data.status !== 'left' && data.status !== 'kicked';
      
      // Update the community's bot status
      setCommunities(prev => 
        prev.map(c => 
          c.id === communityId 
            ? { ...c, botStatus: isVerified ? 'VERIFIED' : 'UNVERIFIED' } 
            : c
        )
      );
      
      return isVerified;
    } catch (error: any) {
      console.error('Error verifying bot status:', error);
      
      // Mark as unverified on error
      setCommunities(prev => 
        prev.map(c => 
          c.id === communityId 
            ? { ...c, botStatus: 'UNVERIFIED' } 
            : c
        )
      );
      
      return false;
    }
  };
  
  // Button management
  const addButton = () => {
    if (!newButton.text || !newButton.url) {
      toast.error('Button text and URL are required');
      return;
    }
    
    // Validate URL
    try {
      new URL(newButton.url);
    } catch (e) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    setButtons([...buttons, newButton]);
    setNewButton({ text: '', url: '' });
  };
  
  const removeButton = (index: number) => {
    const updatedButtons = [...buttons];
    updatedButtons.splice(index, 1);
    setButtons(updatedButtons);
  };
  
  // Media management
  const addMedia = () => {
    if (!newMedia.url) {
      toast.error('Media URL is required');
      return;
    }
    
    // Validate URL
    try {
      new URL(newMedia.url);
    } catch (e) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    setMedia([...media, newMedia]);
    setNewMedia({ type: 'image', url: '', caption: '' });
  };
  
  const removeMedia = (index: number) => {
    const updatedMedia = [...media];
    updatedMedia.splice(index, 1);
    setMedia(updatedMedia);
  };
  
  const sendMessage = async () => {
    const selectedCommunities = communities.filter(community => community.selected);
    
    if (selectedCommunities.length === 0) {
      toast.error('Please select at least one community');
      return;
    }
    
    if (!message.trim() && media.length === 0) {
      toast.error('Please enter a message or add media to send');
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
          // First verify bot is in the community
          const botStatus = await verifyBotStatus(community.id);
          
          if (!botStatus) {
            failedSends.push({ 
              name: community.name, 
              error: 'Bot not added to this community' 
            });
            continue;
          }
          
          if (!community.platform_id) {
            failedSends.push({ 
              name: community.name, 
              error: 'Missing platform ID' 
            });
            continue;
          }
          
          let result;
          
          // Send message based on content type
          if (media.length > 0) {
            // Handle media messages
            const firstMedia = media[0];
            const inlineKeyboard = buttons.length > 0 ? {
              inline_keyboard: [buttons.map(btn => ({ text: btn.text, url: btn.url }))]
            } : undefined;
            
            const endpoint = firstMedia.type === 'image' ? 
              `sendPhoto` : 
              `sendVideo`;
            
            const response = await fetch(
              `https://api.telegram.org/bot${botToken}/${endpoint}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_id: community.platform_id,
                  [firstMedia.type === 'image' ? 'photo' : 'video']: firstMedia.url,
                  caption: message || firstMedia.caption || '',
                  parse_mode: 'HTML',
                  reply_markup: inlineKeyboard
                }),
              }
            );
            
            result = await response.json();
            
            // If there are more media items, send as a media group
            if (media.length > 1) {
              const mediaItems = media.map(item => ({
                type: item.type === 'image' ? 'photo' : 'video',
                media: item.url,
                caption: item.caption || ''
              }));
              
              const mediaResponse = await fetch(
                `https://api.telegram.org/bot${botToken}/sendMediaGroup`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    chat_id: community.platform_id,
                    media: mediaItems
                  }),
                }
              );
              
              const mediaResult = await mediaResponse.json();
              if (!mediaResult.ok) {
                console.warn('Additional media may not have been sent:', mediaResult.description);
              }
            }
          } else {
            // Handle text-only messages with buttons
            const inlineKeyboard = buttons.length > 0 ? {
              inline_keyboard: [buttons.map(btn => ({ text: btn.text, url: btn.url }))]
            } : undefined;
            
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
                  reply_markup: inlineKeyboard
                }),
              }
            );
            
            result = await response.json();
          }
          
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
  
  const clearMessageContents = () => {
    if (window.confirm("Are you sure you want to clear all message content?")) {
      setMessage('');
      setButtons([]);
      setMedia([]);
    }
  };
  
  const filteredCommunities = communities.filter(community => 
    !showOnlyVerified || community.botStatus === 'VERIFIED'
  );
  
  if (botAvailable === false) {
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
        <CardContent>
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDescription className="ml-2">
              Please configure a Telegram bot in Platform Settings before using this feature
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
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
        {/* Message composition area */}
        <div className="space-y-3">
          <Label>Message Composition</Label>
          <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="text" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" /> Text
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center">
                <Image className="h-4 w-4 mr-1" /> Media
              </TabsTrigger>
              <TabsTrigger value="buttons" className="flex items-center">
                <PanelRight className="h-4 w-4 mr-1" /> Buttons
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-2">
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
            </TabsContent>
            
            <TabsContent value="media" className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="mediaType">Type</Label>
                    <select
                      id="mediaType"
                      value={newMedia.type}
                      onChange={(e) => setNewMedia({...newMedia, type: e.target.value as 'image' | 'video'})}
                      className="w-full rounded-md border border-border/50 bg-crypto-dark p-2"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="mediaUrl">URL</Label>
                    <Input 
                      id="mediaUrl"
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={newMedia.url}
                      onChange={(e) => setNewMedia({...newMedia, url: e.target.value})}
                      className="bg-crypto-dark"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="mediaCaption">Caption (Optional)</Label>
                  <Input 
                    id="mediaCaption"
                    type="text"
                    placeholder="Image caption"
                    value={newMedia.caption || ''}
                    onChange={(e) => setNewMedia({...newMedia, caption: e.target.value})}
                    className="bg-crypto-dark"
                  />
                </div>
                <Button 
                  onClick={addMedia}
                  variant="outline"
                  size="sm"
                  className="mt-1"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Media
                </Button>
              </div>
              
              <Separator />
              
              {media.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium">Added Media ({media.length})</h4>
                  <div className="space-y-2">
                    {media.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-crypto-dark/50 border border-border/30 rounded"
                      >
                        <div className="flex items-center">
                          {item.type === 'image' ? 
                            <Image className="h-4 w-4 mr-2" /> : 
                            <Video className="h-4 w-4 mr-2" />
                          }
                          <div>
                            <p className="text-sm truncate w-64">{item.url}</p>
                            {item.caption && (
                              <p className="text-xs text-muted-foreground">Caption: {item.caption}</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeMedia(index)}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No media added yet</p>
              )}
            </TabsContent>
            
            <TabsContent value="buttons" className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input 
                      id="buttonText"
                      type="text"
                      placeholder="Click here"
                      value={newButton.text}
                      onChange={(e) => setNewButton({...newButton, text: e.target.value})}
                      className="bg-crypto-dark"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buttonUrl">URL</Label>
                    <Input 
                      id="buttonUrl"
                      type="text"
                      placeholder="https://example.com"
                      value={newButton.url}
                      onChange={(e) => setNewButton({...newButton, url: e.target.value})}
                      className="bg-crypto-dark"
                    />
                  </div>
                </div>
                <Button 
                  onClick={addButton}
                  variant="outline"
                  size="sm"
                  className="mt-1"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Button
                </Button>
              </div>
              
              <Separator />
              
              {buttons.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium">Added Buttons ({buttons.length})</h4>
                  <div className="space-y-2">
                    {buttons.map((button, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-crypto-dark/50 border border-border/30 rounded"
                      >
                        <div className="flex items-center">
                          <Link className="h-4 w-4 mr-2" />
                          <div>
                            <p className="text-sm font-medium">{button.text}</p>
                            <p className="text-xs text-muted-foreground truncate w-64">{button.url}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeButton(index)}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No buttons added yet</p>
              )}
            </TabsContent>
          </Tabs>
          
          {(message.trim() || buttons.length > 0 || media.length > 0) && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearMessageContents}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Clear All
              </Button>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Select Communities
            </Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="verified-only"
                  checked={showOnlyVerified}
                  onCheckedChange={setShowOnlyVerified}
                />
                <Label htmlFor="verified-only" className="text-sm cursor-pointer">
                  Show only bot-verified communities
                </Label>
              </div>
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
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {communities.length === 0 
                ? "No Telegram communities available." 
                : "No bot-verified communities available. Try turning off the filter."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
              {filteredCommunities.map((community) => (
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
                    <div className="font-medium flex items-center">
                      {community.name}
                      {community.botStatus === 'VERIFIED' && (
                        <CheckCircle className="h-3 w-3 text-green-500 ml-1" />
                      )}
                      {community.botStatus === 'CHECKING' && (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      {community.reach ? `${community.reach} members` : 'Unknown members'}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                            <Bot className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2">
                          <div className="text-xs">
                            <p className="font-medium">Platform ID:</p>
                            <code className="bg-crypto-dark p-1 rounded block mt-1 overflow-x-auto">
                              {community.platform_id || "Not set"}
                            </code>
                            <p className="font-medium mt-2">Bot Status:</p>
                            <span className={`${
                              community.botStatus === 'VERIFIED' 
                                ? 'text-green-500' 
                                : community.botStatus === 'CHECKING' 
                                  ? 'text-yellow-500' 
                                  : 'text-red-500'
                            }`}>
                              {community.botStatus}
                            </span>
                          </div>
                        </PopoverContent>
                      </Popover>
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
          disabled={isLoading || isSending || communities.filter(c => c.selected).length === 0 || 
            (!message.trim() && media.length === 0)}
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
