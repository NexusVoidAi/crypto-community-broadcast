
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
import { Bell, Wallet, LogOut, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type User = {
  name: string;
  email: string;
  avatarUrl?: string;
};

type UserMenuProps = {
  user?: User;
  onSignOut?: () => void;
  mobile?: boolean;
};

export const UserMenu = ({ user, onSignOut, mobile }: UserMenuProps) => {
  if (!user) {
    return (
      <div className={cn(
        "space-x-4",
        mobile ? "space-y-2 px-5" : "flex items-center"
      )}>
        <Button asChild variant="ghost" className={cn(
          "text-gray-300 hover:text-white",
          mobile && "w-full justify-center"
        )}>
          <Link to="/login">Sign in</Link>
        </Button>
        <Button asChild className={cn(
          "bg-crypto-green text-crypto-dark hover:bg-crypto-green/90",
          mobile && "w-full justify-center"
        )}>
          <Link to="/register">Sign up</Link>
        </Button>
      </div>
    );
  }

  if (mobile) {
    return (
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
          >
            Your Profile
          </Link>
          <Link
            to="/settings"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-muted/50"
          >
            Settings
          </Link>
          <button
            onClick={onSignOut}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-muted/50"
          >
            Sign out
          </button>
        </div>
        <div className="px-5 pt-4">
          <Button className="w-full flex items-center justify-center bg-crypto-green text-crypto-dark hover:bg-crypto-green/90">
            <Wallet className="mr-2 h-4 w-4" />
            <span>Connect Wallet</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block">
      <div className="flex items-center space-x-4">
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
      </div>
    </div>
  );
};
