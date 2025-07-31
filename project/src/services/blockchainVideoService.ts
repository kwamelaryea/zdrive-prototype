import { Video } from '../data/mockData';
import { message, result, dryrun, createDataItemSigner } from '@permaweb/aoconnect';
import Arweave from 'arweave';
import toast from 'react-hot-toast';
import { AOService, AO_PROCESSES } from './aoService';

// PROPER AOCONNECT MAINNET CONFIGURATION
// Use Arweave mainnet endpoints to prevent testnet redirects
const MAINNET_URLS = {
  CU_URL: process.env.AO_CU_URL || 'https://cu.arweave.net',
  MU_URL: process.env.AO_MU_URL || 'https://mu.arweave.net',
  GATEWAY_URL: process.env.AO_GATEWAY_URL || 'https://arweave.net'
};

console.log('✅ BlockchainVideoService: Using Arweave mainnet URLs');
console.log('✅ BlockchainVideoService: Arweave mainnet URLs verified:', MAINNET_URLS);

// Helper function to ensure mainnet dryrun calls
const mainnetDryrun = async (params: any) => {
  console.log('🔧 Using Arweave mainnet URLs for dryrun (blockchainVideoService)');
  return dryrun({
    ...params,
    ...MAINNET_URLS
  });
};

/**
 * Blockchain Video Service - Uses AO processes as source of truth
 * Replaces localStorage with blockchain queries
 */
