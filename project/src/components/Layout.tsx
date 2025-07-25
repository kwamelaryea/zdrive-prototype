import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="pt-16 pb-20 md:pb-0">
        {children}
      </main>
      
      {/* Bottom Navigation (Mobile) */}
      <BottomNav />
    </div>
  );
};

export default Layout;