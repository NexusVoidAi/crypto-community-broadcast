
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { MessagesSquare, Send, Users, AlertTriangle, Bot, Check, ExternalLink, Globe, Plus, X, Upload, AtSign, Twitter } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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

type OnboardingStep = 'basic-info' | 'platform-setup' | 'preferences' | 'monetization';

const CommunityCreate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('basic-info');
  const [progress, setProgress] = useState<number>(25);
  
  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminTelegram, setAdminTelegram] = useState('');
  const [adminTwitter, setAdminTwitter] = useState('');
  const [hostMeetups, setHostMeetups] = useState(false);
  const [meetupCity, setMeetupCity] = useState('');
  const [audienceTypes, setAudienceTypes] = useState<string[]>([]);
  const [botInfo, setBotInfo] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  // Platform setup
  const [platform, setPlatform] = useState<'TELEGRAM' | 'DISCORD' | 'WHATSAPP'>('TELEGRAM');
  const [platformId, setPlatformId] = useState('');
  const [reach, setReach] = useState('');
  
  // Region and focus areas
  const [regions, setRegions] = useState<string[]>(['global']);
  const [customRegion, setCustomRegion] = useState('');
  const [showCustomRegionInput, setShowCustomRegionInput] = useState(false);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [customFocusArea, setCustomFocusArea] = useState('');
  const [showCustomFocusAreaInput, setShowCustomFocusAreaInput] = useState(false);
  
  // Preferences
  const [preferences, setPreferences] = useState({
    hackathons: false,
    bounties: false,
    hiring: false,
    irl_events: false,
    news_updates: false,
    thread_contests: false
  });
  
  // Monetization
  const [enableMonetization, setEnableMonetization] = useState(true);
  const [price, setPrice] = useState('25');
  
  // Verification states
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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

  const [platformSettings, setPlatformSettings] = useState<{
    telegram_bot_token?: string;
    telegram_bot_username?: string;
  } | null>(null);

  useEffect(() => {
    // Fetch platform settings
    const fetchPlatformSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('telegram_bot_token, telegram_bot_username')
          .single();
          
        if (error) throw error;
        setPlatformSettings(data);
      } catch (error: any) {
        console.error('Error fetching platform settings:', error);
        toast.error('Failed to fetch bot information');
      }
    };
    
    fetchPlatformSettings();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create a temporary URL for preview
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  const uploadLogo = async (communityId: string): Promise<string | null> => {
    if (!logoFile) return null;
    
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${communityId}-logo.${fileExt}`;
      const filePath = `community-logos/${fileName}`;
      
      // Check if storage bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(bucket => bucket.name === 'community-assets')) {
        await supabase.storage.createBucket('community-assets', { public: true });
      }
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('community-assets')
        .upload(filePath, logoFile);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage.from('community-assets').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(`Logo upload failed: ${error.message}`);
      return null;
    }
  };

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
          focus_areas: focusAreas,
          admin_email: adminEmail,
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
  
  const validateBasicInfo = () => {
    if (!name) {
      toast.error('Community name is required');
      return false;
    }
    
    if (!adminEmail) {
      toast.error('Admin email is required');
      return false;
    }
    
    return true;
  };
  
  const validatePlatformSetup = () => {
    if (!platform) {
      toast.error('Platform selection is required');
      return false;
    }
    
    if (!platformId) {
      toast.error('Platform ID or URL is required');
      return false;
    }
    
    if (platform === 'TELEGRAM' && !verificationResult?.botAdded) {
      toast.error('Please verify that the bot is added to your Telegram group');
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
  
  const nextStep = () => {
    if (currentStep === 'basic-info') {
      if (!validateBasicInfo()) return;
      setCurrentStep('platform-setup');
      setProgress(50);
    } else if (currentStep === 'platform-setup') {
      if (!validatePlatformSetup()) return;
      setCurrentStep('preferences');
      setProgress(75);
    } else if (currentStep === 'preferences') {
      setCurrentStep('monetization');
      setProgress(100);
    }
  };
  
  const prevStep = () => {
    if (currentStep === 'platform-setup') {
      setCurrentStep('basic-info');
      setProgress(25);
    } else if (currentStep === 'preferences') {
      setCurrentStep('platform-setup');
      setProgress(50);
    } else if (currentStep === 'monetization') {
      setCurrentStep('preferences');
      setProgress(75);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Use the auto-detected member count if available
      const finalReach = verificationResult?.memberCount || parseInt(reach) || 0;
      
      // 1. Create the community
      const { data: communityData, error: communityError } = await supabase
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
          focus_areas: focusAreas,
          admin_email: adminEmail,
          admin_telegram_handle: adminTelegram,
          admin_twitter_handle: adminTwitter,
          host_local_meetups: hostMeetups,
          meetup_city: meetupCity,
          audience_type: audienceTypes,
        })
        .select()
        .single();
        
      if (communityError) throw communityError;
      
      // 2. Upload the logo if provided
      let logoPublicUrl = null;
      if (logoFile) {
        logoPublicUrl = await uploadLogo(communityData.id);
        
        // Update the community with the logo URL
        if (logoPublicUrl) {
          await supabase
            .from('communities')
            .update({ logo_url: logoPublicUrl })
            .eq('id', communityData.id);
        }
      }
      
      // 3. Save preferences
      await supabase
        .from('community_preferences')
        .insert({
          community_id: communityData.id,
          ...preferences,
          enable_monetization: enableMonetization
        });
      
      toast.success('Community created successfully!');
      navigate('/communities');
    } catch (error: any) {
      toast.error(`Error creating community: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getRegionLabel = (value: string) => {
    const region = REGIONS.find(r => r.value === value);
    return region ? region.label : value;
  };

  const getFocusAreaLabel = (value: string) => {
    const area = FOCUS_AREAS.find(a => a.value === value);
    return area ? area.label : value;
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
          <li>Search for {platformSettings?.telegram_bot_username ? `@${platformSettings.telegram_bot_username}` : 'our bot'}</li>
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

  useEffect(() => {
    // Fetch bot info when platform changes
    const fetchBotInfo = async () => {
      if (!platform) return;
      
      try {
        const { data, error } = await supabase
          .from('platform_bots')
          .select('*')
          .eq('platform', platform)
          .single();
          
        if (error) throw error;
        setBotInfo(data);
      } catch (error) {
        console.error('Error fetching bot info:', error);
        toast.error('Failed to fetch bot information');
      }
    };
    
    fetchBotInfo();
  }, [platform]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic-info':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center text-white">
                Community Name <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Crypto Traders Group"
                className="bg-white/10 border-white/20 backdrop-blur-sm text-white"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your community"
                className="bg-white/10 border-white/20 backdrop-blur-sm min-h-[100px] text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="flex items-center text-white">
                Admin Email <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-10 bg-white/10 border-white/20 backdrop-blur-sm text-white"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminTelegram" className="text-white">Admin Telegram Handle</Label>
              <div className="relative">
                <Send className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="adminTelegram"
                  value={adminTelegram}
                  onChange={(e) => setAdminTelegram(e.target.value)}
                  placeholder="@username"
                  className="pl-10 bg-white/10 border-white/20 backdrop-blur-sm text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminTwitter" className="text-white">Admin Twitter Handle</Label>
              <div className="relative">
                <Twitter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="adminTwitter"
                  value={adminTwitter}
                  onChange={(e) => setAdminTwitter(e.target.value)}
                  placeholder="@username"
                  className="pl-10 bg-white/10 border-white/20 backdrop-blur-sm text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-white">Community Logo</Label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed rounded-lg border-gray-300 hover:border-primary cursor-pointer bg-white/5 backdrop-blur-sm">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400" />
                  )}
                  <input
                    type="file"
                    id="logo"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                <div>
                  <p className="text-sm text-white">
                    {logoFile ? logoFile.name : 'Upload community logo'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Recommended: 512x512px square image
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'platform-setup':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center text-white">
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
                <div className="flex items-center space-x-2 border border-white/20 bg-white/5 backdrop-blur-sm rounded-md px-4 py-3">
                  <RadioGroupItem value="TELEGRAM" id="telegram" />
                  <Label htmlFor="telegram" className="cursor-pointer flex items-center text-white">
                    <Send className="mr-2 h-4 w-4 text-blue-400" />
                    Telegram
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border border-white/20 bg-white/5 backdrop-blur-sm rounded-md px-4 py-3">
                  <RadioGroupItem value="DISCORD" id="discord" />
                  <Label htmlFor="discord" className="cursor-pointer flex items-center text-white">
                    <MessagesSquare className="mr-2 h-4 w-4 text-indigo-400" />
                    Discord
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border border-white/20 bg-white/5 backdrop-blur-sm rounded-md px-4 py-3">
                  <RadioGroupItem value="WHATSAPP" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="cursor-pointer flex items-center text-white">
                    <Send className="mr-2 h-4 w-4 text-green-400" />
                    WhatsApp
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="platformId" className="flex items-center text-white">
                Channel/Group ID or URL <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex space-x-2 flex-col sm:flex-row gap-2 sm:gap-0">
                <Input
                  id="platformId"
                  value={platformId}
                  onChange={(e) => {
                    setPlatformId(e.target.value);
                    // Reset verification when changing the platform ID
                    setVerificationResult(null);
                  }}
                  placeholder={platform === 'TELEGRAM' ? "e.g., @crypto_traders, t.me/channel, or -1001234567890" : "e.g., https://discord.gg/..."}
                  className="bg-white/10 border-white/20 backdrop-blur-sm text-white"
                  required
                />
                {platform === 'TELEGRAM' && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleTelegramVerification}
                    disabled={isVerifying || !platformId}
                    className="whitespace-nowrap sm:w-auto w-full bg-white/10 backdrop-blur-sm"
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
              <p className="text-xs text-white">
                {platform === 'TELEGRAM' && "Enter your Telegram group username starting with @ or group ID"}
                {platform === 'DISCORD' && "Enter your Discord channel invite link"}
                {platform === 'WHATSAPP' && "Enter your WhatsApp group invite link"}
              </p>
            </div>
            
            {platform === 'TELEGRAM' && getBotInstructions()}
            
            {platform === 'TELEGRAM' && verificationResult && (
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

            {botInfo && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-md">
                <div className="flex items-start mb-2">
                  <Bot className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-400">Add Bot to Your Community</h4>
                    <p className="text-sm text-white mt-1">
                      Bot Name: {botInfo.bot_name}
                    </p>
                    <a 
                      href={botInfo.bot_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center mt-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Add Bot to {platform}
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="reach" className="text-white">Community Size</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reach"
                  type="number"
                  value={verificationResult?.memberCount ? verificationResult.memberCount.toString() : reach}
                  onChange={(e) => setReach(e.target.value)}
                  placeholder="Number of members"
                  className="pl-10 bg-white/10 border-white/20 backdrop-blur-sm text-white"
                  readOnly={verificationResult?.memberCount !== undefined}
                />
              </div>
              {verificationResult?.memberCount && (
                <p className="text-xs text-green-400">Member count auto-detected from the group</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="flex items-center text-white">
                Target Audience <span className="text-red-500 ml-1">*</span>
              </Label>
              {['WEB3_PROFESSIONALS', 'LEARNERS', 'INTERMEDIATE', 'TRADERS', 'INVESTORS'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={audienceTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setAudienceTypes([...audienceTypes, type]);
                      } else {
                        setAudienceTypes(audienceTypes.filter(t => t !== type));
                      }
                    }}
                  />
                  <label htmlFor={type} className="text-sm text-white cursor-pointer">
                    {type.replace('_', ' ').toLowerCase()
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <Label className="text-white">Regions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomRegionInput(true)}
                  className="h-8 text-xs bg-white/10 border-white/20 backdrop-blur-sm text-white"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Custom
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <Badge 
                    key={region} 
                    className="bg-white/10 text-white hover:bg-white/20 pl-2 pr-1 py-1.5"
                  >
                    {getRegionLabel(region)}
                    <button 
                      type="button" 
                      className="ml-1 hover:bg-white/10 rounded-full"
                      onClick={() => removeRegion(region)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {showCustomRegionInput && (
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Enter custom region"
                    value={customRegion}
                    onChange={(e) => setCustomRegion(e.target.value)}
                    className="flex-grow bg-white/10 border-white/20 backdrop-blur-sm text-white"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addCustomRegion}
                    className="bg-white/10 border-white/20 backdrop-blur-sm text-white"
                  >
                    Add
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowCustomRegionInput(false)}
                    className="text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <Label className="text-white">Focus Areas</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomFocusAreaInput(true)}
                  className="h-8 text-xs bg-white/10 border-white/20 backdrop-blur-sm text-white"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Custom
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area) => (
                  <Badge 
                    key={area} 
                    className="bg-white/10 text-white hover:bg-white/20 pl-2 pr-1 py-1.5"
                  >
                    {getFocusAreaLabel(area)}
                    <button 
                      type="button" 
                      className="ml-1 hover:bg-white/10 rounded-full"
                      onClick={() => removeFocusArea(area)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {showCustomFocusAreaInput && (
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Enter custom focus area"
                    value={customFocusArea}
                    onChange={(e) => setCustomFocusArea(e.target.value)}
                    className="flex-grow bg-white/10 border-white/20 backdrop-blur-sm text-white"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addCustomFocusArea}
                    className="bg-white/10 border-white/20 backdrop-blur-sm text-white"
                  >
                    Add
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowCustomFocusAreaInput(false)}
                    className="text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Content Preferences</h3>
              <p className="text-sm text-white">
                Select the types of content your community would be interested in receiving.
              </p>
              
              <div className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hackathons" 
                    checked={preferences.hackathons}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, hackathons: !!checked})
                    }
                  />
                  <label
                    htmlFor="hackathons"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
                  >
                    Hackathons & Events
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bounties" 
                    checked={preferences.bounties}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, bounties: !!checked})
                    }
                  />
                  <label
                    htmlFor="bounties"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
                  >
                    Bounties & Rewards
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hiring" 
                    checked={preferences.hiring}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, hiring: !!checked})
                    }
                  />
                  <label
                    htmlFor="hiring"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
                  >
                    Job Opportunities
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="irl_events" 
                    checked={preferences.irl_events}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, irl_events: !!checked})
                    }
                  />
                  <label
                    htmlFor="irl_events"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
                  >
                    In-person Events & Meetups
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="news_updates" 
                    checked={preferences.news_updates}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, news_updates: !!checked})
                    }
                  />
                  <label
                    htmlFor="news_updates"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
                  >
                    News & Updates
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="thread_contests" 
                    checked={preferences.thread_contests}
                    onCheckedChange={(checked) => 
                      setPreferences({...preferences, thread_contests: !!checked})
                    }
                  />
                  <label
                    htmlFor="thread_contests"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
                  >
                    Thread Contests & Discussions
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              <h3 className="text-lg font-medium text-white">Local Meetups</h3>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hostMeetups" 
                  checked={hostMeetups}
                  onCheckedChange={(checked) => setHostMeetups(!!checked)}
                />
                <label
                  htmlFor="hostMeetups"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
                >
                  We host local meetups
                </label>
              </div>
              
              {hostMeetups && (
                <div className="mt-3">
                  <Label htmlFor="meetupCity" className="text-white">Primary City</Label>
                  <Input
                    id="meetupCity"
                    value={meetupCity}
                    onChange={(e) => setMeetupCity(e.target.value)}
                    placeholder="e.g., New York, London, Singapore"
                    className="bg-white/10 border-white/20 backdrop-blur-sm text-white mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        );
        
      case 'monetization':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">Announcement Monetization</h3>
              <p className="text-sm text-white">
                Set up how you want to monetize announcements posted to your community.
              </p>
              
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox 
                  id="enableMonetization" 
                  checked={enableMonetization}
                  onCheckedChange={(checked) => setEnableMonetization(!!checked)}
                />
                <label
                  htmlFor="enableMonetization"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
                >
                  Enable monetization for my community
                </label>
              </div>
              
              {enableMonetization && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="price" className="text-white">Price per announcement (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pl-8 bg-white/10 border-white/20 backdrop-blur-sm text-white"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is the amount brands will pay to post an announcement in your community.
                  </p>
                </div>
              )}
              
              <Alert className="mt-6 bg-blue-500/10 border border-blue-400/30">
                <AlertDescription className="text-sm text-white">
                  <strong className="text-blue-400">How it works:</strong> When approved, your community will be listed in our marketplace. 
                  Companies can select your community for their announcements, and you'll earn the amount specified above for each approved announcement.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gradient-primary mb-2">Create Community</h1>
          <p className="text-white">
            Register your community to receive and monetize announcements from brands and projects.
          </p>
        </div>
        
        <Card className="glass-morphism border-white/10 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl">
              {currentStep === 'basic-info' && 'Basic Information'}
              {currentStep === 'platform-setup' && 'Platform Setup'}
              {currentStep === 'preferences' && 'Content Preferences'}
              {currentStep === 'monetization' && 'Monetization Settings'}
            </CardTitle>
            <CardDescription className="text-white/70">
              Step {currentStep === 'basic-info' ? '1' : 
              currentStep === 'platform-setup' ? '2' :
              currentStep === 'preferences' ? '3' : '4'} of 4
            </CardDescription>
            <Progress value={progress} className="mt-2 bg-white/10" />
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit}>
              {renderStepContent()}
              
              <div className="flex justify-between mt-8">
                {currentStep !== 'basic-info' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20"
                  >
                    Back
                  </Button>
                )}
                {currentStep !== 'monetization' ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="ml-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Community'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CommunityCreate;
