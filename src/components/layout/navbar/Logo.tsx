
import { Link } from 'react-router-dom';

export const Logo = () => {
  return (
    <Link to="/" className="flex-shrink-0">
      <div className="flex items-center">
        <img 
          src="https://res.cloudinary.com/db62usi2c/image/upload/v1746956709/image_37_e9apq9.png" 
          alt="Acho AI Logo" 
          className="h-8 w-auto"
        />
        <span className="text-white font-space font-bold text-xl ml-3">ACHO AI</span>
      </div>
    </Link>
  );
};
