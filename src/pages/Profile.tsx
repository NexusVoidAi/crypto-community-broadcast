
import React, { useState } from 'react';
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

const Profile: React.FC = () => {
  const { user, profile, walletAddress, isWalletConnected } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  const getInitials = () => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
        })
        .eq('id', user?.id);

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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
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
              {profile?.wallet_address && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  Wallet: {profile.wallet_address}
                </p>
              )}
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
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-crypto-dark border-border/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-crypto-dark/50 border-border/50 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wallet">Wallet</Label>
                  <div className="bg-crypto-dark border-border/50 rounded-md p-4">
                    <ConnectButton.Custom>
                      {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        mounted,
                      }) => {
                        return (
                          <div
                            {...(!mounted && {
                              'aria-hidden': true,
                              'style': {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                              },
                            })}
                          >
                            {(() => {
                              if (!mounted || !account || !chain) {
                                return (
                                  <Button
                                    onClick={openConnectModal}
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                  >
                                    Connect Wallet
                                  </Button>
                                );
                              }

                              if (chain.unsupported) {
                                return (
                                  <Button 
                                    onClick={openChainModal}
                                    type="button"
                                    variant="destructive"
                                    className="w-full"
                                  >
                                    Wrong network
                                  </Button>
                                );
                              }

                              return (
                                <div className="flex flex-col space-y-3">
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
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={openChainModal}
                                        type="button"
                                      >
                                        {chain.name}
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={openAccountModal}
                                        type="button"
                                      >
                                        Account
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      }}
                    </ConnectButton.Custom>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="bg-crypto-blue hover:bg-crypto-blue/90 w-full md:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
