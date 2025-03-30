
import React from 'react';
import Navbar from './Navbar';

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  // Mock user data for now - in a real app, this would come from auth context
  const mockUser = {
    name: 'Demo User',
    email: 'demo@cryptobroadcast.io',
  };

  return (
    <div className="min-h-screen bg-crypto-dark text-white">
      <Navbar user={mockUser} onSignOut={() => console.log('Sign out clicked')} />
      <div className="pt-16 pb-12"> {/* pt-16 to account for the fixed navbar */}
        <main>{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
