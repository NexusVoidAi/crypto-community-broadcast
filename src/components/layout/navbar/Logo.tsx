
import { Link } from 'react-router-dom';

export const Logo = () => {
  return (
    <Link to="/" className="flex-shrink-0">
      <div className="flex items-center">
        <div className="relative w-8 h-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1F2C] via-[#D946EF] to-[#9B87F5] shadow-lg transform skew-x-0">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </div>
        <span className="text-white font-space font-bold text-xl ml-3">ACHO AI</span>
      </div>
    </Link>
  );
};
