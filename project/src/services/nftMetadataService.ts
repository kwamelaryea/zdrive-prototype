import { message, result } from '@permaweb/aoconnect';
import { AO_PROCESSES } from './aoService';
import { Video } from '../data/mockData';

export interface NFTMetadata {
  tokenId: string;
  videoId: string;
  title: string;
  description: string;
  creator: string;
  creatorAddress: string;
  thumbnailUrl: string;
  videoUrl: string;
  arweaveVideoId: string;
  arweaveThumbnailId: string;
  livepeerAssetId?: string;
  livepeerPlaybackId?: string;
  hlsUrl?: string;
  buyPrice: number;
  rentPrice: number;
  rentDuration: number;
  isFree: boolean;
  tags: string[];
  genre: string;
  createdAt: string;
  updatedAt: string;
}

export class NFTMetadataService {
  /**
   * Fetch video metadata from NFT on blockchain (source of truth)
   */
  static async getVideoMetadataFromNFT(videoId: string): Promise<NFTMetadata | null> {
    try {
      console.log('🔍 Fetching video metadata from NFT for videoId:', videoId);
      
      // Validate process ID first
      if (!AO_PROCESSES.CREATOR_NFT || AO_PROCESSES.CREATOR_NFT.length !== 43) {
        throw new Error('Invalid Creator NFT process ID');
      }

      // For now, return null since the AO processes may not support these queries yet
      // This prevents the ZodError and allows the app to function with local storage
      console.log('⚠️ NFT metadata query not yet implemented in AO processes for videoId:', videoId);
      console.log('📚 Using local storage as fallback for now');
      return null;
      
      // Uncomment this when AO processes support these queries:
      /*
      const messageId = await message({
        process: AO_PROCESSES.CREATOR_NFT,
        tags: [
          { name: 'Action', value: 'Get-Video-Metadata' },
          { name: 'VideoId', value: videoId }
        ],
        data: '',
      });

      const response = await result({ 
        message: messageId, 
        process: AO_PROCESSES.CREATOR_NFT 
      });

      if (response.Messages?.length > 0) {
        const messageData = response.Messages[0].Data;
        if (messageData && messageData !== 'undefined') {
          try {
            const metadata = JSON.parse(messageData);
            console.log('✅ NFT metadata retrieved:', metadata);
            return metadata;
          } catch (parseError) {
            console.warn('Failed to parse NFT metadata:', parseError);
          }
        }
      }

      console.log('⚠️ No metadata found for videoId:', videoId);
      return null;
      */
    } catch (error) {
      console.error('Failed to fetch NFT metadata:', error);
      return null;
    }
  }

  /**
   * Fetch all videos from NFTs (blockchain as source of truth)
   */
  static async getAllVideosFromNFTs(): Promise<Video[]> {
    try {
      console.log('🔍 Fetching all videos from NFT metadata...');
      
      // Validate process ID first
      if (!AO_PROCESSES.CREATOR_NFT || AO_PROCESSES.CREATOR_NFT.length !== 43) {
        throw new Error('Invalid Creator NFT process ID');
      }

      // For now, return empty array since the AO processes may not support these queries yet
      // This prevents the ZodError and allows the app to function with local storage
      console.log('⚠️ NFT metadata queries not yet implemented in AO processes');
      console.log('📚 Using local storage as fallback for now');
      return [];
      
      // Uncomment this when AO processes support these queries:
      /*
      const messageId = await message({
        process: AO_PROCESSES.CREATOR_NFT,
        tags: [
          { name: 'Action', value: 'Get-All-Videos' }
        ],
        data: '',
      });

      const response = await result({ 
        message: messageId, 
        process: AO_PROCESSES.CREATOR_NFT 
      });

      if (response.Messages?.length > 0) {
        const messageData = response.Messages[0].Data;
        if (messageData && messageData !== 'undefined') {
          try {
            const nftVideos = JSON.parse(messageData);
            console.log('✅ Retrieved videos from NFT metadata:', nftVideos.length);
            
            // Convert NFT metadata to Video objects
            return nftVideos.map((nft: NFTMetadata) => this.convertNFTToVideo(nft));
          } catch (parseError) {
            console.warn('Failed to parse all videos from NFT:', parseError);
          }
        }
      }

      console.log('⚠️ No videos found in NFT metadata');
      return [];
      */
    } catch (error) {
      console.error('Failed to fetch all videos from NFT:', error);
      return [];
    }
  }

