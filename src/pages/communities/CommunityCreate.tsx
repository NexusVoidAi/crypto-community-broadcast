import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { MessagesSquare, Send, Users, AlertTriangle, Bot, Check, ExternalLink, Globe, Plus, X } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const REGIONS = [
  { value: 'global', label: 'Global' },
  { value: 'north-america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'africa', label: 'Africa' },
  { value: 'south-america', label: 'South America' },
  { value: 'australia', label: 'Australia/Oceania' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'other', label: 'Other' },
];

const FOCUS_AREAS = [
  { value: 'defi', label: 'DeFi' },
  { value: 'nft', label: 'NFTs' },
  { value: 'web3', label: 'Web3' },
  { value: 'ai', label: 'AI' },
  { value: 'gaming', label: 'Gaming/GameFi' },
  { value: 'dao', label: 'DAOs' },
  { value: 'education', label: 'Education' },
  { value: 'trading', label: 'Trading' },
  { value: 'metaverse', label: 'Metaverse' },
  { value: 'social', label: 'Social Media' },
  { value: 'payments', label: 'Payments' },
  { value: 'other', label: 'Other' },
];

const CommunityCreate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<'TELEGRAM' | 'DISCORD' | 'WHATSAPP'>('TELEGRAM');
  const [platformId, setPlatformId] = useState('');
  const [reach, setReach] = useState('');
  const [price, setPrice] = useState('25');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Convert region to an array for multi-select
  const [regions, setRegions] = useState<string[]>(['global']);
  const [customRegion, setCustomRegion] = useState('');
  const [showCustomRegionInput, setShowCustomRegionInput] = useState(false);

  // Convert focus areas to array (already was array)
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [customFocusArea, setCustomFocusArea] = useState('');
  const [showCustomFocusAreaInput, setShowCustomFocusAreaInput] = useState(false);
  
  const [verificationResult, setVerificationResult] = useState<{
    isValid?: boolean;
    botAdded?: boolean;
    isAdmin?: boolean;
    error?: string;
    botInfo?: {
      id: number;
      username: string;
      first_name: string;
    };
    memberCount?: number;
    chatInfo?: any;
  } | null>(null);

  const addCustomRegion = () => {
    if (customRegion.trim()) {
      const newRegionValue = customRegion.toLowerCase().replace(/\s+/g, '-');
      setRegions(prev => [...prev, newRegionValue]);
      setCustomRegion('');
      setShowCustomRegionInput(false);
    }
  };

  const removeRegion = (region: string) => {
    setRegions(prev => prev.filter(r => r !== region));
  };

  const addCustomFocusArea = () => {
    if (customFocusArea.trim()) {
      const newFocusAreaValue = customFocusArea.toLowerCase().replace(/\s+/g, '-');
      setFocusAreas(prev => [...prev, newFocusAreaValue]);
      setCustomFocusArea('');
      setShowCustomFocusAreaInput(false);
    }
  };

  const removeFocusArea = (area: string) => {
    setFocusAreas(prev => prev.filter(a => a !== area));
  };

  const toggleFocusArea = (value: string) => {
    if (value === 'other') {
      setShowCustomFocusAreaInput(true);
      return;
    }
    
    setFocusAreas(current =>
      current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value]
    );
  };

  const handleTelegramVerification = async () => {
    if (!platformId) {
      toast.error('Please enter a Telegram group ID or username');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // First check if platform settings are configured
      const { data: settingsData, error: settingsError } = await supabase
        .from('platform_settings')
        .select('telegram_bot_token')
        .single();
      
      if (settingsError) {
        console.error("Error fetching settings:", settingsError);
        if (settingsError.code === 'PGRST116') {
          throw new Error("Platform settings not configured. Please contact an administrator.");
        }
        throw settingsError;
      }
      
      if (!settingsData?.telegram_bot_token) {
        throw new Error("Telegram bot is not configured. Please contact an administrator.");
      }

      // First, let's save a draft community to get an ID
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .insert({
          name,
          description,
          platform: 'TELEGRAM',
          platform_id: platformId,
          reach: parseInt(reach) || 0,
          price_per_announcement: parseFloat(price) || 25.00,
          owner_id: user?.id,
          approval_status: 'DRAFT',
          region: regions,
          focus_areas: focusAreas
        })
        .select()
        .single();

      if (communityError) throw communityError;

      if (!communityData?.id) {
        throw new Error('Failed to create temporary community record');
      }

      console.log("Created draft community:", communityData.id);

      // Now check if bot is added to the group
      const response = await supabase.functions.invoke('telegram-check-bot', {
        body: { communityId: communityData.id },
      });
      
      console.log("Verification response:", response);
      
      if (response.error) {
        throw new Error(`Verification failed: ${response.error.message || 'Unknown error'}`);
      }
      
      const data = response.data;

      if (data.botAdded) {
        // Update member count if available
        if (data.memberCount) {
          setReach(data.memberCount.toString());
        }
        
        setVerificationResult({
          isValid: true,
          botAdded: true,
          isAdmin: data.isAdmin,
          botInfo: data.botInfo,
          memberCount: data.memberCount,
          chatInfo: data.chatInfo
        });
        
        if (data.isAdmin) {
          if (data.memberCount) {
            toast.success(`Verification successful! The bot is in the group with admin rights. Member count: ${data.memberCount}`);
          } else {
            toast.success('Verification successful! The bot is in the group with admin rights.');
          }
        } else {
          toast.warning('Bot is in the group, but needs admin rights for all features.');
        }
      } else {
        setVerificationResult({
          isValid: false,
          botAdded: false,
          error: data.error,
        });
        toast.error(`Bot is not in the group: ${data.error}`);
      }

      // If it was just a verification (not a final submission), clean up the draft
      if (communityData.approval_status === 'DRAFT') {
        await supabase
          .from('communities')
          .delete()
          .eq('id', communityData.id);
      }
    } catch (error: any) {
      console.error('Telegram verification error:', error);
      setVerificationResult({
        isValid: false,
        error: error.message,
      });
      toast.error(`Verification failed: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };
  
  const validateForm = () => {
    if (!name) {
      toast.error('Community name is required');
      return false;
    }
    
    if (!platform) {
      toast.error('Platform selection is required');
      return false;
    }
    
    if (!platformId) {
      toast.error('Platform ID or URL is required');
      return false;
    }
    
    if (platform === 'TELEGRAM' && !verificationResult?.botAdded) {
      toast.error('Please verify that the bot is added to your Telegram group before creating the community');
      return false;
    }

    if (regions.length === 0) {
      toast.error('Please select at least one region for your community');
      return false;
    }
    
    if (focusAreas.length === 0) {
      toast.error('Please select at least one focus area for your community');
      return false;
    }
    
    return true;
  };

  const getBotInstructions = () => {
    return (
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-md">
        <div className="flex items-start mb-2">
          <Bot className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
          <h4 className="text-sm font-medium text-blue-400">How to add our bot to your Telegram group:</h4>
        </div>
        <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground">
          <li>Go to your Telegram group</li>
          <li>Click on the group name to open the info panel</li>
          <li>Select "Add members"</li>
          <li>Search for the ACHO AI bot {verificationResult?.botInfo?.username && <span className="font-medium">@{verificationResult.botInfo.username}</span>}</li>
          <li>Add the bot to your group</li>
          <li>Make the bot an administrator of the group (required for posting announcements)</li>
          <li>Click "Verify" below to confirm the bot has been added successfully</li>
        </ol>
        
        {verificationResult?.botInfo && (
          <div className="mt-3 border-t border-blue-400/30 pt-3 flex flex-col gap-1">
            <p className="text-sm text-blue-400 font-medium">Bot Information:</p>
            <p className="text-xs text-muted-foreground">Username: @{verificationResult.botInfo.username}</p>
            <p className="text-xs text-muted-foreground">Name: {verificationResult.botInfo.first_name}</p>
          </div>
        )}

        {verificationResult?.memberCount && (
          <div className="mt-2">
            <p className="text-sm text-green-400">
              <Users className="h-4 w-4 inline mr-1" />
              Detected {verificationResult.memberCount} members in this community
            </p>
          </div>
        )}

        {verificationResult?.botAdded && !verificationResult.isAdmin && (
          <Alert className="mt-3 bg-orange-500/10 border-orange-500/30">
            <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
            <AlertDescription className="text-orange-400 text-xs">
              Please make the bot an administrator of your group for full functionality.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the auto-detected member count if available
      const finalReach = verificationResult?.memberCount || parseInt(reach) || 0;
      
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name,
          description,
          platform,
          platform_id: platformId,
          reach: finalReach,
          price_per_announcement: parseFloat(price) || 25.00,
          owner_id: user?.id,
          region: regions,
          focus_areas: focusAreas
        })
        .select();
        
      if (error) throw error;
      
      toast.success('Community created successfully!');
      navigate('/communities');
    } catch (error: any) {
      toast.error(`Error creating community: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const extractUsernameFromUrl = (url: string) => {
    if (url.includes('t.me/')) {
      // Extract username from URL
      const match = url.match(/t\.me\/([^/]+)/);
      if (match && match[1]) {
        return '@' + match[1];
      }
    }
    return url;
  };

  const handlePlatformIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPlatformId(value);
    
    // Reset verification when changing the platform ID
    setVerificationResult(null);
  };

  // Function to get label from value
  const getRegionLabel = (value: string) => {
    const region = REGIONS.find(r => r.value === value);
    return region ? region.label : value;
  };

  const getFocusAreaLabel = (value: string) => {
    const area = FOCUS_AREAS.find(a => a.value === value);
    return area ? area.label : value;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Create a Community</h1>
        
        <Card className="border border-border/50 bg-crypto-darkgray/50">
          <CardHeader>
            <CardTitle>Community Details</CardTitle>
            <CardDescription>
              Add your community to start receiving announcement requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Community Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Crypto Traders Group"
                  className="bg-crypto-dark border-border/50"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your community"
                  className="bg-crypto-dark border-border/50 min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center">
                  Platform <span className="text-red-500 ml-1">*</span>
                </Label>
                <RadioGroup
                  value={platform}
                  onValueChange={(value) => {
                    setPlatform(value as 'TELEGRAM' | 'DISCORD' | 'WHATSAPP');
                    // Clear verification result when platform changes
                    setVerificationResult(null);
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 border border-border rounded-md px-4 py-3">
                    <RadioGroupItem value="TELEGRAM" id="telegram" />
                    <Label htmlFor="telegram" className="cursor-pointer flex items-center">
                      <Send className="mr-2 h-4 w-4 text-blue-400" />
                      Telegram
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border border-border rounded-md px-4 py-3">
                    <RadioGroupItem value="DISCORD" id="discord" />
                    <Label htmlFor="discord" className="cursor-pointer flex items-center">
                      <MessagesSquare className="mr-2 h-4 w-4 text-indigo-400" />
                      Discord
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border border-border rounded-md px-4 py-3">
                    <RadioGroupItem value="WHATSAPP" id="whatsapp" />
                    <Label htmlFor="whatsapp" className="cursor-pointer flex items-center">
                      <Send className="mr-2 h-4 w-4 text-green-400" />
                      WhatsApp
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platformId" className="flex items-center">
                  Channel/Group ID or URL <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="flex space-x-2 flex-col sm:flex-row gap-2 sm:gap-0">
                  <Input
                    id="platformId"
                    value={platformId}
                    onChange={handlePlatformIdChange}
                    placeholder={platform === 'TELEGRAM' ? "e.g., @crypto_traders, t.me/channel, or -1001234567890" : "e.g., https://discord.gg/..."}
                    className="bg-crypto-dark border-border/50"
                    required
                  />
                  {platform === 'TELEGRAM' && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleTelegramVerification}
                      disabled={isVerifying || !platformId}
                      className="whitespace-nowrap sm:w-auto w-full"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Bot className="h-4 w-4 mr-2" />
                          Verify Bot
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {platform === 'TELEGRAM' && "Enter your Telegram group username starting with @ or group ID"}
                  {platform === 'DISCORD' && "Enter your Discord channel invite link"}
                  {platform === 'WHATSAPP' && "Enter your WhatsApp group invite link"}
                </p>
              </div>
              
              {platform === 'TELEGRAM' && (
                <>
                  {getBotInstructions()}
                  
                  {verificationResult && (
                    <Alert 
                      variant={verificationResult.isValid ? "default" : "destructive"}
                      className={verificationResult.isValid ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}
                    >
                      {verificationResult.isValid ? (
                        <>
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          <AlertDescription className="text-green-400">
                            {verificationResult.isAdmin 
                              ? "Verification successful! The bot is in your group with admin rights."
                              : "The bot is in your group, but doesn't have admin rights. Please make the bot an admin for full functionality."}
                            {verificationResult.memberCount ? ` Group has ${verificationResult.memberCount} members.` : ''}
                          </AlertDescription>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          <AlertDescription className="text-red-400">
                            {verificationResult.error || "Bot verification failed. Please ensure the bot is added to your group."}
                          </AlertDescription>
                        </>
                      )}
                    </Alert>
                  )}
                </>
              )}
              
              {/* Multiple Regions Selection */}
              <div className="space-y-3">
                <Label htmlFor="region" className="flex items-center">
                  Community Regions <span className="text-red-500 ml-1">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(Select one or more)</span>
                </Label>
                
                <div className="flex flex-wrap gap-2">
                  {regions.map(region => (
                    <Badge 
                      key={region}
                      variant="secondary" 
                      className="px-3 py-1.5 bg-crypto-dark"
                    >
                      {getRegionLabel(region)}
                      <button 
                        type="button"
                        onClick={() => removeRegion(region)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2 items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" type="button" className="bg-crypto-dark border-border/50">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Region
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-crypto-dark border-border/50">
                      {REGIONS.map((region) => (
                        <DropdownMenuItem 
                          key={region.value}
                          className="cursor-pointer"
                          onClick={() => {
                            if (region.value === 'other') {
                              setShowCustomRegionInput(true);
                            } else if (!regions.includes(region.value)) {
                              setRegions(prev => [...prev, region.value]);
                            }
                          }}
                        >
                          <Globe className="mr-2 h-4 w-4 text-blue-400" />
                          {region.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {showCustomRegionInput && (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={customRegion}
                        onChange={(e) => setCustomRegion(e.target.value)}
                        placeholder="Enter custom region name"
                        className="bg-crypto-dark border-border/50 flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={addCustomRegion}
                        disabled={!customRegion.trim()}
                      >
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost"
                        onClick={() => setShowCustomRegionInput(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Multiple Focus Areas Selection */}
              <div className="space-y-3">
                <Label className="flex items-center">
                  Focus Areas <span className="text-red-500 ml-1">*</span> 
                  <span className="text-xs text-muted-foreground ml-2">(Select one or more)</span>
                </Label>
                
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map(area => (
                    <Badge 
                      key={area}
                      variant="secondary" 
                      className="px-3 py-1.5 bg-crypto-dark"
                    >
                      {getFocusAreaLabel(area)}
                      <button 
                        type="button"
                        onClick={() => removeFocusArea(area)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2 items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" type="button" className="bg-crypto-dark border-border/50">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Focus Area
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-crypto-dark border-border/50">
                      {FOCUS_AREAS.map((area) => (
                        <DropdownMenuItem 
                          key={area.value}
                          className="cursor-pointer"
                          onClick={() => {
                            if (area.value === 'other') {
                              setShowCustomFocusAreaInput(true);
                            } else if (!focusAreas.includes(area.value)) {
                              setFocusAreas(prev => [...prev, area.value]);
                            }
                          }}
                        >
                          {area.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {showCustomFocusAreaInput && (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={customFocusArea}
                        onChange={(e) => setCustomFocusArea(e.target.value)}
                        placeholder="Enter custom focus area"
                        className="bg-crypto-dark border-border/50 flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={addCustomFocusArea}
                        disabled={!customFocusArea.trim()}
                      >
                        Add
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost"
                        onClick={() => setShowCustomFocusAreaInput(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="reach">Community Size</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reach"
                      type="number"
                      value={verificationResult?.memberCount ? verificationResult.memberCount.toString() : reach}
                      onChange={(e) => setReach(e.target.value)}
                      placeholder="Number of members"
                      className="pl-10 bg-crypto-dark border-border/50"
                      readOnly={verificationResult?.memberCount !== undefined}
                    />
                  </div>
                  {verificationResult?.memberCount && (
                    <p className="text-xs text-green-400">Member count auto-detected from the group</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price per Announcement ($)</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-muted-foreground">$</div>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="25.00"
                      step="0.01"
                      min="0"
                      className="pl-10 bg-crypto-dark border-border/50"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 flex-col sm:flex-row gap-3 sm:gap-0">
                <Button
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/communities')}
                  className="sm:order-1 order-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90 sm:order-2 order-1"
                  disabled={isLoading || (platform === 'TELEGRAM' && !verificationResult?.botAdded)}
                >
                  {isLoading ? 'Creating...' : 'Create Community'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CommunityCreate;
