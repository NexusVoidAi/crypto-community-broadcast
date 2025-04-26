
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { Plus } from 'lucide-react';

const CommunityCreate: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Create Community</h1>
          <p className="text-white mt-2">Setup a new community for crypto announcements</p>
        </div>

        <Card className="border-border/50 bg-crypto-darkgray/50">
          <CardHeader>
            <CardTitle className="text-white">Community Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Community Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter community name" 
                  className="bg-crypto-dark text-white border-border/50 placeholder:text-white/60" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Describe your community" 
                  className="bg-crypto-dark text-white border-border/50 placeholder:text-white/60" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform" className="text-white">Platform</Label>
                <Select>
                  <SelectTrigger className="bg-crypto-dark text-white border-border/50">
                    <SelectValue placeholder="Select platform" className="text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-crypto-dark text-white">
                    <SelectItem value="telegram" className="text-white hover:bg-white/10">Telegram</SelectItem>
                    <SelectItem value="discord" className="text-white hover:bg-white/10">Discord</SelectItem>
                    <SelectItem value="whatsapp" className="text-white hover:bg-white/10">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button className="w-full bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
                <Plus className="mr-2 h-4 w-4" /> Create Community
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CommunityCreate;
