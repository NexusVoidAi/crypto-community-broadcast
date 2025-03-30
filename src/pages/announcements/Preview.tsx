
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Send, Hash, MessageSquare, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import CopperXPayment from '@/components/payments/CopperXPayment';

interface Announcement {
  id: string;
  title: string;
  content: string;
  cta_text: string | null;
  cta_url: string | null;
  media_url: string | null;
  status: string;
  created_at: string;
}

interface Community {
  id: string;
  name: string;
  platform: string;
  price_per_announcement: number;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

const Preview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  
  // Get the announcement ID from the URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const announcementId = searchParams.get('id');
  
  useEffect(() => {
    const fetchPreviewData = async () => {
      if (!announcementId) {
        toast.error('No announcement specified');
        navigate('/announcements/create');
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Fetch the announcement
        const { data: announcementData, error: announcementError } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', announcementId)
          .single();
          
        if (announcementError) throw announcementError;
        setAnnouncement(announcementData);
        
        // Fetch the linked communities
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('announcement_communities')
          .select(`
            community:communities (
              id,
              name,
              platform,
              price_per_announcement
            )
          `)
          .eq('announcement_id', announcementId);
          
        if (communitiesError) throw communitiesError;
        setCommunities(communitiesData.map((item: any) => item.community));
        
        // Fetch the payment
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('announcement_id', announcementId)
          .maybeSingle();
          
        if (paymentError) throw paymentError;
        setPayment(paymentData);
        
        // Check if payment is already complete
        if (paymentData && paymentData.status === 'PAID') {
          setPaymentComplete(true);
        }
      } catch (error: any) {
        toast.error(`Error loading preview: ${error.message}`);
        navigate('/announcements/create');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPreviewData();
  }, [announcementId, navigate]);
  
  const handlePaymentSuccess = async (txHash: string) => {
    setPaymentComplete(true);
    setShowPayment(false);
    toast.success('Your announcement has been paid for and is now awaiting approval');
    
    // Reload payment data
    if (announcementId) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('announcement_id', announcementId)
        .maybeSingle();
        
      if (data) setPayment(data);
    }
  };
  
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'TELEGRAM':
        return <Send className="h-5 w-5 text-blue-400" />;
      case 'DISCORD':
        return <Hash className="h-5 w-5 text-indigo-400" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-5 w-5 text-green-400" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }
  
  if (!announcement || !communities.length) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Announcement not found</h2>
            <p className="text-muted-foreground mb-6">The announcement you're looking for doesn't exist or has been removed.</p>
            <Button 
              onClick={() => navigate('/announcements/create')}
              className="bg-crypto-blue hover:bg-crypto-blue/90"
            >
              Create New Announcement
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/announcements/create')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Editor
        </Button>
        
        {showPayment ? (
          <div className="max-w-md mx-auto">
            <CopperXPayment 
              amount={payment?.amount || communities.reduce((sum, c) => sum + c.price_per_announcement, 0)}
              currency={payment?.currency || "USDT"}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPayment(false)}
              announcementId={announcementId || undefined}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border border-border/50 bg-crypto-darkgray/50">
                <CardHeader>
                  <CardTitle>Announcement Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-6 border border-border/50 rounded-md bg-crypto-dark">
                    <div className="mb-4">
                      <Badge variant="outline" className="mb-2 bg-crypto-blue/10 text-crypto-blue border-crypto-blue/20">
                        PREVIEW
                      </Badge>
                      <h2 className="text-2xl font-bold">{announcement.title}</h2>
                    </div>
                    
                    <div className="prose prose-invert max-w-none mb-6">
                      <p className="text-gray-300">{announcement.content}</p>
                    </div>
                    
                    {announcement.media_url && (
                      <div className="mb-6 rounded-md overflow-hidden">
                        <img 
                          src={announcement.media_url} 
                          alt="Announcement media" 
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    
                    {announcement.cta_text && announcement.cta_url && (
                      <div className="mb-2">
                        <Button className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
                          {announcement.cta_text}
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      This is how your announcement will appear to the community.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="border border-border/50 bg-crypto-darkgray/50">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Selected Communities</h3>
                    <div className="space-y-3">
                      {communities.map((community) => (
                        <div 
                          key={community.id} 
                          className="flex items-center justify-between p-3 border border-border/50 rounded-md"
                        >
                          <div className="flex items-center">
                            {getPlatformIcon(community.platform)}
                            <span className="ml-2 font-medium">{community.name}</span>
                          </div>
                          <span className="text-crypto-green">${community.price_per_announcement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${communities.reduce((sum, c) => sum + c.price_per_announcement, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fee</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-crypto-green">${communities.reduce((sum, c) => sum + c.price_per_announcement, 0)} USDT</span>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    {paymentComplete ? (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4 text-center">
                        <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <h3 className="font-medium text-green-500 mb-1">Payment Complete</h3>
                        <p className="text-sm text-muted-foreground">
                          Your announcement has been submitted and is awaiting approval.
                        </p>
                        <Button
                          className="mt-4 w-full bg-crypto-blue hover:bg-crypto-blue/90"
                          onClick={() => navigate('/')}
                        >
                          Go to Dashboard
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full bg-crypto-blue hover:bg-crypto-blue/90"
                        onClick={() => setShowPayment(true)}
                      >
                        Proceed to Payment
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-center">
                    By proceeding, you agree to our Terms of Service and Privacy Policy.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Preview;
