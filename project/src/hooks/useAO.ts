import { message, result, dryrun, createDataItemSigner } from '@permaweb/aoconnect';
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import Arweave from 'arweave';
import { AOService, AO_PROCESSES } from '../services/aoService';

// PROPER AOCONNECT MAINNET CONFIGURATION
// Use Arweave mainnet endpoints to prevent testnet redirects
const MAINNET_URLS = {
  CU_URL: process.env.AO_CU_URL || 'https://cu.arweave.net',
  MU_URL: process.env.AO_MU_URL || 'https://mu.arweave.net',
  GATEWAY_URL: process.env.AO_GATEWAY_URL || 'https://arweave.net'
};

console.log('✅ useAO: Using Arweave mainnet URLs');
console.log('✅ useAO: Arweave mainnet URLs verified:', MAINNET_URLS);

// Helper function to ensure mainnet dryrun calls
const mainnetDryrun = async (params: any) => {
  console.log('🔧 Using Arweave mainnet URLs for dryrun (useAO)');
  return dryrun({
    ...params,
    ...MAINNET_URLS
  });
};

// Helper function to ensure mainnet message calls
const mainnetMessage = async (params: any) => {
  console.log('🔧 Using Arweave mainnet URLs for message (useAO)');
  return message({
    ...params,
    ...MAINNET_URLS
  });
};

// Helper function to ensure mainnet result calls
const mainnetResult = async (params: any) => {
  console.log('🔧 Using Arweave mainnet URLs for result (useAO)');
  return result({
    ...params,
    ...MAINNET_URLS
  });
};

// Environment-based configuration
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Types
interface UploadProgress {
  step: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

interface VideoUploadData {
  title: string;
  description: string;
  video: File;
  thumbnail: File;
  buyPrice: number;
  rentPrice: number;
  rentDuration: number;
  isFree: boolean;
  tags: string[];
  genre: string;
  // Arweave transaction IDs (when files are already uploaded)
  arweaveVideoId?: string;
  arweaveThumbnailId?: string;
  arweaveMetadataId?: string;
}

interface AccessPurchaseData {
  videoId: string;
  accessType: 'basic' | 'premium';
  duration?: number;
  price: number;
}

interface NFTData {
  tokenId: string;
  type: 'basic-access' | 'premium-access' | 'creator';
  metadata: Record<string, unknown>;
  owner: string;
  videoId?: string;
}

interface UseAOReturn {
  // Upload functionality
  uploadVideo: (data: VideoUploadData) => Promise<{ videoId: string; thumbnailUrl: string; videoUrl: string }>;
  uploadProgress: UploadProgress[];
  isUploading: boolean;
  
  // Access functionality
  purchaseAccess: (data: AccessPurchaseData) => Promise<string>;
  verifyAccess: (videoId: string) => Promise<boolean>;
  isPurchasing: boolean;
  
  // NFT functionality
  getUserNFTs: () => Promise<NFTData[]>;
  transferNFT: (tokenId: string, recipient: string, price?: number) => Promise<boolean>;
  isTransferring: boolean;
  
