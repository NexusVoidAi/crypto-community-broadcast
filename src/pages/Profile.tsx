import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Wallet } from 'lucide-react';
const Profile: React.FC = () => {
  const {
    user,
    profile,
    walletAddress,
    isWalletConnected,
    connectWallet
  } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    platformFee: 1,
    telegramBotToken: '',
    telegramBotUsername: ''
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDisconnectingWallet, setIsDisconnectingWallet] = useState(false);
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Check if user has admin privileges
        const {
          data: adminData,
          error: adminError
        } = await supabase.from('profiles').select('*').eq('id', user?.id).eq('account_type', 'admin').single();
        if (adminError && adminError.code !== 'PGRST116') throw adminError;
        setIsAdmin(!!adminData);
        if (!!adminData) {
          fetchSettings();
        }
      } catch (error: any) {
        console.error("Error checking admin status:", error);
      }
    };
    checkAdminStatus();
  }, [user?.id]);
  const fetchSettings = async () => {
    try {
      setIsSettingsLoading(true);
      const {
        data,
        error
      } = await supabase.from('platform_settings').select('*').single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (data) {
        setSettings({
          platformFee: data.platform_fee || 1,
          telegramBotToken: data.telegram_bot_token || '',
          telegramBotUsername: data.telegram_bot_username || ''
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load platform settings");
    } finally {
      setIsSettingsLoading(false);
    }
  };
  const getInitials = () => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        name
      }).eq('id', user?.id);
      if (error) {
        throw error;
      }
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(`Error updating profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const {
        data,
        error
      } = await supabase.from('platform_settings').upsert({
        id: 1,
        // Single row for all settings
        platform_fee: settings.platformFee,
        telegram_bot_token: settings.telegramBotToken,
        telegram_bot_username: settings.telegramBotUsername,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;

      // Call the configure bot function to update the webhook
      if (settings.telegramBotToken && settings.telegramBotUsername) {
        await supabase.functions.invoke("telegram-configure-bot", {
          body: {
            token: settings.telegramBotToken,
            username: settings.telegramBotUsername
          }
        });
      }
      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const disconnectWallet = async () => {
    setIsDisconnectingWallet(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: null })
        .eq('id', user?.id);
        
      if (error) throw error;
      
      toast.success('Wallet disconnected successfully');
      // Force a page reload to update the profile state
      window.location.reload();
    } catch (error: any) {
      toast.error(`Error disconnecting wallet: ${error.message}`);
    } finally {
      setIsDisconnectingWallet(false);
    }
  };

  return <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        <Tabs defaultValue="personal">
          <TabsList className="mb-6">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            {isAdmin && <TabsTrigger value="platform">Platform Settings</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="personal">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="col-span-1 border border-border/50 bg-crypto-darkgray/50">
                <CardHeader className="flex items-center justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="mt-4">{profile?.name || 'User'}</CardTitle>
                  <CardDescription>{profile?.account_type === 'business' ? 'Business Account' : 'Community Account'}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {profile?.wallet_address && <p className="text-sm text-muted-foreground mt-1 truncate">
                      Wallet: {profile.wallet_address}
                    </p>}
                </CardContent>
              </Card>
              
              <Card className="col-span-1 md:col-span-2 border border-border/50 bg-crypto-darkgray/50">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" value={name} onChange={e => setName(e.target.value)} className="border-border/50 bg-slate-200" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ''} disabled className="bg-crypto-dark/50 border-border/50 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Wallet Connection
                      </Label>
                      <div className="bg-crypto-dark border-border/50 rounded-md p-4">
                        {profile?.wallet_address ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium truncate">{profile.wallet_address}</p>
                                <p className="text-xs text-muted-foreground">Connected Wallet</p>
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={disconnectWallet}
                                disabled={isDisconnectingWallet}
                              >
                                {isDisconnectingWallet ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Disconnecting...</>
                                ) : (
                                  'Disconnect Wallet'
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              To connect a different wallet, first disconnect the current one
                            </p>
                          </div>
                        ) : (
                          <ConnectButton.Custom>
                            {({
                              account,
                              chain,
                              openAccountModal,
                              openChainModal,
                              openConnectModal,
                              mounted
                            }) => {
                              return <div {...!mounted && {
                                'aria-hidden': true,
                                'style': {
                                  opacity: 0,
                                  pointerEvents: 'none',
                                  userSelect: 'none'
                                }
                              }}>
                                    {(() => {
                                  if (!mounted || !account || !chain) {
                                    return <Button onClick={openConnectModal} type="button" variant="outline" className="w-full">
                                            Connect Wallet
                                          </Button>;
                                  }
                                  if (chain.unsupported) {
                                    return <Button onClick={openChainModal} type="button" variant="destructive" className="w-full">
                                            Wrong network
                                          </Button>;
                                  }
                                  return <div className="flex flex-col space-y-3">
                                          <div className="flex items-center justify-between">
                                            <div className="text-sm">
                                              <p className="font-medium">
                                                {account.displayName}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                Connected to {chain.name}
                                              </p>
                                            </div>
                                            <div className="flex space-x-2">
                                              <Button variant="outline" size="sm" onClick={openChainModal} type="button">
                                                {chain.name}
                                              </Button>
                                              <Button variant="outline" size="sm" onClick={openAccountModal} type="button">
                                                Account
                                              </Button>
                                            </div>
                                          </div>
                                        </div>;
                                })()}
                                  </div>;
                            }}
                          </ConnectButton.Custom>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button type="submit" className="bg-crypto-blue hover:bg-crypto-blue/90 w-full md:w-auto" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {isAdmin && <TabsContent value="platform">
              <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>Configure platform-wide settings</CardDescription>
                </CardHeader>
                <CardContent>
                  {isSettingsLoading ? <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div> : <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="platformFee">Platform Fee (USDT)</Label>
                        <Input id="platformFee" type="number" min="0" step="0.01" value={settings.platformFee} onChange={e => setSettings(prev => ({
                    ...prev,
                    platformFee: parseFloat(e.target.value)
                  }))} className="bg-crypto-dark border-border" />
                        <p className="text-xs text-muted-foreground">Additional fee added to each announcement</p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Telegram Bot Configuration</h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="telegramBotToken">Bot Token</Label>
                            <Input id="telegramBotToken" type="password" value={settings.telegramBotToken} onChange={e => setSettings(prev => ({
                        ...prev,
                        telegramBotToken: e.target.value
                      }))} className="bg-crypto-dark border-border" />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="telegramBotUsername">Bot Username</Label>
                            <Input id="telegramBotUsername" placeholder="e.g., my_crypto_bot" value={settings.telegramBotUsername} onChange={e => setSettings(prev => ({
                        ...prev,
                        telegramBotUsername: e.target.value
                      }))} className="bg-crypto-dark border-border" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-crypto-blue hover:bg-crypto-blue/90">
                          {isSavingSettings ? <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </> : <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Settings
                            </>}
                        </Button>
                      </div>
                    </div>}
                </CardContent>
              </Card>
            </TabsContent>}
        </Tabs>
      </div>
    </AppLayout>;
};
export default Profile;
