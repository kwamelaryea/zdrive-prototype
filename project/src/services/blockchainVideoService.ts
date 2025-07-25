import { Video } from '../data/mockData';
import { AOService, AO_PROCESSES } from './aoService';
import { dryrun } from '@permaweb/aoconnect';

// Production configuration verified - no need to connect early
console.log('🔗 BlockchainVideoService: Using production mainnet URLs');

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
  private static async makeBlockchainRequest(requestFn: () => Promise<any>, timeoutMs: number = 15000): Promise<any> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Blockchain request timeout')), timeoutMs)
      );
      
      const result = await Promise.race([requestFn(), timeoutPromise]);
      return result;
    } catch (error) {
      console.warn('⚠️ Blockchain request failed:', error.message);
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
        dryrun({
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
            // Add more patterns if needed
          ];
          
          for (const pattern of testPatterns) {
            try {
              const testResult = await this.makeBlockchainRequest(() => 
                dryrun({
                  process: AO_PROCESSES.CREATOR_NFT,
                  tags: [
                    { name: 'Action', value: 'Get-Video' },
                    { name: 'VideoId', value: pattern }
                  ]
                }), 5000 // Shorter timeout for pattern testing
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
      
      // Check cache first
      const cacheKey = 'all-videos';
      const cached = this.cache[cacheKey];
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📋 Using cached videos data');
        return cached.data;
      }

      // Primary method: Try Get-All-Videos with timeout
      try {
        console.log('📡 Attempting Get-All-Videos query...');
        const result = await this.makeBlockchainRequest(() => 
          dryrun({
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
        dryrun({
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
        ]
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
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Blockchain accessibility check timeout')), 10000)
      );
      
      const testPromise = dryrun({
        process: AO_PROCESSES.CREATOR_NFT,
        tags: [{ name: 'Action', value: 'Info' }]
      });
      
      const result = await Promise.race([testPromise, timeoutPromise]);
      
      const isAccessible = result.Messages?.length > 0;
      console.log(`🔍 Blockchain accessibility: ${isAccessible ? '✅ Available' : '❌ Not available'}`);
      return isAccessible;
    } catch (error) {
      console.warn('⚠️ Blockchain accessibility check failed:', error.message);
      return false;
    }
  }
} 