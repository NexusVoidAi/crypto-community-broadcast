
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

interface CheckoutSessionOptions {
  amount: number;
  currency: string;
  productName: string;
  productDescription: string;
  successUrl: string;
  cancelUrl?: string;
}

interface CheckoutSession {
  id: string;
  url: string;
  amountTotal: string;
  currency: string;
  status: string;
}

export const useCopperX = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<CheckoutSession | null>(null);

  // In a production app, this would be handled by a backend service
  // For demo purposes, we're making the API call directly from the frontend
  const createCheckoutSession = async (options: CheckoutSessionOptions) => {
    setIsLoading(true);
    try {
      // Convert to smallest unit (8 decimals)
      const unitAmount = Math.round(options.amount * 100000000).toString();
      
      // In a real app, you would call your backend endpoint that would make this request
      // with the API key safely stored on the server
      const response = await axios.post(
        'https://api.copperx.dev/api/v1/checkout/sessions',
        {
          successUrl: options.successUrl,
          cancelUrl: options.cancelUrl || window.location.origin,
          lineItems: {
            data: [
              {
                priceData: {
                  currency: options.currency.toLowerCase(),
                  unitAmount: unitAmount,
                  productData: {
                    name: options.productName,
                    description: options.productDescription
                  }
                }
              }
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_COPPERX_API_KEY || 'demo-key'}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSession(response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(`Payment initialization failed: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToCheckout = (session: CheckoutSession) => {
    if (session && session.url) {
      window.location.href = session.url;
    } else {
      toast.error('Invalid checkout session');
    }
  };

  // Verify a payment (typically done on the backend)
  const verifyPayment = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://api.copperx.dev/api/v1/checkout/sessions/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_COPPERX_API_KEY || 'demo-key'}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    session,
    createCheckoutSession,
    redirectToCheckout,
    verifyPayment
  };
};
