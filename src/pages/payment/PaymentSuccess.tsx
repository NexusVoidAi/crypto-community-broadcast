
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCopperX } from '@/hooks/useCopperX';
import AppLayout from '@/components/layout/AppLayout';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  const sessionId = searchParams.get('session_id');
  const announcementId = searchParams.get('announcement_id');
  
  const { verifyPayment } = useCopperX();
  
  useEffect(() => {
    const verifyAndUpdatePayment = async () => {
      if (!sessionId) return;
      
      try {
        // Verify payment with CopperX
        const sessionDetails = await verifyPayment(sessionId);
        setPaymentDetails(sessionDetails);
        
        if (sessionDetails?.status === 'complete' && announcementId) {
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
          
          toast.success('Payment confirmed successfully!');
        }
      } catch (error: any) {
        console.error('Error verifying payment:', error);
        toast.error(`Failed to verify payment: ${error.message}`);
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyAndUpdatePayment();
  }, [sessionId, announcementId, verifyPayment]);
  
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
                      {paymentDetails.amountTotal / 100000000} {paymentDetails.currency.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                Your announcement is now being processed and will be published soon.
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="w-full bg-crypto-blue hover:bg-crypto-blue/90 mt-2"
              >
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PaymentSuccess;
