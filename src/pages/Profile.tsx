
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

const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [walletAddress, setWalletAddress] = useState(profile?.wallet_address || '');
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
          wallet_address: walletAddress,
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

  const connectWallet = async () => {
    // Mock wallet connection
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setWalletAddress('0x1234...5678');
      toast.success('Wallet connected successfully');
    } catch (error) {
      toast.error('Failed to connect wallet');
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
                  <Label htmlFor="wallet">Wallet Address</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="wallet"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="Connect your crypto wallet"
                      className="bg-crypto-dark border-border/50 flex-1"
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={connectWallet}
                      disabled={isLoading}
                    >
                      Connect
                    </Button>
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
