
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { MessagesSquare, Send, Users, AlertTriangle, Bot, Check, ExternalLink, Globe, Plus, X, Upload, AtSign, Wallet, Rocket } from 'lucide-react';
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
  const [walletAddress, setWalletAddress] = useState('');
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
          wallet_address: walletAddress
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
    
    if (!walletAddress) {
      toast.warning('Wallet address is recommended for receiving payments');
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
          wallet_address: walletAddress
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic-info':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center">
                Community Name <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Crypto Traders Group"
                className="bg-white/10 border-white/20 backdrop-blur-sm"
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
                className="bg-white/10 border-white/20 backdrop-blur-sm min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="flex items-center">
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
                  className="pl-10 bg-white/10 border-white/20 backdrop-blur-sm"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="walletAddress">Wallet Address (for payments)</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="walletAddress"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="pl-10 bg-white/10 border-white/20 backdrop-blur-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo">Community Logo</Label>
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
                  <p className="text-sm text-gray-300">
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
                <div className="flex items-center space-x-2 border border-white/20 bg-white/5 backdrop-blur-sm rounded-md px-4 py-3">
                  <RadioGroupItem value="TELEGRAM" id="telegram" />
                  <Label htmlFor="telegram" className="cursor-pointer flex items-center">
                    <Send className="mr-2 h-4 w-4 text-blue-400" />
                    Telegram
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border border-white/20 bg-white/5 backdrop-blur-sm rounded-md px-4 py-3">
                  <RadioGroupItem value="DISCORD" id="discord" />
                  <Label htmlFor="discord" className="cursor-pointer flex items-center">
                    <MessagesSquare className="mr-2 h-4 w-4 text-indigo-400" />
                    Discord
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border border-white/20 bg-white/5 backdrop-blur-sm rounded-md px-4 py-3">
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
                  onChange={(e) => {
                    setPlatformId(e.target.value);
                    // Reset verification when changing the platform ID
                    setVerificationResult(null);
                  }}
                  placeholder={platform === 'TELEGRAM' ? "e.g., @crypto_traders, t.me/channel, or -1001234567890" : "e.g., https://discord.gg/..."}
                  className="bg-white/10 border-white/20 backdrop-blur-sm"
                  normalizeTelegramId={platform === 'TELEGRAM'}
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
              <p className="text-xs text-gray-400">
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
                  className="pl-10 bg-white/10 border-white/20 backdrop-blur-sm"
                  readOnly={verificationResult?.memberCount !== undefined}
                />
              </div>
              {verificationResult?.memberCount && (
                <p className="text-xs text-green-400">Member count auto-detected from the group</p>
              )}
            </div>
            
            {/* Multiple Regions Selection */}
            <div className="space-y-3">
              <Label htmlFor="region" className="flex items-center">
                Community Regions <span className="text-red-500 ml-1">*</span>
                <span className="text-xs text-gray-400 ml-2">(Select one or more)</span>
              </Label>
              
              <div className="flex flex-wrap gap-2">
                {regions.map(region => (
                  <Badge 
                    key={region}
                    variant="secondary" 
                    className="px-3 py-1.5 bg-white/10 backdrop-blur-sm"
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
                    <Button variant="outline" type="button" className="bg-white/10 border-white/20 backdrop-blur-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Region
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-white/10 backdrop-blur-lg border-white/20">
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
                      className="bg-white/10 border-white/20 backdrop-blur-sm flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={addCustomRegion}
                      disabled={!customRegion.trim()}
                      className="bg-white/10 border-white/20 backdrop-blur-sm"
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
                <span className="text-xs text-gray-400 ml-2">(Select one or more)</span>
              </Label>
              
              <div className="flex flex-wrap gap-2">
                {focusAreas.map(area => (
                  <Badge 
                    key={area}
                    variant="secondary" 
                    className="px-3 py-1.5 bg-white/10 backdrop-blur-sm"
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
                    <Button variant="outline" type="button" className="bg-white/10 border-white/20 backdrop-blur-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Focus Area
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-white/10 backdrop-blur-lg border-white/20">
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
                      className="bg-white/10 border-white/20 backdrop-blur-sm flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={addCustomFocusArea}
                      disabled={!customFocusArea.trim()}
                      className="bg-white/10 border-white/20 backdrop-blur-sm"
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
          </div>
        );
        
      case 'preferences':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Community Content Preferences</h3>
            <p className="text-sm text-gray-400">
              Select the types of content you want to receive in your community:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                <Checkbox 
                  id="hackathons" 
                  checked={preferences.hackathons} 
                  onCheckedChange={(checked) => 
                    setPreferences({...preferences, hackathons: checked === true})
                  } 
                />
                <div>
                  <Label 
                    htmlFor="hackathons" 
                    className="text-base font-medium cursor-pointer"
                  >
                    Hackathons
                  </Label>
                  <p className="text-sm text-gray-400">
                    Announcements about blockchain and crypto hackathon events
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                <Checkbox 
                  id="bounties" 
                  checked={preferences.bounties} 
                  onCheckedChange={(checked) => 
                    setPreferences({...preferences, bounties: checked === true})
                  } 
                />
                <div>
                  <Label 
                    htmlFor="bounties" 
                    className="text-base font-medium cursor-pointer"
                  >
                    Bounties
                  </Label>
                  <p className="text-sm text-gray-400">
                    Offers for paid work and contribution opportunities
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                <Checkbox 
                  id="hiring" 
                  checked={preferences.hiring} 
                  onCheckedChange={(checked) => 
                    setPreferences({...preferences, hiring: checked === true})
                  } 
                />
                <div>
                  <Label 
                    htmlFor="hiring" 
                    className="text-base font-medium cursor-pointer"
                  >
                    Hiring
                  </Label>
                  <p className="text-sm text-gray-400">
                    Job opportunities in blockchain and crypto
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                <Checkbox 
                  id="irl_events" 
                  checked={preferences.irl_events} 
                  onCheckedChange={(checked) => 
                    setPreferences({...preferences, irl_events: checked === true})
                  } 
                />
                <div>
                  <Label 
                    htmlFor="irl_events" 
                    className="text-base font-medium cursor-pointer"
                  >
                    IRL Events
                  </Label>
                  <p className="text-sm text-gray-400">
                    In-person crypto conferences, meetups, and events
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                <Checkbox 
                  id="news_updates" 
                  checked={preferences.news_updates} 
                  onCheckedChange={(checked) => 
                    setPreferences({...preferences, news_updates: checked === true})
                  } 
                />
                <div>
                  <Label 
                    htmlFor="news_updates" 
                    className="text-base font-medium cursor-pointer"
                  >
                    News / Updates
                  </Label>
                  <p className="text-sm text-gray-400">
                    Project updates, partnerships, and ecosystem news
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-sm p-4 rounded-md border border-white/20">
                <Checkbox 
                  id="thread_contests" 
                  checked={preferences.thread_contests} 
                  onCheckedChange={(checked) => 
                    setPreferences({...preferences, thread_contests: checked === true})
                  } 
                />
                <div>
                  <Label 
                    htmlFor="thread_contests" 
                    className="text-base font-medium cursor-pointer"
                  >
                    Thread Contests
                  </Label>
                  <p className="text-sm text-gray-400">
                    Community engagement contests and challenges
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'monetization':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-gradient-to-r from-crypto-violet/20 to-crypto-blue/20 p-4 rounded-lg backdrop-blur-sm border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-crypto-violet/20 rounded-full">
                  <Rocket className="h-6 w-6 text-crypto-violet" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Enable Monetization</h3>
                  <p className="text-sm text-gray-400">
                    Earn money by allowing announcements in your community
                  </p>
                </div>
              </div>
              <Checkbox 
                id="enable_monetization" 
                checked={enableMonetization}
                className="data-[state=checked]:bg-crypto-violet"
                onCheckedChange={(checked) => setEnableMonetization(checked === true)}
              />
            </div>
            
            {enableMonetization && (
              <div className="space-y-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                <div className="space-y-2">
                  <Label htmlFor="price">Price per announcement ($)</Label>
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
                      className="pl-10 bg-white/5 border-white/20"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    This is the base price for a single announcement in your community
                  </p>
                </div>
                
                <div className="mt-4 p-4 bg-crypto-darkgray/50 rounded-md border border-white/10">
                  <h4 className="font-medium mb-2">Payout Information</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Payments will be sent to your wallet address after each successful announcement
                  </p>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Wallet className="h-4 w-4 text-crypto-violet" />
                    <span className="text-gray-300">
                      {walletAddress ? walletAddress : 'No wallet address provided'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-br from-white via-white/90 to-white/70 bg-clip-text text-transparent">Create Your Community</h1>
        <p className="text-gray-400 mb-6">Complete the onboarding steps to add your community</p>
        
        <div className="mb-8">
          <Progress value={progress} className="h-2 bg-white/10" indicatorClassName="bg-gradient-to-r from-crypto-violet to-crypto-blue" />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Basic Info</span>
            <span>Platform Setup</span>
            <span>Preferences</span>
            <span>Monetization</span>
          </div>
        </div>
        
        <Card className="border border-white/10 bg-white/5 backdrop-blur-lg shadow-xl">
          <CardHeader>
            <CardTitle>
              {currentStep === 'basic-info' && 'Basic Community Information'}
              {currentStep === 'platform-setup' && 'Platform Setup'}
              {currentStep === 'preferences' && 'Content Preferences'}
              {currentStep === 'monetization' && 'Monetization Settings'}
            </CardTitle>
            <CardDescription>
              {currentStep === 'basic-info' && 'Add details about your community'}
              {currentStep === 'platform-setup' && 'Configure your community platform and reach'}
              {currentStep === 'preferences' && 'Select which types of content you want to receive'}
              {currentStep === 'monetization' && 'Set up earning options for your community'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderStepContent()}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            {currentStep !== 'basic-info' && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="bg-white/5 backdrop-blur-sm"
              >
                Back
              </Button>
            )}
            
            {currentStep === 'monetization' ? (
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-gradient-to-r from-crypto-violet to-crypto-blue hover:from-crypto-violet/90 hover:to-crypto-blue/90 text-white ml-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-gradient-to-r from-crypto-violet to-crypto-blue hover:from-crypto-violet/90 hover:to-crypto-blue/90 text-white ml-auto"
              >
                Continue
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CommunityCreate;
