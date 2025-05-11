
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Megaphone, 
  CreditCard,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface DashboardNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardNav: React.FC<DashboardNavProps> = ({ activeTab, setActiveTab }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone, path: '/dashboard' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/dashboard' },
  ];

  return (
    <div className="mb-6 overflow-x-auto scrollbar-hide">
      <div className="flex justify-start space-x-1 border-b border-border/10 py-1 px-1 rounded-xl min-w-max">
        {navItems.map((item) => (
          <Link 
            key={item.id}
            to={item.path}
            className={cn(
              "flex items-center px-4 py-2.5 rounded-lg transition-all duration-200",
              isMobile ? "min-w-[120px] justify-center" : "",
              activeTab === item.id ? 
              "bg-crypto-green/10 text-crypto-green border border-crypto-green/20 shadow-sm shadow-crypto-green/10 translate-y-[-2px]" : 
              "hover:bg-crypto-darkgray/60 text-gray-400 hover:text-white"
            )}
            onClick={(e) => {
              setActiveTab(item.id);
              if (item.id !== 'overview') {
                // Prevent default only for non-overview tabs
                e.preventDefault();
              }
            }}
          >
            <item.icon className={`h-4 w-4 ${isMobile ? '' : 'mr-2'} ${activeTab === item.id ? 'text-crypto-green' : ''}`} />
            {!isMobile || item.id === activeTab ? item.label : ''}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardNav;
