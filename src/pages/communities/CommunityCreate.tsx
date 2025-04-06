import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { MessagesSquare, Send, Users, AlertTriangle, Bot, Check } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const CommunityCreate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<'TELEGRAM' | 'DISCORD' | 'WHATSAPP'>('TELEGRAM');
  const [platformId, setPlatformId] = useState('');
  const [reach, setReach] = useState('');
  const [price, setPrice] = useState('25');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid?: boolean;
    botAdded?: boolean;
    isAdmin?: boolean;
    error?: string;
  } | null>(null);

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
          approval_status: 'DRAFT'
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
        setVerificationResult({
          isValid: true,
          botAdded: true,
          isAdmin: data.isAdmin,
        });
        toast.success('Verification successful! The bot is in the group.');
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
          <li>Search for the ACHO AI bot (check Admin dashboard for bot username)</li>
          <li>Add the bot to your group</li>
          <li>Make the bot an administrator of the group (required for posting announcements)</li>
          <li>Click "Verify" below to confirm the bot has been added successfully</li>
        </ol>
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
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name,
          description,
          platform,
          platform_id: platformId,
          reach: parseInt(reach) || 0,
          price_per_announcement: parseFloat(price) || 25.00,
          owner_id: user?.id
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
                <div className="flex space-x-2">
                  <Input
                    id="platformId"
                    value={platformId}
                    onChange={(e) => setPlatformId(e.target.value)}
                    placeholder={platform === 'TELEGRAM' ? "e.g., @crypto_traders or -1001234567890" : "e.g., https://discord.gg/..."}
                    className="bg-crypto-dark border-border/50"
                    required
                  />
                  {platform === 'TELEGRAM' && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleTelegramVerification}
                      disabled={isVerifying || !platformId}
                      className="whitespace-nowrap"
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="reach">Community Size</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reach"
                      type="number"
                      value={reach}
                      onChange={(e) => setReach(e.target.value)}
                      placeholder="Number of members"
                      className="pl-10 bg-crypto-dark border-border/50"
                    />
                  </div>
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
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/communities')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90"
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
