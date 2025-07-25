import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Video } from '../data/mockData';
import { mockVideos } from '../data/mockData';
import { useWallet } from './WalletContext';
import { BlockchainVideoService } from '../services/blockchainVideoService';

interface VideoContextType {
  // Video state
  videos: Video[];
  userVideos: Video[];
  isLoading: boolean;
  
  // Video management
  addVideo: (video: Omit<Video, 'views' | 'likes' | 'createdAt'>) => void;
  getVideo: (id: string) => Video | null;
  updateVideo: (id: string, updates: Partial<Video>) => void;
  deleteVideo: (id: string) => void;
  
  // Filtering and search
  getVideosByCreator: (creatorAddress: string) => Video[];
  getFreeVideos: () => Video[];
  getPaidVideos: () => Video[];
  searchVideos: (query: string) => Video[];
  
  // User interaction
  incrementViews: (videoId: string) => void;
  toggleLike: (videoId: string) => void;
  
  // Blockchain data management (source of truth)
  loadVideosFromBlockchain: () => Promise<void>;
  refreshVideoFromBlockchain: (videoId: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
  
  // Legacy methods (now deprecated but kept for compatibility)
  loadVideos: () => void;
  saveVideos: () => void;
  reloadVideos: () => void;
  fixBrokenThumbnails: () => void;
  loadVideosFromNFT: () => Promise<void>;
  refreshVideoFromNFT: (videoId: string) => Promise<void>;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const useVideos = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideos must be used within a VideoProvider');
  }
  return context;
};

interface VideoProviderProps {
  children: ReactNode;
}

