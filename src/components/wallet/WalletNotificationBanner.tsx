
import React from 'react';
import { Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAccount } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { useConnectModal } from '@rainbow-me/rainbowkit';

const WalletNotificationBanner: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(true);
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useAccount();
  
  // Don't show banner if wallet is already connected
  if (!isVisible || isConnected) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-blue-500 p-3 shadow-lg animate-fade-in">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Wallet className="h-5 w-5 text-white" />
          <p className="text-sm font-medium text-white">
            Connect your wallet to access all features (Polygon Network)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={openConnectModal} 
            size="sm" 
            className="bg-white text-purple-600 hover:bg-white/90 transition-all"
          >
            Connect Wallet
          </Button>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalletNotificationBanner;