  /**
   * Fetch videos by creator from NFTs
   */
  static async getVideosByCreatorFromNFTs(creatorAddress: string): Promise<Video[]> {
    try {
      console.log('🔍 Fetching videos by creator from NFT metadata:', creatorAddress);
      
      // Validate process ID first
      if (!AO_PROCESSES.CREATOR_NFT || AO_PROCESSES.CREATOR_NFT.length !== 43) {
        throw new Error('Invalid Creator NFT process ID');
      }

      // For now, return empty array since the AO processes may not support these queries yet
      // This prevents the ZodError and allows the app to function with local storage
      console.log('⚠️ Creator videos query not yet implemented in AO processes');
      console.log('📚 Using local storage as fallback for now');
      return [];
      
      // Uncomment this when AO processes support these queries:
      /*
      const messageId = await message({
        process: AO_PROCESSES.CREATOR_NFT,
        tags: [
          { name: 'Action', value: 'Get-Videos-By-Creator' },
          { name: 'CreatorAddress', value: creatorAddress }
        ],
        data: '',
      });

      const response = await result({ 
        message: messageId, 
        process: AO_PROCESSES.CREATOR_NFT 
      });

      if (response.Messages?.length > 0) {
        const messageData = response.Messages[0].Data;
        if (messageData && messageData !== 'undefined') {
          try {
            const creatorVideos = JSON.parse(messageData);
            console.log('✅ Retrieved creator videos from NFT metadata:', creatorVideos.length);
            return creatorVideos.map((nft: NFTMetadata) => this.convertNFTToVideo(nft));
          } catch (parseError) {
            console.warn('Failed to parse creator videos from NFT:', parseError);
          }
        }
      }

      return [];
      */
    } catch (error) {
      console.error('Failed to fetch creator videos from NFT:', error);
      return [];
    }
  }

  /**
   * Convert NFT metadata to Video object
   */
  static convertNFTToVideo(nft: NFTMetadata): Video {
    return {
      id: nft.videoId,
      title: nft.title,
      description: nft.description,
      creator: nft.creator || 'Unknown Creator',
      creatorAddress: nft.creatorAddress,
      thumbnail: nft.thumbnailUrl,
      videoUrl: nft.videoUrl,
      arweaveId: nft.arweaveVideoId,
      duration: '0:00', // Will be updated when video loads
      durationSeconds: 0,
      views: 0, // Will be tracked separately
      likes: 0, // Will be tracked separately
      rating: 0,
      genre: nft.genre || 'General',
      tags: nft.tags || [],
      price: nft.buyPrice,
      rentPrice: nft.rentPrice,
      rentDuration: nft.rentDuration,
      isPremium: !nft.isFree && nft.buyPrice > 0,
      isFree: nft.isFree,
      isRentable: !nft.isFree && nft.rentPrice > 0,
      nftSupply: 1,
      nftsSold: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      createdAt: nft.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: nft.updatedAt || new Date().toISOString(),
      status: 'published',
      visibility: nft.isFree ? 'public' : 'premium',
      monetization: {
        enabled: !nft.isFree,
        type: nft.isFree ? 'free' : 'nft',
        price: nft.buyPrice,
        currency: 'AR',
      },
      blockchain: {
        network: 'arweave',
        confirmed: true,
      },
      analytics: {
        views: 0,
        uniqueViews: 0,
        watchTime: 0,
        averageWatchTime: 0,
        completionRate: 0,
        engagement: 0,
        retention: [],
        revenue: 0,
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
      // Livepeer metadata
      livepeerAssetId: nft.livepeerAssetId,
      livepeerPlaybackId: nft.livepeerPlaybackId,
      hlsUrl: nft.hlsUrl,
      mp4Url: nft.livepeerPlaybackId ? `https://livepeercdn.studio/recordings/${nft.livepeerPlaybackId}/index.mp4` : undefined,
      nftTokenId: nft.tokenId,
    } as Video;
  }

  /**
   * Update video metadata on blockchain (NFT)
   */
  static async updateVideoMetadata(videoId: string, updates: Partial<NFTMetadata>): Promise<boolean> {
    try {
      console.log('📝 Updating video metadata on blockchain:', videoId, updates);
      
      // Validate process ID first
      if (!AO_PROCESSES.CREATOR_NFT || AO_PROCESSES.CREATOR_NFT.length !== 43) {
        throw new Error('Invalid Creator NFT process ID');
      }

      // For now, return false since the AO processes may not support these queries yet
      // This prevents the ZodError and allows the app to function with local storage
      console.log('⚠️ Video metadata update not yet implemented in AO processes');
      console.log('📚 Using local storage as fallback for now');
      return false;
      
      // Uncomment this when AO processes support these queries:
      /*
      const messageId = await message({
        process: AO_PROCESSES.CREATOR_NFT,
        tags: [
          { name: 'Action', value: 'Update-Video-Metadata' },
          { name: 'VideoId', value: videoId },
          ...Object.entries(updates).map(([key, value]) => ({
            name: key,
            value: typeof value === 'string' ? value : JSON.stringify(value)
          }))
        ],
        data: JSON.stringify(updates),
      });

      const response = await result({ 
        message: messageId, 
        process: AO_PROCESSES.CREATOR_NFT 
      });

      if (response.Messages?.length > 0) {
        const messageData = response.Messages[0].Data;
        if (messageData && messageData !== 'undefined') {
          try {
            const result = JSON.parse(messageData);
            return result.success === true;
          } catch (parseError) {
            console.warn('Failed to parse update result:', parseError);
          }
        }
      }

      return true; // Assume success if no clear failure
      */
    } catch (error) {
      console.error('Failed to update video metadata:', error);
      return false;
    }
  }
}