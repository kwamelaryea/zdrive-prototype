import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Check if ArConnect is installed and auto-connect if previously connected
  useEffect(() => {
    const checkArConnect = async () => {
      if (!window.arweaveWallet) {
        console.warn('ArConnect not found. Please install ArConnect extension.');
        return;
      }

      try {
        // Check if already connected
        const permissions = await window.arweaveWallet.getPermissions();
        if (permissions.length > 0) {
          const address = await window.arweaveWallet.getActiveAddress();
          if (address) {
            setWalletAddress(address);
            setIsConnected(true);
            console.log('✅ ArConnect auto-connected:', address);
          }
        }
      } catch (error) {
        console.error('Failed to check ArConnect connection:', error);
      }
    };

    // Add a small delay to ensure ArConnect is loaded
    const timer = setTimeout(checkArConnect, 100);
    
    // Listen for ArConnect events
    window.addEventListener('arweaveWalletLoaded', checkArConnect);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('arweaveWalletLoaded', checkArConnect);
    };
  }, []);

  const connect = async () => {
    try {
      if (!window.arweaveWallet) {
        throw new Error('Please install ArConnect to use this feature.');
      }

      await window.arweaveWallet.connect([
        'ACCESS_ADDRESS',
        'SIGN_TRANSACTION',
        'DISPATCH'
      ]);

      const address = await window.arweaveWallet.getActiveAddress();
      if (!address) {
        throw new Error('Failed to get wallet address');
      }
      
      setWalletAddress(address);
      setIsConnected(true);
      
      console.log('✅ Connected to ArConnect:', address);
      toast.success('Connected to ArConnect!');
    } catch (error) {
      console.error('Failed to connect to ArConnect:', error);
      toast.error('Failed to connect: ' + (error as Error).message);
      throw error;
    }
  };

  const disconnect = () => {
    try {
      if (window.arweaveWallet && window.arweaveWallet.disconnect) {
        window.arweaveWallet.disconnect();
      }
    } catch (error) {
      console.warn('Error disconnecting ArConnect:', error);
    }
    
    setWalletAddress(null);
    setIsConnected(false);
    toast.success('Disconnected from wallet');
  };

  return (
    <WalletContext.Provider value={{ isConnected, walletAddress, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};