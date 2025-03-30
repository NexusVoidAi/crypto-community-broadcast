
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  MessageSquare, 
  Wallet, 
  CheckCircle2, 
  Loader2, 
  MessageCircle, 
  CircleUser,
  Hash, // Replaced Discord with Hash
  Send 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AnnouncementPreview: React.FC = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsWalletConnected(true);
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePayment = async () => {
    setIsPaying(true);
    
    try {
      // Simulate payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Payment successful! Your announcement has been published.');
      navigate('/announcements');
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  // Mock data for the announcement
  const announcementData = {
    title: "New Token Launch: APEX",
    content: "We're excited to announce the launch of our new token, APEX. Join our community for early access and exclusive rewards.",
    communities: [
      { id: 1, name: 'Crypto Traders', platform: 'Telegram', price: 25, members: 15000 },
      { id: 2, name: 'DeFi Hub', platform: 'Discord', price: 35, members: 22000 },
    ],
  };

  const totalCost = announcementData.communities.reduce((sum, community) => sum + community.price, 0);
  const platformFee = totalCost * 0.1; // 10% platform fee
  const grandTotal = totalCost + platformFee;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Preview & Payment</h1>
        <p className="text-muted-foreground mb-6">
          Preview your announcement across platforms and complete payment to publish
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Announcement Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="telegram">
                  <TabsList className="mb-4">
                    <TabsTrigger value="telegram" className="flex items-center">
                      <Send className="h-4 w-4 mr-2" />
                      Telegram
                    </TabsTrigger>
                    <TabsTrigger value="discord" className="flex items-center">
                      <Hash className="h-4 w-4 mr-2" /> {/* Changed to Hash icon for Discord */}
                      Discord
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="telegram" className="border border-border rounded-md overflow-hidden">
                    <div className="bg-[#1E2734] p-3 border-b border-gray-700">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-crypto-green flex items-center justify-center mr-3">
                          <span className="text-black font-bold text-sm">CB</span>
                        </div>
                        <div>
                          <p className="font-medium">CryptoBroadcast</p>
                          <p className="text-xs text-gray-400">Channel</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#17212B] p-4 min-h-[240px]">
                      <div className="mb-2">
                        <span className="font-bold">{announcementData.title}</span>
                      </div>
                      <p className="text-gray-300">{announcementData.content}</p>
                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="bg-blue-500 hover:bg-blue-600 text-white border-0">
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="discord" className="border border-border rounded-md overflow-hidden">
                    <div className="bg-[#2F3136] p-3 border-b border-gray-700">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-crypto-green flex items-center justify-center mr-3">
                          <span className="text-black font-bold text-sm">CB</span>
                        </div>
                        <div>
                          <p className="font-medium">CryptoBroadcast</p>
                          <p className="text-xs text-gray-400">#announcements</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#36393F] p-4 min-h-[240px]">
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-crypto-green flex items-center justify-center mr-3">
                          <span className="text-black font-bold text-sm">CB</span>
                        </div>
                        <div>
                          <p className="font-medium">CryptoBroadcast <span className="text-xs text-gray-400">Today at 12:30 PM</span></p>
                          <div className="mt-1 p-3 border-l-4 border-gray-500 bg-[#2F3136] rounded">
                            <p className="font-bold">{announcementData.title}</p>
                            <p className="mt-1">{announcementData.content}</p>
                          </div>
                          <div className="mt-3">
                            <Button variant="outline" size="sm" className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-0">
                              Learn More
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="whatsapp" className="border border-border rounded-md overflow-hidden">
                    <div className="bg-[#1F2C34] p-3 border-b border-gray-700">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-crypto-green flex items-center justify-center mr-3">
                          <span className="text-black font-bold text-sm">CB</span>
                        </div>
                        <div>
                          <p className="font-medium">CryptoBroadcast Community</p>
                          <p className="text-xs text-gray-400">You, +25 more</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0B141A] p-4 min-h-[240px]">
                      <div className="flex justify-end mb-4">
                        <div className="max-w-[80%] bg-[#025C4B] rounded-lg p-3">
                          <p className="font-medium">{announcementData.title}</p>
                          <p className="text-sm mt-1">{announcementData.content}</p>
                          <p className="text-xs text-right mt-1 text-gray-300">12:30 PM ✓✓</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="max-w-[80%] bg-[#025C4B] rounded-lg p-3">
                          <p>Learn more: https://example.com/apex</p>
                          <p className="text-xs text-right mt-1 text-gray-300">12:31 PM ✓✓</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CircleUser className="h-5 w-5" />
                  <span>Selected Communities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcementData.communities.map((community) => (
                    <div key={community.id} className="flex justify-between items-center p-4 border border-border rounded-md">
                      <div>
                        <h3 className="font-medium">{community.name}</h3>
                        <div className="flex items-center mt-1">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">{community.platform}</span>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{community.members.toLocaleString()} members</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-crypto-green">${community.price}</p>
                        <button className="text-xs text-crypto-blue hover:underline mt-1">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50 sticky top-20">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcementData.communities.map((community) => (
                    <div key={community.id} className="flex justify-between">
                      <span className="text-muted-foreground">{community.name}</span>
                      <span>${community.price}</span>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totalCost}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee (10%)</span>
                    <span>${platformFee}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-xl text-crypto-green">${grandTotal}</span>
                  </div>
                </div>

                {!isWalletConnected ? (
                  <Button
                    className="w-full mt-6 flex items-center justify-center border-crypto-green text-crypto-green hover:text-crypto-green hover:bg-crypto-green/10"
                    variant="outline"
                    onClick={handleWalletConnect}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting Wallet
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <div className="mt-6 p-3 bg-muted rounded-md flex items-center">
                      <CheckCircle2 className="text-crypto-green h-5 w-5 mr-2" />
                      <div>
                        <p className="text-sm font-medium">Wallet Connected</p>
                        <p className="text-xs text-muted-foreground">0x7F...23Ab</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button
                        className="flex-1 bg-crypto-blue hover:bg-crypto-blue/90"
                        onClick={handlePayment}
                        disabled={isPaying}
                      >
                        Pay with USDT
                      </Button>
                      <Button
                        className="flex-1 bg-crypto-violet hover:bg-crypto-violet/90"
                        onClick={handlePayment}
                        disabled={isPaying}
                      >
                        Pay with COPPERX
                      </Button>
                    </div>
                    
                    {isPaying && (
                      <div className="mt-4 flex items-center justify-center text-sm">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing payment...
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border pt-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/announcements/create')}
                >
                  Back
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => navigate('/announcements')}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AnnouncementPreview;
