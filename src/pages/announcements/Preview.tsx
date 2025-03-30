
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, ArrowLeft, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import CopperXPayment from '@/components/payments/CopperXPayment';

const Preview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const announcementId = searchParams.get('id');
  const [announcement, setAnnouncement] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(1);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!announcementId) {
        toast.error('Announcement ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the announcement
        const { data: announcementData, error: announcementError } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', announcementId)
          .single();

        if (announcementError) throw announcementError;
        setAnnouncement(announcementData);

        // Fetch communities linked to this announcement
        const { data: communityData, error: communityError } = await supabase
          .from('announcement_communities')
          .select('community_id')
          .eq('announcement_id', announcementId);

        if (communityError) throw communityError;

        // Fetch community details
        const communityIds = communityData.map((item: any) => item.community_id);
        if (communityIds.length > 0) {
          const { data: communitiesData, error: communitiesError } = await supabase
            .from('communities')
            .select('*')
            .in('id', communityIds);

          if (communitiesError) throw communitiesError;
          setCommunities(communitiesData);
          
          // Calculate total cost from communities
          const communityCost = communitiesData.reduce((sum: number, community: any) => 
            sum + Number(community.price_per_announcement), 0);
          
          // Fetch platform fee
          const { data: platformSettings } = await supabase
            .from('platform_settings')
            .select('platform_fee')
            .maybeSingle();
            
          const fee = platformSettings?.platform_fee || 1;
          setPlatformFee(fee);
          setTotalCost(communityCost + fee);
        }
      } catch (error: any) {
        toast.error(`Error fetching announcement: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncement();
  }, [announcementId]);

  const handlePaymentSuccess = async (txHash: string) => {
    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'PAID',
          transaction_hash: txHash
        })
        .eq('announcement_id', announcementId);
        
      if (paymentError) throw paymentError;
      
      // Update announcement status
      const { error: announcementError } = await supabase
        .from('announcements')
        .update({
          status: 'PUBLISHED',
          payment_status: 'PAID'
        })
        .eq('id', announcementId);
        
      if (announcementError) throw announcementError;
      
      toast.success('Payment successful! Your announcement will be published soon.');
      navigate('/');
    } catch (error: any) {
      toast.error(`Error processing payment: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">Loading preview...</div>
      </AppLayout>
    );
  }

  if (!announcement) {
    return (
      <AppLayout>
        <div className="flex h-screen items-center justify-center">Announcement not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        {showPayment ? (
          <div className="max-w-md mx-auto">
            <Button 
              variant="outline" 
              className="mb-4"
              onClick={() => setShowPayment(false)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Preview
            </Button>
            
            <CopperXPayment
              amount={totalCost}
              currency="USDT"
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPayment(false)}
              announcementId={announcementId}
            />
          </div>
        ) : (
          <Card className="border border-border/50 glassmorphism bg-crypto-darkgray/50 max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Announcement Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{announcement.title}</h2>
                <p className="text-muted-foreground">{announcement.content}</p>
                {announcement.cta_text && announcement.cta_url && (
                  <Button asChild>
                    <a href={announcement.cta_url} target="_blank" rel="noopener noreferrer">
                      {announcement.cta_text}
                    </a>
                  </Button>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Selected Communities:</h3>
                {communities.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {communities.map((community) => (
                      <li key={community.id} className="text-muted-foreground">
                        <span className="flex items-center">
                          <Check className="h-4 w-4 mr-2 text-crypto-green" />
                          {community.name} ({community.platform}) - ${community.price_per_announcement}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No communities selected.</p>
                )}
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Communities Cost:</span>
                  <span>${(totalCost - platformFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Platform Fee:</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-crypto-green">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigate('/announcements/create')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Edit Announcement
              </Button>
              <Button 
                className="bg-crypto-green hover:bg-crypto-green/90"
                onClick={() => setShowPayment(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" /> Proceed to Payment
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Preview;
