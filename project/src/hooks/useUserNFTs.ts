import { useState, useCallback, useEffect } from 'react';
import { useAO } from './useAO';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

interface NFTData {
  tokenId: string;
  type: 'basic-access' | 'premium-access' | 'creator';
  metadata: Record<string, unknown>;
  owner: string;
  videoId?: string;
  title?: string;
  description?: string;
  image?: string;
  expiresAt?: number;
  isExpired?: boolean;
}

interface UseUserNFTsReturn {
  // NFT data
  nfts: NFTData[];
  isLoading: boolean;
  
  // Actions
  refreshNFTs: () => Promise<void>;
  transferNFT: (tokenId: string, recipient: string, price?: number) => Promise<boolean>;
  isTransferring: boolean;
  
  // Filtering
  getNFTsByType: (type: NFTData['type']) => NFTData[];
  getNFTsByVideo: (videoId: string) => NFTData[];
  getExpiredNFTs: () => NFTData[];
  getActiveNFTs: () => NFTData[];
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useUserNFTs = (): UseUserNFTsReturn => {
  const { walletAddress } = useWallet();
  const { getUserNFTs, transferNFT: aoTransferNFT, isTransferring, error } = useAO();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load NFTs when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      refreshNFTs();
    } else {
      setNfts([]);
    }
  }, [walletAddress]);

  const refreshNFTs = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setIsLoading(true);
      setLocalError(null);
      
      const userNFTs = await getUserNFTs();
      
      // Process and enhance NFT data
      const processedNFTs = userNFTs.map(nft => {
        const expiresAt = nft.metadata?.expires_at as number || undefined;
        return {
          ...nft,
          expiresAt,
          isExpired: expiresAt ? Date.now() > expiresAt : false,
          title: nft.metadata?.name as string || 'Untitled',
          description: nft.metadata?.description as string || '',
          image: nft.metadata?.image as string || '',
        };
      });
      
      setNfts(processedNFTs);
    } catch (error) {
      const errorMessage = (error as Error).message;
      setLocalError(errorMessage);
      console.error('Failed to load NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, getUserNFTs]);

  const transferNFT = useCallback(async (
    tokenId: string, 
    recipient: string, 
    price?: number
  ): Promise<boolean> => {
    try {
      setLocalError(null);
      
      const success = await aoTransferNFT(tokenId, recipient, price);
      
      if (success) {
        // Refresh NFTs after successful transfer
        await refreshNFTs();
        toast.success('NFT transferred successfully!');
      }
      
      return success;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setLocalError(errorMessage);
      toast.error('Transfer failed: ' + errorMessage);
      return false;
    }
  }, [aoTransferNFT, refreshNFTs]);

  const getNFTsByType = useCallback((type: NFTData['type']): NFTData[] => {
    return nfts.filter(nft => nft.type === type);
  }, [nfts]);

  const getNFTsByVideo = useCallback((videoId: string): NFTData[] => {
    return nfts.filter(nft => nft.videoId === videoId);
  }, [nfts]);

  const getExpiredNFTs = useCallback((): NFTData[] => {
    return nfts.filter(nft => nft.isExpired);
  }, [nfts]);

  const getActiveNFTs = useCallback((): NFTData[] => {
    return nfts.filter(nft => !nft.isExpired);
  }, [nfts]);

  const clearLocalError = useCallback(() => {
    setLocalError(null);
  }, []);

  return {
    nfts,
    isLoading,
    refreshNFTs,
    transferNFT,
    isTransferring,
    getNFTsByType,
    getNFTsByVideo,
    getExpiredNFTs,
    getActiveNFTs,
    error: localError || error,
    clearError: clearLocalError
  };
}; 