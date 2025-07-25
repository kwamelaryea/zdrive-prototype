import { Video } from '../data/mockData';
import { AOService } from './aoService';

/**
 * Service to handle video metadata with NFT as source of truth
 * but using local storage as efficient cache
 */
export class VideoMetadataService {
  private static readonly STORAGE_KEY = 'zdrive-video-metadata';
  private static readonly METADATA_VERSION = '1.0.0';

  /**
   * Store video metadata after NFT creation
   */
  static async storeVideoMetadata(video: Video): Promise<void> {
    try {
      console.log('💾 Storing video metadata for:', video.id);
      
      // Get existing metadata
      const existingMetadata = this.getStoredMetadata();
      
      // Add or update video metadata
      const videoMetadata = {
        id: video.id,
        videoId: video.id, // Ensure both id and videoId are set
        title: video.title,
        description: video.description,
        creator: video.creator,
        creatorAddress: video.creatorAddress,
        thumbnailUrl: video.thumbnail,
        videoUrl: video.videoUrl || `https://arweave.net/${video.arweaveId}`,
        arweaveVideoId: video.arweaveId,
        arweaveThumbnailId: video.arweaveId ? `${video.arweaveId}-thumb` : undefined,
        livepeerAssetId: video.livepeerAssetId,
        livepeerPlaybackId: video.livepeerPlaybackId,
        hlsUrl: video.hlsUrl,
        mp4Url: video.mp4Url,
        buyPrice: video.price,
        rentPrice: video.rentPrice,
        rentDuration: video.rentDuration,
        isFree: video.isFree,
        tags: video.tags,
        genre: video.genre,
        nftTokenId: video.nftTokenId,
        createdAt: video.createdAt,
        updatedAt: new Date().toISOString(),
        version: this.METADATA_VERSION
      };

      existingMetadata[video.id] = videoMetadata;
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingMetadata));
      }
      
      console.log('✅ Video metadata stored successfully');
    } catch (error) {
      console.error('Failed to store video metadata:', error);
    }
  }

  /**
   * Get video metadata from storage
   */
  static getVideoMetadata(videoId: string): any | null {
    try {
      const metadata = this.getStoredMetadata();
      return metadata[videoId] || null;
    } catch (error) {
      console.error('Failed to get video metadata:', error);
      return null;
    }
  }

  /**
   * Get all video metadata
   */
  static getAllVideoMetadata(): Record<string, any> {
    try {
      return this.getStoredMetadata();
    } catch (error) {
      console.error('Failed to get all video metadata:', error);
      return {};
    }
  }

  /**
   * Get videos by creator
   */
  static getVideosByCreator(creatorAddress: string): any[] {
    try {
      const metadata = this.getStoredMetadata();
      return Object.values(metadata).filter(
        (video: any) => video.creatorAddress === creatorAddress
      );
    } catch (error) {
      console.error('Failed to get videos by creator:', error);
      return [];
    }
  }

  /**
   * Update video metadata
   */
  static async updateVideoMetadata(videoId: string, updates: Partial<any>): Promise<boolean> {
    try {
      console.log('📝 Updating video metadata for:', videoId, updates);
      
      const existingMetadata = this.getStoredMetadata();
      const currentMetadata = existingMetadata[videoId];
      
      if (!currentMetadata) {
        console.warn('Video metadata not found for:', videoId);
        return false;
      }

      // Update metadata
      existingMetadata[videoId] = {
        ...currentMetadata,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingMetadata));
      }

      console.log('✅ Video metadata updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update video metadata:', error);
      return false;
    }
  }

  /**
   * Delete video metadata
   */
  static async deleteVideoMetadata(videoId: string): Promise<boolean> {
    try {
      const existingMetadata = this.getStoredMetadata();
      delete existingMetadata[videoId];
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingMetadata));
      }

      console.log('✅ Video metadata deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete video metadata:', error);
      return false;
    }
  }

  /**
   * Verify metadata against blockchain (future implementation)
   */
  static async verifyMetadataOnChain(videoId: string): Promise<boolean> {
    try {
      // For now, just check if NFT exists
      const videoDetails = await AOService.getVideoDetails(videoId);
      return !!videoDetails;
    } catch (error) {
      console.error('Failed to verify metadata on chain:', error);
      return false;
    }
  }

  /**
   * Get stored metadata from localStorage
   */
  private static getStoredMetadata(): Record<string, any> {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to parse stored metadata:', error);
      return {};
    }
  }

  /**
   * Clear all metadata (for debugging)
   */
  static clearAllMetadata(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    console.log('🧹 All video metadata cleared');
  }

  /**
   * Export metadata (for backup/migration)
   */
  static exportMetadata(): string {
    return JSON.stringify(this.getStoredMetadata(), null, 2);
  }

  /**
   * Import metadata (for backup/migration)
   */
  static importMetadata(metadataJson: string): boolean {
    try {
      const metadata = JSON.parse(metadataJson);
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metadata));
      }
      console.log('✅ Metadata imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import metadata:', error);
      return false;
    }
  }
}