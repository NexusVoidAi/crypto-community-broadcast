
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  Wallet, 
  LogOut, 
  Menu, 
  X,
  User,
  Settings,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

type User = {
  name: string;
  email: string;
  avatarUrl?: string;
};

type NavbarProps = {
  user?: User;
  onSignOut?: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ user, onSignOut }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Announcements', path: '/announcements' },
    { name: 'Communities', path: '/communities' },
    { name: 'Analytics', path: '/analytics' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-crypto-dark/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-crypto-green flex items-center justify-center mr-2">
                  <span className="text-black font-bold text-sm">CB</span>
                </div>
                <span className="text-white font-space font-bold text-xl">CryptoBroadcast</span>
              </div>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive(item.path)
                        ? "bg-muted text-white"
                        : "text-gray-300 hover:bg-muted/50 hover:text-white"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="outline" className="border-crypto-green text-crypto-green hover:text-crypto-green hover:bg-crypto-green/10">
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Connect Wallet</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                    <Bell className="h-5 w-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback className="bg-crypto-blue">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" className="text-gray-300 hover:text-white">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
                    <Link to="/register">Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-crypto-darkgray border-b border-border">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  isActive(item.path)
                    ? "bg-muted text-white"
                    : "text-gray-300 hover:bg-muted/50 hover:text-white"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <>
                <div className="pt-4 pb-3 border-t border-border">
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="bg-crypto-blue">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-white">{user.name}</div>
                      <div className="text-sm font-medium text-gray-400">{user.email}</div>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-auto text-gray-400">
                      <Bell className="h-6 w-6" />
                    </Button>
                  </div>
                  <div className="mt-3 px-2 space-y-1">
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-muted/50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-muted/50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        onSignOut?.();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-muted/50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
                <Button className="w-full mt-4 flex items-center justify-center bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Connect Wallet</span>
                </Button>
              </>
            ) : (
              <div className="pt-4 pb-3 border-t border-border">
                <div className="space-y-2 px-5">
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                  </Button>
                  <Button asChild className="w-full justify-center bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