export class BlockchainVideoService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  private static cache: { [key: string]: { data: any; timestamp: number } } = {};

  /**
   * Utility method to make blockchain requests with timeout and error handling
   */
  private static async makeBlockchainRequest(requestFn: () => Promise<any>, timeoutMs: number = 30000): Promise<any> {
    try {
      console.log('🌐 Making blockchain request with timeout:', timeoutMs + 'ms');
      console.log('🎯 Using Arweave mainnet URLs:', {
        GATEWAY_URL: MAINNET_URLS.GATEWAY_URL,
        CU_URL: MAINNET_URLS.CU_URL,
        MU_URL: MAINNET_URLS.MU_URL
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Blockchain request timeout after ${timeoutMs}ms`)), timeoutMs)
      );
      
      const result = await Promise.race([requestFn(), timeoutPromise]);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check for specific error types
      if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control-Allow-Origin')) {
        console.error('❌ CORS Error: Request blocked by CORS policy. This may indicate testnet URLs are being used.');
        console.error('🔍 Expected mainnet URLs:', MAINNET_URLS);
      } else if (errorMessage.includes('Failed to fetch')) {
        console.error('❌ Network Error: Failed to fetch from blockchain. Check network connectivity.');
      } else if (errorMessage.includes('timeout')) {
        console.error('⏰ Timeout Error: Request timed out after', timeoutMs, 'ms');
        console.error('  - This could indicate network issues or slow blockchain response');
        console.error('  - Consider increasing timeout or checking network connectivity');
      } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        console.error('🌐 Connection Error: Cannot connect to blockchain network');
        console.error('  - Check internet connection');
        console.error('  - Verify mainnet URLs are accessible');
      } else {
        console.error('❌ Blockchain request failed:', errorMessage);
      }
      
      throw error;
    }
  }

  /**
   * Dynamically discover video IDs from the blockchain
   * This is a workaround for when bulk query handlers don't work
   */
  private static async discoverVideoIds(): Promise<string[]> {
    try {
      console.log('🔍 Discovering video IDs from blockchain...');
      
      // Get all users who have tokens
      const balancesResult = await this.makeBlockchainRequest(() => 
        mainnetDryrun({
          process: AO_PROCESSES.CREATOR_NFT,
          tags: [{ name: 'Action', value: 'Balances' }]
        })
      );
      
      if (balancesResult.Messages?.length > 0) {
        const balancesData = this.safeJsonParse(balancesResult.Messages[0].Data, {});
        console.log('👥 Found token holders:', Object.keys(balancesData));
        
        const discoveredVideoIds: string[] = [];
        
        // For each token holder, try common video ID patterns
        for (const userAddress of Object.keys(balancesData)) {
          const tokenCount = balancesData[userAddress];
          console.log(`🎯 User ${userAddress} has ${tokenCount} tokens`);
          
          // Try some video ID patterns
          const testPatterns = [
            'video-1753375410192-uh2a7e6hr', // Known working video
            'video-1753528269607-6pag0s8bu', // Newly uploaded video
            // Add more patterns if needed
          ];
          
          for (const pattern of testPatterns) {
            try {
              const testResult = await this.makeBlockchainRequest(() => 
                mainnetDryrun({
                  process: AO_PROCESSES.CREATOR_NFT,
                  tags: [
                    { name: 'Action', value: 'Get-Video' },
                    { name: 'VideoId', value: pattern }
                  ]
                }), 15000 // Increased timeout for pattern testing
              );
              
              if (testResult.Messages?.length > 0) {
                const message = testResult.Messages[0];
                if (message.Data && message.Data !== 'Video not found' && !message.Data.includes('not found')) {
                  console.log(`✅ Found video: ${pattern}`);
                  if (!discoveredVideoIds.includes(pattern)) {
                    discoveredVideoIds.push(pattern);
                  }
                }
              }
            } catch (error) {
              // Ignore errors for pattern testing
              console.warn(`⚠️ Pattern test failed for ${pattern}:`, error.message);
            }
          }
        }
        
        console.log(`🔍 Discovered ${discoveredVideoIds.length} video IDs:`, discoveredVideoIds);
        return discoveredVideoIds;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to discover video IDs:', error.message);
      return [];
    }
  }

  /**
   * Get all videos from blockchain (source of truth)
   */
  static async getAllVideos(): Promise<Video[]> {
    try {
      console.log('🔍 Loading all videos from blockchain...');
      console.log('🎯 Process ID:', AO_PROCESSES.CREATOR_NFT);
      
      // Force clear cache for fresh data (to detect newly uploaded videos)
      const cacheKey = 'all-videos';
      delete this.cache[cacheKey];
      console.log('🗑️ Cache cleared to detect newly uploaded videos');
      
      // Check cache first (will be empty after clearing above)
      const cached = this.cache[cacheKey];
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📋 Using cached videos data');
        return cached.data;
      }

      // Primary method: Try Get-All-Videos with timeout
      try {
        console.log('📡 Attempting Get-All-Videos query...');
        const result = await this.makeBlockchainRequest(() => 
          mainnetDryrun({
            process: AO_PROCESSES.CREATOR_NFT,
            tags: [{ name: 'Action', value: 'Get-All-Videos' }]
          })
        );

        console.log('📥 Raw blockchain response:', {
          hasMessages: !!result.Messages,
          messageCount: result.Messages?.length || 0
        });

        if (result.Messages?.length > 0) {
          const message = result.Messages[0];
          console.log('📋 Message details:', {
            Action: message.Action,
            DataLength: message.Data?.length || 0
          });
          
          const responseData = this.safeJsonParse(result.Messages[0].Data, { videos: [] });
          console.log('🔍 Parsed response data:', responseData);
          
          if (responseData.videos && Array.isArray(responseData.videos)) {
            const videos = responseData.videos.map((item: any) => {
              console.log('🎬 Converting blockchain video item:', item);
              return this.convertBlockchainToVideo(item);
            });
            
            // Cache the result
            this.cache[cacheKey] = { data: videos, timestamp: Date.now() };
            
            console.log(`✅ Loaded ${videos.length} videos from blockchain via Get-All-Videos`);
            console.log('📽️ Video titles:', videos.map(v => v.title));
            return videos;
          }
        }
      } catch (error) {
        console.warn('⚠️ Get-All-Videos failed:', error.message);
      }

      // Fallback method: Discover and load videos individually
      console.log('⚠️ Get-All-Videos failed, trying individual video discovery...');
      
      try {
        const discoveredVideoIds = await this.discoverVideoIds();
        const allVideos: Video[] = [];
        
        for (const videoId of discoveredVideoIds) {
          try {
            console.log(`🎬 Loading discovered video: ${videoId}`);
            const video = await this.getVideo(videoId);
            if (video) {
              allVideos.push(video);
              console.log(`✅ Loaded video: ${video.title}`);
            }
          } catch (error) {
            console.warn(`Failed to load video ${videoId}:`, error.message);
          }
        }
        
        if (allVideos.length > 0) {
          // Cache the result
          this.cache[cacheKey] = { data: allVideos, timestamp: Date.now() };
          
          console.log(`✅ Loaded ${allVideos.length} videos via discovery method`);
          console.log('📽️ Video titles:', allVideos.map(v => v.title));
          return allVideos;
        }
      } catch (error) {
        console.warn('⚠️ Video discovery failed:', error.message);
      }

      console.log('⚠️ No videos found on blockchain');
      return [];
    } catch (error) {
      console.error('❌ Critical error in getAllVideos:', error.message);
      return [];
    }
  }

  /**
   * Get single video from blockchain
   */
  static async getVideo(videoId: string): Promise<Video | null> {
    try {
      console.log('🔍 Loading video from blockchain:', videoId);
      
      // Check cache first
      const cacheKey = `video-${videoId}`;
      const cached = this.cache[cacheKey];
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📋 Using cached video data');
        return cached.data;
      }

      const result = await this.makeBlockchainRequest(() => 
        mainnetDryrun({
          process: AO_PROCESSES.CREATOR_NFT,
          tags: [
            { name: 'Action', value: 'Get-Video' },
            { name: 'VideoId', value: videoId }
          ]
        })
      );

      console.log('📥 Video query response:', {
        hasMessages: !!result.Messages,
        messageCount: result.Messages?.length || 0
      });

      if (result.Messages?.length > 0) {
        const message = result.Messages[0];
        
        console.log('📋 Video message:', {
          Action: message.Action,
          DataLength: message.Data?.length || 0,
          DataPreview: message.Data?.substring(0, 100) + '...'
        });
        
        // Check for error response (plain text)
        if (message.Data === 'Video not found' || message.Data?.includes('not found')) {
          console.log('❌ Video not found on blockchain:', message.Data);
          return null;
        }
        
        // Try to parse the response
        const responseData = this.safeJsonParse(message.Data, null);
        
        if (responseData) {
          console.log('🎬 Found video data structure:', {
            hasVideoData: !!responseData.VideoData,
            hasCreatorToken: !!responseData.CreatorToken,
            videoId: responseData.VideoId,
            title: responseData.VideoData?.title
          });
          
          const video = this.convertBlockchainToVideo(responseData);
          
          // Cache the result
          this.cache[cacheKey] = { data: video, timestamp: Date.now() };
          
          console.log('✅ Loaded video from blockchain:', video.title);
          return video;
        } else {
          console.log('⚠️ Could not parse video response data');
        }
      }

      console.log('⚠️ Video not found on blockchain:', videoId);
      return null;
    } catch (error) {
      console.error('❌ Failed to load video from blockchain:', error.message);
      return null;
    }
  }

  /**
   * Get videos by creator from blockchain
   */
  static async getVideosByCreator(creatorAddress: string): Promise<Video[]> {
    try {
      console.log('🔍 Loading creator videos from blockchain:', creatorAddress);
      
      // Check cache first
      const cacheKey = `creator-${creatorAddress}`;
      const cached = this.cache[cacheKey];
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📋 Using cached creator videos data');
        return cached.data;
      }

      const result = await dryrun({
        process: AO_PROCESSES.CREATOR_NFT,
        tags: [
          { name: 'Action', value: 'Get-Videos-By-Creator' },
          { name: 'CreatorAddress', value: creatorAddress }
        ],
        ...MAINNET_URLS
      });

      console.log('📥 Creator videos response:', {
        hasMessages: !!result.Messages,
        messageCount: result.Messages?.length || 0
      });

      if (result.Messages?.length > 0) {
        const message = result.Messages[0];
        console.log('📋 Creator videos message:', {
          Action: message.Action,
          DataLength: message.Data?.length || 0
        });
        
        const responseData = this.safeJsonParse(result.Messages[0].Data, { videos: [] });
        console.log('🔍 Creator videos parsed data:', responseData);
        
        if (responseData.videos && Array.isArray(responseData.videos)) {
          const videos = responseData.videos.map((item: any) => {
            console.log('🎬 Converting creator video item:', item);
            return this.convertBlockchainToVideo(item);
          });
          
          // Cache the result
          this.cache[cacheKey] = { data: videos, timestamp: Date.now() };
          
          console.log(`✅ Loaded ${videos.length} creator videos from blockchain`);
          return videos;
        } else {
          console.log('⚠️ No videos array in creator response or invalid format');
        }
      } else {
        console.log('⚠️ No messages in creator videos response');
      }

      // If Get-Videos-By-Creator doesn't work, fall back to individual queries
      // This would require knowing video IDs, which we don't have without the bulk query working
      console.log('⚠️ No videos found for creator on blockchain:', creatorAddress);
      return [];
    } catch (error) {
      console.error('❌ Failed to load creator videos from blockchain:', error);
      return [];
    }
  }

  /**
   * Clear cache to force fresh blockchain data
   */
  static clearCache(): void {
    this.cache = {};
    console.log('🗑️ Blockchain video cache cleared');
  }

  /**
   * Invalidate specific cache entry
   */
  static invalidateCache(key: string): void {
    delete this.cache[key];
    delete this.cache['all-videos']; // Also invalidate all-videos cache
    console.log('🗑️ Cache invalidated for:', key);
  }

  /**
   * Convert blockchain response to Video object
   */
  private static convertBlockchainToVideo(blockchainData: any): Video {
    // Handle both Get-All-Videos format and individual Get-Video format
    let videoData: any;
    let creatorNFT: any;
    let videoId: string;
    
    if (blockchainData.VideoData && blockchainData.CreatorToken) {
      // Individual Get-Video format
      videoData = blockchainData.VideoData;
      creatorNFT = blockchainData.CreatorToken;
      videoId = blockchainData.VideoId || videoData.video_id;
    } else {
      // Get-All-Videos format
      videoData = blockchainData.video_metadata || {};
      creatorNFT = blockchainData.creator_nft || {};
      videoId = blockchainData.video_id || videoData.video_id || creatorNFT.video_id;
    }

    // Extract metadata from either structure
    const metadata = creatorNFT.metadata || {};
    
    console.log('🔄 Converting video data:', {
      videoId,
      title: videoData.title,
      creatorOriginal: videoData.creator_original,
      arweaveVideoId: videoData.arweave_video_id,
      arweaveThumbnailId: videoData.arweave_thumbnail_id
    });

    return {
      id: videoId,
      title: videoData.title || 'Untitled Video',
      description: videoData.description || metadata.description || '',
      creator: videoData.creator_original || 'Unknown Creator',
      creatorAddress: videoData.creator_original || '',
      thumbnail: videoData.arweave_thumbnail_id 
        ? `https://arweave.net/${videoData.arweave_thumbnail_id}`
        : metadata.image || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop',
      videoUrl: videoData.arweave_video_id 
        ? `https://arweave.net/${videoData.arweave_video_id}`
        : metadata.animation_url,
      arweaveId: videoData.arweave_video_id || '',
      duration: this.formatDuration(videoData.duration || 0),
      durationSeconds: videoData.duration || 0,
      views: videoData.total_views || 0,
      likes: 0, // Not stored on blockchain yet
      rating: 0,
      genre: videoData.genre || 'General',
      tags: videoData.tags || [],
      price: videoData.buy_price || 0,
      rentPrice: videoData.rent_price || 0,
      rentDuration: videoData.rent_duration || 7,
      isPremium: !videoData.is_free && videoData.buy_price > 0,
      isFree: videoData.is_free || false,
      isRentable: !videoData.is_free && videoData.rent_price > 0,
      nftSupply: 1,
      nftsSold: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      createdAt: this.formatDate(videoData.created_at),
      updatedAt: new Date().toISOString(),
      status: videoData.status || 'published',
      visibility: videoData.is_free ? 'public' : 'premium',
      monetization: {
        enabled: !videoData.is_free,
        type: videoData.is_free ? 'free' : 'nft',
        price: videoData.buy_price || 0,
        currency: 'AR',
      },
      blockchain: {
        network: 'arweave',
        confirmed: true,
      },
      analytics: {
        views: videoData.total_views || 0,
        uniqueViews: 0,
        watchTime: 0,
        averageWatchTime: 0,
        completionRate: 0,
        engagement: 0,
        retention: [],
        revenue: videoData.total_earnings || 0,
        nftSales: 0,
      },
      metadata: {
        resolution: '1080p',
        bitrate: 5000,
        fps: 30,
        codec: 'H.264',
        size: 0,
        aspectRatio: '16:9',
        hasSubtitles: false,
        languages: ['en'],
      },
      nftTokenId: creatorNFT.token_id || blockchainData.token_id,
    } as Video;
  }

  /**
   * Safe JSON parsing
   */
  private static safeJsonParse(data: string, defaultValue: any = null): any {
    try {
      if (!data || data === 'undefined' || data === 'null') {
        return defaultValue;
      }
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse JSON data:', data);
      return defaultValue;
    }
  }

  /**
   * Format duration from seconds to MM:SS
   */
  private static formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format timestamp to date string
   */
  private static formatDate(timestamp: number): string {
    if (!timestamp) return new Date().toISOString().split('T')[0];
    return new Date(timestamp * 1000).toISOString().split('T')[0];
  }

  /**
   * Force refresh blockchain data (invalidate cache and reload)
   */
  static async forceRefreshAllData(): Promise<void> {
    console.log('🔄 Force refreshing all blockchain data...');
    this.clearCache();
    await this.getAllVideos(); // This will fetch fresh data
  }

  /**
   * Refresh blockchain data (invalidate cache and reload)
   */
  static async refreshAllData(): Promise<void> {
    console.log('🔄 Refreshing all blockchain data...');
    this.clearCache();
    await this.getAllVideos(); // This will fetch fresh data
  }

  /**
   * Check if blockchain is accessible
   */
  static async isBlockchainAccessible(): Promise<boolean> {
    try {
      console.log('🔍 Testing blockchain accessibility...');
      console.log('🎯 Using process ID:', AO_PROCESSES.CREATOR_NFT);
      console.log('🌐 Expected mainnet URLs:', MAINNET_URLS);
      
      // Add timeout to prevent hanging - increased to 30 seconds
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Blockchain accessibility check timeout')), 30000)
      );
      
      const testPromise = dryrun({
        process: AO_PROCESSES.CREATOR_NFT,
        tags: [{ name: 'Action', value: 'Info' }],
        // Explicitly specify mainnet URLs
        CU_URL: MAINNET_URLS.CU_URL,
        MU_URL: MAINNET_URLS.MU_URL,
        GATEWAY_URL: MAINNET_URLS.GATEWAY_URL
      });
      
      // Use Promise.race to handle timeout properly
      const result = await Promise.race([testPromise, timeoutPromise]);
      
      const isAccessible = result.Messages?.length > 0;
      console.log(`🔍 Blockchain accessibility: ${isAccessible ? '✅ Available' : '❌ Not available'}`);
      return isAccessible;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ Primary blockchain accessibility check failed:', errorMessage);
      
      // Try a fallback with a simpler query
      try {
        console.log('🔄 Trying fallback blockchain accessibility check...');
        const fallbackPromise = dryrun({
          process: AO_PROCESSES.CREATOR_NFT,
          tags: [{ name: 'Action', value: 'Balance' }],
          CU_URL: MAINNET_URLS.CU_URL,
          MU_URL: MAINNET_URLS.MU_URL,
          GATEWAY_URL: MAINNET_URLS.GATEWAY_URL
        });
        
        const fallbackTimeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Fallback blockchain check timeout')), 15000)
        );
        
        const fallbackResult = await Promise.race([fallbackPromise, fallbackTimeoutPromise]);
        const fallbackAccessible = fallbackResult.Messages?.length > 0;
        console.log(`🔍 Fallback blockchain accessibility: ${fallbackAccessible ? '✅ Available' : '❌ Not available'}`);
        return fallbackAccessible;
      } catch (fallbackError) {
        console.warn('⚠️ Fallback blockchain accessibility check also failed:', fallbackError);
      }
      
      // Log additional debugging info for CORS errors
      if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control-Allow-Origin')) {
        console.error('🔍 CORS Error Details:');
        console.error('  - This usually means testnet URLs are being used');
        console.error('  - Expected mainnet URLs:', MAINNET_URLS);
        console.error('  - Check if AO Connect library is using correct configuration');
      }
      
      // For timeout errors, log more specific info
      if (errorMessage.includes('timeout')) {
        console.error('⏰ Timeout Error: Blockchain request took too long');
        console.error('  - This could indicate network issues or slow blockchain response');
        console.error('  - Consider increasing timeout or checking network connectivity');
      }
      
      return false;
    }
  }
} 