
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, CreditCard, Check, QrCode, Copy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useCopperX } from '@/hooks/useCopperX';

interface CopperXPaymentProps {
  amount: number;
  currency: string;
  onSuccess: (txHash: string) => void;
  onCancel: () => void;
  announcementId?: string;
}

const CopperXPayment: React.FC<CopperXPaymentProps> = ({ 
  amount, 
  currency,
  onSuccess,
  onCancel,
  announcementId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [walletAddress] = useState(`0xc0pp3rx${Math.random().toString(16).substring(2, 18)}`);
  
  const { address, isConnected } = useAccount();
  const { createCheckoutSession, redirectToCheckout, isLoading: isCheckoutLoading } = useCopperX();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };
  
  const handleCopperXCheckout = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    
    try {
      // Create checkout session
      const successUrl = `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&announcement_id=${announcementId || ''}`;
      
      const session = await createCheckoutSession({
        amount: amount,
        currency: currency,
        productName: "Announcement Campaign",
        productDescription: "Payment for crypto announcement distribution",
        successUrl: successUrl
      });
      
      if (session) {
        // Store checkout session details in database if needed
        if (announcementId) {
          const { error } = await supabase
            .from('payments')
            .update({
              payment_gateway: 'COPPERX',
              payment_session_id: session.id,
              status: 'PENDING'
            })
            .eq('announcement_id', announcementId);
            
          if (error) throw error;
        }
        
        // Redirect to checkout
        redirectToCheckout(session);
      }
    } catch (error: any) {
      toast.error(`Payment failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would connect to CopperX API
      // For demo purposes, we'll simulate a successful payment after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock transaction hash
      const txHash = `0x${Math.random().toString(16).substring(2, 42)}`;
      
      if (announcementId) {
        // Update payment status in the database
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
            payment_status: 'PAID',
            status: 'PUBLISHED'
          })
          .eq('id', announcementId);
          
        if (announcementError) throw announcementError;
      }
      
      toast.success('Payment successful!');
      setPaymentComplete(true);
      onSuccess(txHash);
    } catch (error: any) {
      toast.error(`Payment failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="border border-border/50 bg-crypto-darkgray/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          CopperX Crypto Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {paymentComplete ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4 text-center">
            <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium text-green-500 mb-1">Payment Complete</h3>
            <p className="text-sm text-muted-foreground">
              Your crypto payment has been processed successfully.
            </p>
          </div>
        ) : showQrCode ? (
          <div className="space-y-4">
            <div className="border border-border rounded-md p-6 flex flex-col items-center justify-center">
              <QrCode className="h-32 w-32 mb-4" />
              <p className="text-sm font-medium mb-1">Scan to pay {amount} {currency}</p>
              <p className="text-xs text-muted-foreground mb-4">
                Send exactly {amount} {currency} to complete payment
              </p>
              <div className="relative text-xs bg-crypto-darkgray p-2 rounded w-full break-all text-center font-mono">
                {walletAddress}
                <button 
                  onClick={() => copyToClipboard(walletAddress)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handlePayment()}
            >
              I've sent the payment
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setShowQrCode(false)}
            >
              Back to options
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{amount} {currency}</span>
              </div>
              <Separator className="my-3" />
              <div className="text-xs text-muted-foreground">
                Payment processed securely via CopperX
              </div>
            </div>
            
            <div className="bg-crypto-darkgray/70 p-4 rounded-md border border-border/50">
              <h3 className="text-sm font-medium mb-3">Connect your wallet</h3>
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
                              className="w-full bg-crypto-blue hover:bg-crypto-blue/90"
                            >
                              Connect Wallet
                            </Button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <Button 
                              onClick={openChainModal}
                              variant="destructive"
                              className="w-full"
                            >
                              Wrong network
                            </Button>
                          );
                        }

                        return (
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between rounded-md bg-crypto-dark p-2 px-3">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium">
                                  {account.displayName}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={openAccountModal}
                                className="text-xs"
                              >
                                Change
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
            
            <Button
              className="w-full bg-crypto-green hover:bg-crypto-green/90"
              disabled={isLoading || isCheckoutLoading || !isConnected}
              onClick={handleCopperXCheckout}
            >
              {isLoading || isCheckoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  Pay with CopperX <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            <Button
              className="w-full bg-crypto-blue hover:bg-crypto-blue/90"
              disabled={isLoading}
              onClick={handlePayment}
            >
              Pay with Demo Mode
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground text-center">
          By proceeding, you agree to our Terms of Service and Privacy Policy.
        </div>
      </CardContent>
    </Card>
  );
};

export default CopperXPayment;
