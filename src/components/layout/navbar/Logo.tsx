
import { Link } from 'react-router-dom';

export const Logo = () => {
  return (
    <Link to="/" className="flex-shrink-0">
      <div className="flex items-center">
        <div className="relative w-8 h-8 overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
          </div>
        </div>
        <span className="text-foreground font-space font-bold text-xl ml-3">ACHO AI</span>
      </div>
    </Link>
  );
};
