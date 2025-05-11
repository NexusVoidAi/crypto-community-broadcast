
import { Link } from 'react-router-dom';

export const Logo = () => {
  return (
    <Link to="/" className="flex-shrink-0">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/acho-ai-logo.png" 
          alt="Acho AI Logo" 
          className="h-8 w-auto"
        />
        <span className="text-white font-space font-bold text-xl ml-3">ACHO AI</span>
      </div>
    </Link>
  );
};
