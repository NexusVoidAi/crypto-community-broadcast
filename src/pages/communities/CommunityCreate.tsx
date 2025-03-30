
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { MessagesSquare, Send, Users } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !platform) {
      toast.error('Please fill in all required fields');
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
                <Label htmlFor="name">Community Name *</Label>
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
                <Label>Platform *</Label>
                <RadioGroup
                  value={platform}
                  onValueChange={(value) => setPlatform(value as 'TELEGRAM' | 'DISCORD' | 'WHATSAPP')}
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
                <Label htmlFor="platformId">Channel/Group ID or URL</Label>
                <Input
                  id="platformId"
                  value={platformId}
                  onChange={(e) => setPlatformId(e.target.value)}
                  placeholder="e.g., @crypto_traders or https://discord.gg/..."
                  className="bg-crypto-dark border-border/50"
                />
              </div>
              
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
                  disabled={isLoading}
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
