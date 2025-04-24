
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

type NavMenuItem = {
  name: string;
  path: string;
};

type NavMenuProps = {
  items: NavMenuItem[];
  mobile?: boolean;
  onItemClick?: () => void;
};

export const NavMenu = ({ items, mobile, onItemClick }: NavMenuProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={mobile ? "" : "hidden md:block ml-10"}>
      <div className={cn(
        "flex",
        mobile ? "flex-col space-y-1" : "items-center space-x-4"
      )}>
        {items.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              mobile ? "block px-3 py-2 rounded-md text-base font-medium" : "px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive(item.path)
                ? "bg-muted text-white"
                : "text-gray-300 hover:bg-muted/50 hover:text-white"
            )}
            onClick={onItemClick}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
};
