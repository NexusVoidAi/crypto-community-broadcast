
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Logo } from './navbar/Logo';
import { NavMenu } from './navbar/NavMenu';
import { UserMenu } from './navbar/UserMenu';

type User = {
  name: string;
  email: string;
  avatarUrl?: string;
};

type NavbarProps = {
  user?: User;
  onSignOut?: () => void;
};

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Announcements', path: '/announcements' },
  { name: 'Communities', path: '/communities' },
  { name: 'Analytics', path: '/analytics' },
];

const Navbar: React.FC<NavbarProps> = ({ user, onSignOut }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-crypto-dark/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Logo />
            <NavMenu items={navItems} />
          </div>
          
          <UserMenu user={user} onSignOut={onSignOut} />
          
          <div className="md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-crypto-darkgray border-b border-border">
            <NavMenu 
              items={navItems} 
              mobile={true} 
              onItemClick={() => setMobileMenuOpen(false)} 
            />
            <UserMenu 
              user={user} 
              onSignOut={onSignOut} 
              mobile={true} 
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
