
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCopperX } from '@/hooks/useCopperX';
import AppLayout from '@/components/layout/AppLayout';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [announcement, setAnnouncement] = useState<any>(null);
  
  const sessionId = searchParams.get('session_id');
  const announcementId = searchParams.get('announcement_id');
  
  const { verifyPayment } = useCopperX();
  
  useEffect(() => {
    const verifyAndUpdatePayment = async () => {
      if (!sessionId || !announcementId) {
        setIsVerifying(false);
        return;
      }
      
      try {
        // Verify payment with CopperX
        const sessionDetails = await verifyPayment(sessionId);
        setPaymentDetails(sessionDetails);
        
        // Get announcement details
        const { data: announcementData, error: announcementFetchError } = await supabase
          .from('announcements')
          .select('*')
          .eq('id', announcementId)
          .single();
          
        if (announcementFetchError) throw announcementFetchError;
        setAnnouncement(announcementData);
        
        if (sessionDetails?.status === 'complete') {
          // Update payment status in database
          const { error: paymentError } = await supabase
            .from('payments')
            .update({
              status: 'PAID',
              transaction_hash: sessionDetails.paymentIntent?.transactions?.[0]?.txHash || sessionId
            })
            .eq('announcement_id', announcementId);
            
          if (paymentError) throw paymentError;
          
          // Update announcement status
          const { error: announcementError } = await supabase
            .from('announcements')
            .update({
              payment_status: 'PAID',
              status: 'PUBLISHED'
            })
            .eq('id', announcementId);
            
          if (announcementError) throw announcementError;
          
          // Update community earnings for the announcement communities
          await updateCommunityEarnings(announcementId);
          
          toast.success('Payment confirmed successfully!');
        }
      } catch (error: any) {
        console.error('Error verifying payment:', error);
        toast.error(`Failed to verify payment: ${error.message}`);
      } finally {
        setIsVerifying(false);
      }
    };
    
    const updateCommunityEarnings = async (announcementId: string) => {
      try {
        // Get the communities linked to this announcement
        const { data: communityData, error: communityError } = await supabase
          .from('announcement_communities')
          .select('community_id')
          .eq('announcement_id', announcementId);
          
        if (communityError) throw communityError;
        
        // Get payment amount
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('id, amount')  // Updated to select both id and amount
          .eq('announcement_id', announcementId)
          .single();
          
        if (paymentError) throw paymentError;
        
        // If we have communities and payment data
        if (communityData && communityData.length > 0 && paymentData) {
          // Get communities with their prices
          const communityIds = communityData.map((item: any) => item.community_id);
          const { data: communities, error: communitiesError } = await supabase
            .from('communities')
            .select('id,price_per_announcement,owner_id')
            .in('id', communityIds);
            
          if (communitiesError) throw communitiesError;
          
          // Calculate community payout amounts and create earnings records
          if (communities) {
            const platformFee = 1; // Default platform fee
            const totalAmount = Number(paymentData.amount);
            const communityFee = totalAmount - platformFee;
            
            // If multiple communities, split the amount between them
            const amountPerCommunity = communityFee / communities.length;
            
            // Create earnings records for each community
            for (const community of communities) {
              const { error: earningsError } = await supabase
                .from('community_earnings')
                .insert({
                  community_id: community.id,
                  amount: amountPerCommunity,
                  payment_id: paymentData.id,  // Now properly typed
                  currency: 'USDT'
                });
                
              if (earningsError) throw earningsError;
            }
          }
        }
      } catch (error: any) {
        console.error('Error updating community earnings:', error);
      }
    };
    
    verifyAndUpdatePayment();
  }, [sessionId, announcementId, verifyPayment]);
  
  if (isVerifying) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-md px-4 py-16">
          <Card className="border border-border/50 bg-crypto-darkgray/50">
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <Loader2 className="h-12 w-12 animate-spin text-crypto-blue mb-4" />
              <p className="text-center">Verifying payment...</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto max-w-md px-4 py-16">
        <Card className="border border-border/50 bg-crypto-darkgray/50">
          <CardHeader className="text-center">
            <div className="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-xl">Payment Successful</CardTitle>
            <CardDescription>
              Your crypto payment has been processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md bg-crypto-dark p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono">{sessionId ? sessionId.substring(0, 8) + '...' : 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-green-500">Completed</span>
                </div>
                {paymentDetails && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span>
                      {paymentDetails.amountTotal / 100000000} {paymentDetails.currency?.toUpperCase() || 'USDT'}
                    </span>
                  </div>
                )}
                {announcement && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Announcement:</span>
                    <span className="truncate max-w-[200px]">
                      {announcement.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your announcement is now being processed and will be published soon.
                You'll get notified once it's live in the selected communities.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/dashboard')}  
              className="w-full bg-crypto-blue hover:bg-crypto-blue/90"
            >
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PaymentSuccess;