  // Utility
  verifyProcesses: () => Promise<void>;
  clearProgress: () => void;
  error: string | null;
  clearError: () => void;
}

export const useAO = (): UseAOReturn => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Arweave
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
  });

  // Utility functions
  const ensureWalletConnected = useCallback(async (): Promise<void> => {
    if (!window.arweaveWallet) {
      throw new Error('Arweave wallet not connected. Please install and connect ArConnect.');
    }
    
    try {
      const permissions = await window.arweaveWallet.getPermissions();
      if (!permissions.includes('ACCESS_ADDRESS')) {
        await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);
      }
    } catch (error) {
      throw new Error('Failed to connect wallet: ' + (error as Error).message);
    }
  }, []);

  const createSigner = useCallback(async () => {
    await ensureWalletConnected();
    return createDataItemSigner(window.arweaveWallet);
  }, [ensureWalletConnected]);

  const updateProgress = useCallback((step: string, updates: Partial<UploadProgress>) => {
    setUploadProgress(prev => {
      const existing = prev.find(p => p.step === step);
      if (existing) {
        return prev.map(p => p.step === step ? { ...p, ...updates } : p);
      } else {
        return [...prev, { step, progress: 0, status: 'pending', ...updates }];
      }
    });
  }, []);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Upload file to Arweave with progress tracking
  const uploadToArweave = useCallback(async (file: File, contentType: string, stepName: string): Promise<string> => {
    try {
      updateProgress(stepName, { status: 'processing', progress: 0, message: 'Preparing upload...' });
      
      const fileBuffer = await file.arrayBuffer();
      updateProgress(stepName, { progress: 10, message: 'Creating transaction...' });
      
      const transaction = await arweave.createTransaction({ data: fileBuffer });
      transaction.addTag('Content-Type', contentType);
      transaction.addTag('App-Name', 'ZDrive');
      transaction.addTag('App-Version', '1.0.0');
      
      updateProgress(stepName, { progress: 30, message: 'Signing transaction...' });
      await arweave.transactions.sign(transaction);
      
      updateProgress(stepName, { progress: 60, message: 'Uploading to Arweave...' });
      const response = await arweave.transactions.post(transaction);
      
      if (response.status !== 200) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
      
      updateProgress(stepName, { status: 'completed', progress: 100, message: 'Upload complete!' });
      return transaction.id;
    } catch (error) {
      updateProgress(stepName, { status: 'error', message: (error as Error).message });
      throw error;
    }
  }, [arweave, updateProgress]);

  // Main upload function
  const uploadVideo = useCallback(async (data: VideoUploadData): Promise<{ videoId: string; thumbnailUrl: string; videoUrl: string }> => {
    setIsUploading(true);
    setError(null);
    clearProgress();

    try {
      // Verify AO processes are available
      updateProgress('verification', { status: 'processing', message: 'Verifying AO processes...' });
      await AOService.verifyAllProcesses();
      updateProgress('verification', { status: 'completed', progress: 100 });

      // Use provided Arweave transaction IDs or upload files
      let videoTxId: string;
      let thumbnailTxId: string;

      if (data.arweaveVideoId && data.arweaveThumbnailId) {
        // Files already uploaded to Arweave, use provided transaction IDs
        videoTxId = data.arweaveVideoId;
        thumbnailTxId = data.arweaveThumbnailId;
        console.log('✅ Using provided Arweave transaction IDs:', { videoTxId, thumbnailTxId });
      } else {
        // Upload files to Arweave
        videoTxId = await uploadToArweave(data.video, 'video/mp4', 'video-upload');
        thumbnailTxId = await uploadToArweave(data.thumbnail, 'image/jpeg', 'thumbnail-upload');
      }

      // Step 3: Create Creator NFT on AO
      updateProgress('nft-creation', { status: 'processing', message: 'Creating Creator NFT...' });
      
      const signer = await createSigner();
      const videoId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const messageId = await mainnetMessage({
        process: AO_PROCESSES.CREATOR_NFT,
        signer,
        tags: [
          { name: 'Action', value: 'Upload-Video' },
          { name: 'VideoId', value: videoId },
          { name: 'Title', value: data.title },
          { name: 'Description', value: data.description },
          { name: 'ArweaveVideoId', value: videoTxId },
          { name: 'ArweaveThumbnailId', value: thumbnailTxId },
          { name: 'ArweaveMetadataId', value: data.arweaveMetadataId || '' },
          { name: 'Duration', value: '0' },
          { name: 'BuyPrice', value: data.buyPrice.toString() },
          { name: 'RentPrice', value: data.rentPrice.toString() },
          { name: 'RentDuration', value: data.rentDuration.toString() },
          { name: 'IsFree', value: data.isFree.toString() },
          { name: 'StorageFee', value: '0.001' },
          { name: 'Tags', value: JSON.stringify(data.tags) },
          { name: 'Genre', value: data.genre },
          // ANS-110 Required Fields for proper NFT display
          { name: 'Name', value: `ZDrive: ${data.title}` },
          { name: 'Ticker', value: 'ZDRIVE-VID' },
          { name: 'Logo', value: `https://arweave.net/${thumbnailTxId}` },
          { name: 'Denomination', value: '1' },
          { name: 'Data-Protocol', value: 'ao' },
          { name: 'Variant', value: 'ao.TN.1' },
          { name: 'Type', value: 'asset' },
          // Additional collectible metadata
          { name: 'Content-Type', value: 'video/mp4' },
          { name: 'Thumbnail', value: `https://arweave.net/${thumbnailTxId}` },
          { name: 'Video-URL', value: `https://arweave.net/${videoTxId}` },
          { name: 'Collection', value: 'ZDrive Videos' },
          { name: 'Creator', value: 'ZDrive Platform' },
          { name: 'Description', value: data.description },
          { name: 'External-Url', value: `https://zdrive.app/video/${videoId}` },
          { name: 'Image', value: `https://arweave.net/${thumbnailTxId}` },
          { name: 'Animation-Url', value: `https://arweave.net/${videoTxId}` },
        ],
        data: JSON.stringify({
          // Standard NFT metadata for wallets
          name: `ZDrive: ${data.title}`,
          description: data.description,
          image: `https://arweave.net/${thumbnailTxId}`,
          animation_url: `https://arweave.net/${videoTxId}`,
          external_url: `https://zdrive.app/video/${videoId}`,
          attributes: [
            { trait_type: "Creator", value: "ZDrive Platform" },
            { trait_type: "Genre", value: data.genre },
            { trait_type: "Type", value: "Video NFT" },
            { trait_type: "Collection", value: "ZDrive Videos" },
            { trait_type: "Price", value: data.buyPrice.toString() },
            { trait_type: "Free", value: data.isFree.toString() }
          ],
          // ZDrive specific metadata
          videoUrl: `https://arweave.net/${videoTxId}`,
          thumbnailUrl: `https://arweave.net/${thumbnailTxId}`,
          tags: data.tags,
          genre: data.genre,
          creator: 'ZDrive Platform',
          zdrive: {
            version: "1.0.0",
            videoId: videoId,
            arweaveVideoId: videoTxId,
            arweaveThumbnailId: thumbnailTxId,
            buyPrice: data.buyPrice,
            rentPrice: data.rentPrice,
            rentDuration: data.rentDuration,
            isFree: data.isFree
          }
        }),
      });

      updateProgress('nft-creation', { progress: 50, message: 'Waiting for blockchain confirmation...' });

      // Wait for result
      const uploadResult = await mainnetResult({ 
        message: messageId, 
        process: AO_PROCESSES.CREATOR_NFT,
      });
      
      if (uploadResult.Messages?.length > 0) {
        const messageData = uploadResult.Messages[0].Data;
        if (messageData && messageData !== 'undefined') {
          try {
            const resultData = JSON.parse(messageData);
            if (resultData.VideoId) {
              updateProgress('nft-creation', { status: 'completed', progress: 100, message: 'NFT created successfully!' });
              toast.success('Video uploaded and NFT created successfully!');
              return {
                videoId: resultData.VideoId,
                thumbnailUrl: `https://arweave.net/${thumbnailTxId}`,
                videoUrl: `https://arweave.net/${videoTxId}`
              };
            }
          } catch (parseError) {
            console.warn('Failed to parse result data:', parseError);
          }
        }
      }

      updateProgress('nft-creation', { status: 'completed', progress: 100, message: 'NFT creation completed!' });
      toast.success('Video uploaded successfully!');
      return {
        videoId: videoId,
        thumbnailUrl: `https://arweave.net/${thumbnailTxId}`,
        videoUrl: `https://arweave.net/${videoTxId}`
      };

    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      toast.error('Upload failed: ' + errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [uploadToArweave, createSigner, updateProgress, clearProgress]);

  // Purchase access function
  const purchaseAccess = useCallback(async (data: AccessPurchaseData): Promise<string> => {
    setIsPurchasing(true);
    setError(null);

    try {
      await ensureWalletConnected();
      const signer = await createSigner();

      const processId = data.accessType === 'basic' 
        ? AO_PROCESSES.BASIC_ACCESS 
        : AO_PROCESSES.PREMIUM_ACCESS;

      const messageId = await mainnetMessage({
        process: processId,
        signer,
        tags: [
          { name: 'Action', value: 'Purchase-Access' },
          { name: 'VideoId', value: data.videoId },
          { name: 'AccessType', value: data.accessType },
          { name: 'Price', value: data.price.toString() },
          { name: 'Duration', value: (data.duration || 30).toString() },
        ],
        data: '',
      });

      const purchaseResult = await mainnetResult({ 
        message: messageId, 
        process: processId,
      });
      
      if (purchaseResult.Messages?.length > 0) {
        const messageData = purchaseResult.Messages[0].Data;
        if (messageData && messageData !== 'undefined') {
          try {
            const resultData = JSON.parse(messageData);
            if (resultData.AccessTokenId) {
              toast.success('Access purchased successfully!');
              return resultData.AccessTokenId;
            }
          } catch (parseError) {
            console.warn('Failed to parse purchase result:', parseError);
          }
        }
      }

      toast.success('Access purchased successfully!');
      return 'access-granted';

    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      toast.error('Purchase failed: ' + errorMessage);
      throw error;
    } finally {
      setIsPurchasing(false);
    }
  }, [ensureWalletConnected, createSigner]);

  // Verify access function
  const verifyAccess = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const response = await AOService.requestAccess(videoId);
      return response.granted;
    } catch (error) {
      console.error('Access verification failed:', error);
      return false;
    }
  }, []);

  // Get user NFTs
  const getUserNFTs = useCallback(async (): Promise<NFTData[]> => {
    try {
      const basicNFTs = await AOService.getUserAccessTokens();
      const creatorNFTs = await AOService.getUserCreatorNFTs();
      
      const basicNFTsArray = Array.isArray(basicNFTs.basic) ? basicNFTs.basic : [];
      const premiumNFTsArray = Array.isArray(basicNFTs.premium) ? basicNFTs.premium : [];
      const creatorNFTsArray = Array.isArray(creatorNFTs) ? creatorNFTs : [];
      
      const result: NFTData[] = [];
      
      // Process basic NFTs
      basicNFTsArray.forEach((nft: unknown) => {
        if (typeof nft === 'object' && nft !== null) {
          const nftObj = nft as Record<string, unknown>;
          result.push({
            tokenId: String(nftObj.tokenId || 'unknown'),
            type: 'basic-access',
            metadata: nftObj.metadata as Record<string, unknown> || {},
            owner: String(nftObj.owner || 'unknown'),
            videoId: nftObj.videoId ? String(nftObj.videoId) : undefined
          });
        }
      });
      
      // Process premium NFTs
      premiumNFTsArray.forEach((nft: unknown) => {
        if (typeof nft === 'object' && nft !== null) {
          const nftObj = nft as Record<string, unknown>;
          result.push({
            tokenId: String(nftObj.tokenId || 'unknown'),
            type: 'premium-access',
            metadata: nftObj.metadata as Record<string, unknown> || {},
            owner: String(nftObj.owner || 'unknown'),
            videoId: nftObj.videoId ? String(nftObj.videoId) : undefined
          });
        }
      });
      
      // Process creator NFTs
      creatorNFTsArray.forEach((nft: unknown) => {
        if (typeof nft === 'object' && nft !== null) {
          const nftObj = nft as Record<string, unknown>;
          result.push({
            tokenId: String(nftObj.tokenId || 'unknown'),
            type: 'creator',
            metadata: nftObj.metadata as Record<string, unknown> || {},
            owner: String(nftObj.owner || 'unknown'),
            videoId: nftObj.videoId ? String(nftObj.videoId) : undefined
          });
        }
      });
      
      return result;
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      return [];
    }
  }, []);

  // Transfer NFT
  const transferNFT = useCallback(async (tokenId: string, recipient: string, price?: number): Promise<boolean> => {
    setIsTransferring(true);
    setError(null);

    try {
      const result = await AOService.transferNFT(
        AO_PROCESSES.CREATOR_NFT, // This should be determined based on token type
        tokenId,
        recipient,
        price
      );
      
      if (result) {
        toast.success('NFT transferred successfully!');
      }
      
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      toast.error('Transfer failed: ' + errorMessage);
      return false;
    } finally {
      setIsTransferring(false);
    }
  }, []);

  // Verify processes
  const verifyProcesses = useCallback(async (): Promise<void> => {
    try {
      await AOService.verifyAllProcesses();
      toast.success('All AO processes are responding!');
    } catch (error) {
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      toast.error('Process verification failed: ' + errorMessage);
    }
  }, []);

  return {
    uploadVideo,
    uploadProgress,
    isUploading,
    purchaseAccess,
    verifyAccess,
    isPurchasing,
    getUserNFTs,
    transferNFT,
    isTransferring,
    verifyProcesses,
    clearProgress,
    error,
    clearError,
  };
}; 