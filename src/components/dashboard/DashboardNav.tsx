
import React from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Megaphone, 
  BrainCircuit,
  ShoppingBag,
  CreditCard,
  Settings
} from 'lucide-react';

interface DashboardNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardNav: React.FC<DashboardNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/' },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone, path: '/campaigns' },
    { id: 'validation', label: 'AI Validation', icon: BrainCircuit, path: '/validation' },
    { id: 'marketplace', label: 'Community Marketplace', icon: ShoppingBag, path: '/communities' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/payments' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/profile' },
  ];

  return (
    <div className="mb-6 overflow-x-auto scrollbar-hide">
      <div className="flex justify-start space-x-1 border-b border-border/10 pb-3">
        {navItems.map((item) => (
          <Link 
            key={item.id}
            to={item.path}
            className={`flex items-center px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
              activeTab === item.id ? 
              'bg-crypto-green/10 text-crypto-green border border-crypto-green/20' : 
              'hover:bg-crypto-darkgray/60 text-gray-400 hover:text-white'
            }`}
            onClick={(e) => {
              if (item.id !== 'overview') {
                e.preventDefault();
              }
              setActiveTab(item.id);
            }}
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardNav;
