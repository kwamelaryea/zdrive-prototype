import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useWallet } from '../contexts/WalletContext';

const BottomNav: React.FC = () => {
  const router = useRouter();
  const { isConnected } = useWallet();

  const navItems = [
    {
      path: '/',
      icon: '🏠',
      label: 'Home',
    },
    {
      path: '/search',
      icon: '🔍',
      label: 'Discover',
    },
    {
      path: '/upload',
      icon: '📤',
      label: 'Upload',
    },
    {
      path: '/profile',
      icon: '👤',
      label: 'Profile',
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-white/10">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = router.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-400 bg-blue-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Wallet Status Indicator */}
        <div className="flex flex-col items-center space-y-1 p-2">
          <div className={`h-5 w-5 rounded-full border-2 ${
            isConnected 
              ? 'bg-green-500 border-green-500' 
              : 'bg-red-500 border-red-500'
          }`} />
          <span className="text-xs font-medium text-white/60">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;