export const VideoProvider: React.FC<VideoProviderProps> = ({ children }) => {
  const { walletAddress } = useWallet();
  const [videos, setVideos] = useState<Video[]>(mockVideos);
  const [isLoading, setIsLoading] = useState(false);

  // Primary data loading: Use blockchain as source of truth
  useEffect(() => {
    const initializeVideos = async () => {
      setIsLoading(true);
      try {
        console.log('🚀 Initializing videos from blockchain (source of truth)...');
        
        // Check if blockchain is accessible with timeout
        let isAccessible = false;
        try {
          isAccessible = await Promise.race([
            BlockchainVideoService.isBlockchainAccessible(),
            new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Accessibility check timeout')), 10000)
            )
          ]);
        } catch (error) {
          console.warn('⚠️ Blockchain accessibility check failed:', error.message);
          isAccessible = false;
        }
        
        if (isAccessible) {
          console.log('✅ Blockchain accessible, loading videos...');
          try {
            await loadVideosFromBlockchain();
          } catch (error) {
            console.warn('⚠️ Blockchain video loading failed, falling back to mock data:', error.message);
            setVideos(mockVideos);
          }
        } else {
          console.log('⚠️ Blockchain not accessible, using mock data as fallback');
          setVideos(mockVideos);
        }
      } catch (error) {
        console.error('Failed to initialize videos:', error.message);
        setVideos(mockVideos);
      } finally {
        setIsLoading(false);
      }
    };

    initializeVideos();
  }, []);

  // Load videos from blockchain (primary method)
  const loadVideosFromBlockchain = useCallback(async () => {
    try {
      console.log('🔍 Loading videos from blockchain...');
      setIsLoading(true);
      
      // Add timeout wrapper for blockchain loading
      const timeoutPromise = new Promise<Video[]>((_, reject) => 
        setTimeout(() => reject(new Error('Blockchain video loading timeout')), 20000)
      );
      
      const loadPromise = BlockchainVideoService.getAllVideos();
      
      const blockchainVideos = await Promise.race([loadPromise, timeoutPromise]);
      
      if (blockchainVideos.length > 0) {
        console.log(`✅ Loaded ${blockchainVideos.length} videos from blockchain`);
        
        // Use blockchain videos as primary data source
        // Only add mock videos if no blockchain videos exist
        setVideos(blockchainVideos);
        console.log('📊 Using blockchain videos as primary data source');
      } else {
        console.log('⚠️ No videos found on blockchain, using mock data as fallback');
        setVideos(mockVideos);
      }
    } catch (error) {
      console.error('Failed to load videos from blockchain:', error.message);
      // Fallback to mock data on error
      console.log('📦 Falling back to mock videos due to blockchain error');
      setVideos(mockVideos);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh single video from blockchain
  const refreshVideoFromBlockchain = useCallback(async (videoId: string) => {
    try {
      console.log('🔄 Refreshing video from blockchain:', videoId);
      
      const blockchainVideo = await BlockchainVideoService.getVideo(videoId);
      
      if (blockchainVideo) {
        console.log('✅ Video refreshed from blockchain:', blockchainVideo.title);
        
        setVideos(prev => {
          const updated = [...prev];
          const existingIndex = updated.findIndex(v => v.id === videoId);
          
          if (existingIndex >= 0) {
            updated[existingIndex] = blockchainVideo;
          } else {
            updated.unshift(blockchainVideo);
          }
          
          return updated;
        });
      } else {
        console.log('⚠️ Video not found on blockchain:', videoId);
      }
    } catch (error) {
      console.error('Failed to refresh video from blockchain:', error);
    }
  }, []);

  // Refresh all data from blockchain
  const refreshAllData = useCallback(async () => {
    console.log('🔄 Refreshing all data from blockchain...');
    BlockchainVideoService.clearCache();
    await loadVideosFromBlockchain();
  }, [loadVideosFromBlockchain]);

  // Get single video (check blockchain first, then local)
  const getVideo = useCallback((id: string): Video | null => {
    return videos.find(video => video.id === id) || null;
  }, [videos]);

  // Add video (this happens after blockchain upload)
  const addVideo = useCallback((videoData: Omit<Video, 'views' | 'likes' | 'createdAt'>) => {
    const newVideo: Video = {
      ...videoData,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setVideos(prev => [newVideo, ...prev]);
    console.log('Added new video to context:', newVideo.title);
    
    // Invalidate blockchain cache since new video was added
    BlockchainVideoService.invalidateCache('all-videos');
  }, []);

  const updateVideo = useCallback((id: string, updates: Partial<Video>) => {
    setVideos(prev => prev.map(video => 
      video.id === id ? { ...video, ...updates } : video
    ));
  }, []);

  const deleteVideo = useCallback((id: string) => {
    setVideos(prev => prev.filter(video => video.id !== id));
    BlockchainVideoService.invalidateCache(`video-${id}`);
    BlockchainVideoService.invalidateCache('all-videos');
  }, []);

  const getVideosByCreator = useCallback((creatorAddress: string): Video[] => {
    return videos.filter(video => video.creatorAddress === creatorAddress);
  }, [videos]);

  const getFreeVideos = useCallback((): Video[] => {
    return videos.filter(video => video.isFree);
  }, [videos]);

  const getPaidVideos = useCallback((): Video[] => {
    return videos.filter(video => !video.isFree);
  }, [videos]);

  const searchVideos = useCallback((query: string): Video[] => {
    const lowercaseQuery = query.toLowerCase();
    return videos.filter(video =>
      video.title.toLowerCase().includes(lowercaseQuery) ||
      video.description.toLowerCase().includes(lowercaseQuery) ||
      video.creator.toLowerCase().includes(lowercaseQuery) ||
      video.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [videos]);

  const incrementViews = useCallback((videoId: string) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId ? { ...video, views: video.views + 1 } : video
    ));
  }, []);

  const toggleLike = useCallback((videoId: string) => {
    setVideos(prev => prev.map(video => 
      video.id === videoId ? { ...video, likes: video.likes + 1 } : video
    ));
  }, []);

  // Legacy localStorage methods (deprecated but kept for compatibility)
  const loadVideos = useCallback(() => {
    console.log('⚠️ loadVideos() is deprecated. Use loadVideosFromBlockchain() instead.');
    // For backward compatibility, trigger blockchain loading
    loadVideosFromBlockchain();
  }, [loadVideosFromBlockchain]);

  const saveVideos = useCallback(() => {
    console.log('⚠️ saveVideos() is deprecated. Data is automatically saved to blockchain.');
    // No-op: blockchain is now the source of truth
  }, []);

  const reloadVideos = useCallback(() => {
    console.log('⚠️ reloadVideos() is deprecated. Use refreshAllData() instead.');
    refreshAllData();
  }, [refreshAllData]);

  const fixBrokenThumbnails = useCallback(() => {
    console.log('⚠️ fixBrokenThumbnails() is deprecated. Data comes from blockchain.');
    // No-op: blockchain data should be consistent
  }, []);

  // Legacy NFT methods (redirect to blockchain methods)
  const loadVideosFromNFT = useCallback(async () => {
    console.log('⚠️ loadVideosFromNFT() is deprecated. Use loadVideosFromBlockchain() instead.');
    await loadVideosFromBlockchain();
  }, [loadVideosFromBlockchain]);

  const refreshVideoFromNFT = useCallback(async (videoId: string) => {
    console.log('⚠️ refreshVideoFromNFT() is deprecated. Use refreshVideoFromBlockchain() instead.');
    await refreshVideoFromBlockchain(videoId);
  }, [refreshVideoFromBlockchain]);

  // Get videos uploaded by current user
  const userVideos = walletAddress ? getVideosByCreator(walletAddress) : [];

  const value: VideoContextType = {
    videos,
    userVideos,
    isLoading,
    addVideo,
    getVideo,
    updateVideo,
    deleteVideo,
    getVideosByCreator,
    getFreeVideos,
    getPaidVideos,
    searchVideos,
    incrementViews,
    toggleLike,
    
    // Blockchain methods (primary)
    loadVideosFromBlockchain,
    refreshVideoFromBlockchain,
    refreshAllData,
    
    // Legacy methods (compatibility)
    loadVideos,
    saveVideos,
    reloadVideos,
    fixBrokenThumbnails,
    loadVideosFromNFT,
    refreshVideoFromNFT,
  };

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
};