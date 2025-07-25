import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useWallet } from '../contexts/WalletContext';
import { formatAddress } from '../utils/format';

const Header: React.FC = () => {
  const router = useRouter();
  const { isConnected, walletAddress, connect, disconnect } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleConnectWallet = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnectWallet = () => {
    disconnect();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get('search') as string;
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="bg-black/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container-responsive">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold">Z</span>
            </div>
            <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              ZDrive
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={`text-white hover:text-blue-400 transition-colors ${
                router.pathname === '/' ? 'text-blue-400' : ''
              }`}
            >
              Home
            </Link>
            <Link 
              href="/upload" 
              className={`text-white hover:text-blue-400 transition-colors ${
                router.pathname === '/upload' ? 'text-blue-400' : ''
              }`}
            >
              Upload
            </Link>
            <Link 
              href="/profile" 
              className={`text-white hover:text-blue-400 transition-colors ${
                router.pathname === '/profile' ? 'text-blue-400' : ''
              }`}
            >
              Profile
            </Link>
          </nav>

          {/* Search */}
          <div className="hidden lg:flex items-center space-x-4">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  name="search"
                  type="text"
                  placeholder="Search videos..."
                  className="bg-white/10 text-white placeholder-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="ml-2 text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-white/60 hover:text-white"
              >
                🔍
              </button>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <span className="text-blue-400">💰</span>
                  <span className="text-white text-sm">
                    {formatAddress(walletAddress || '')}
                  </span>
                </div>
                <button
                  onClick={handleDisconnectWallet}
                  className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm hover:bg-white/20"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Connect Wallet
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-white"
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className={`text-white hover:text-blue-400 transition-colors ${
                  router.pathname === '/' ? 'text-blue-400' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/upload" 
                className={`text-white hover:text-blue-400 transition-colors ${
                  router.pathname === '/upload' ? 'text-blue-400' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Upload
              </Link>
              <Link 
                href="/profile" 
                className={`text-white hover:text-blue-400 transition-colors ${
                  router.pathname === '/profile' ? 'text-blue-400' : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="pt-4">
                <input
                  name="search"
                  type="text"
                  placeholder="Search videos..."
                  className="w-full bg-white/10 text-white placeholder-white/50 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </form>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;