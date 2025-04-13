
import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Shield,
  Bell
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState(2);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Announcements', icon: MessageSquare, path: '/announcements/create' },
    { label: 'Communities', icon: Users, path: '/communities' },
  ];

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();
          
        if (data && data.account_type === 'admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const getInitials = () => {
    if (!profile?.name) return 'U';
    return profile.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-crypto-dark text-white">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed md:sticky top-0 h-screen w-[280px] bg-crypto-darkgray border-r border-border/10 z-40 transition-all duration-300 flex flex-col",
          isMobile && (sidebarOpen ? "left-0" : "-left-[280px]")
        )}
      >
        <div className="p-5 border-b border-border/10 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-md bg-crypto-green flex items-center justify-center">
              <span className="text-crypto-dark font-bold text-lg">AA</span>
            </div>
            <span className="font-bold text-xl tracking-tight">ACHO AI</span>
          </Link>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={toggleSidebar}
            >
              <X size={20} />
            </Button>
          )}
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1.5 py-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  location.pathname === item.path ? 
                  "bg-crypto-dark/50 text-crypto-green" : 
                  "text-gray-300 hover:bg-crypto-dark/30 hover:text-white"
                )}
                onClick={closeSidebar}
              >
                <item.icon className={cn("h-5 w-5", 
                  location.pathname === item.path && "text-crypto-green"
                )} />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  location.pathname === '/admin' ? 
                  "bg-crypto-dark/50 text-crypto-green" : 
                  "text-gray-300 hover:bg-crypto-dark/30 hover:text-white"
                )}
                onClick={closeSidebar}
              >
                <Shield className={cn("h-5 w-5", 
                  location.pathname === '/admin' && "text-crypto-green"
                )} />
                <span>Admin</span>
              </Link>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-border/10">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-crypto-dark/20 transition-colors">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-crypto-blue/20 text-crypto-blue">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-10 bg-crypto-dark/80 backdrop-blur-md border-b border-border/10 flex md:hidden items-center p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-3" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-md bg-crypto-green flex items-center justify-center">
              <span className="text-crypto-dark font-bold text-xs">AA</span>
            </div>
            <h1 className="text-lg font-bold">ACHO AI</h1>
          </div>
          <div className="ml-auto flex items-center">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-crypto-green text-xs text-crypto-dark">
                  {notifications}
                </Badge>
              )}
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
