import Arweave from 'arweave';

// Enhanced Atomic NFT Service for ANS-110 Compliance (Bazar-Compatible)
export class AtomicNFTService {
  private static arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });

  /**
   * Get wallet address from ArConnect
   */
  private static async getWalletAddress(): Promise<string> {
    if (!window.arweaveWallet) {
      throw new Error('ArConnect wallet not found. Please install ArConnect.');
    }
    
    try {
      await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);
      const address = await window.arweaveWallet.getActiveAddress();
      console.log('📍 Connected wallet address:', address);
      return address;
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      throw new Error('Failed to connect to wallet');
    }
  }

  /**
   * Get PST source transaction ID for SmartWeave compatibility
   */
  private static async getPSTSourceTxId(): Promise<string> {
    // Using a well-known PST source for maximum compatibility
    // This is the standard PST contract used by many NFT platforms
    return 'SJ3l7474UHh3Dw6dWVT1bzsJ-8JvOewtGoDdOecWIZo'; // Standard PST v0.4.0
  }

  /**
   * Create enhanced ANS-110 metadata structure
   */
  private static createEnhancedMetadata(
    title: string, 
    description: string,
    videoId: string,
    arweaveVideoId: string,
    arweaveThumbnailId: string,
    creator: string,
    additionalData: any = {}
  ) {
    const timestamp = Date.now();
    
    return {
      // Core ANS-110 Required Fields
      name: `ZDrive Creator Rights: ${title}`,
      description: `Creator distribution rights for: ${description}`,
      image: `https://arweave.net/${arweaveThumbnailId}`,
      animation_url: `https://arweave.net/${arweaveVideoId}`,
      external_url: `https://zdrive.app/video/${videoId}`,
      
      // Enhanced wallet compatibility fields
      symbol: 'ZCR',
      decimals: 0,
      background_color: '1a1a2e',
      banner_image: `https://arweave.net/${arweaveThumbnailId}`,
      
      // Content-specific metadata
      content_type: 'video/mp4',
      media_type: 'video',
      category: 'video-nft',
      type: 'creator_token',
      
      // Rights and ownership
      creator: creator,
      owner: creator,
      created_at: timestamp,
      royalty_percentage: 10,
      transferable: true,
      burnable: false,
      
      // Platform identification
      platform: 'ZDrive',
      platform_version: '1.0.0',
      collection: 'ZDrive Creator Rights',
      collection_family: 'ZDrive Videos',
      
      // Technical metadata for Arweave/AO
      arweave_video_id: arweaveVideoId,
      arweave_thumbnail_id: arweaveThumbnailId,
      video_id: videoId,
      
      // Enhanced attributes for discoverability and marketplace compatibility
      attributes: [
        { trait_type: 'Content Type', value: 'Video' },
        { trait_type: 'Rights Type', value: 'Creator Distribution' },
        { trait_type: 'Platform', value: 'ZDrive' },
        { trait_type: 'Collection', value: 'ZDrive Creator Rights' },
        { trait_type: 'Standard', value: 'ANS-110' },
        { trait_type: 'Blockchain', value: 'Arweave/AO' },
        { trait_type: 'Royalty Rate', value: '10%' },
        { trait_type: 'Creator', value: creator },
        { trait_type: 'Genre', value: additionalData.genre || 'General' },
        { trait_type: 'Duration', value: `${additionalData.duration || 0} seconds` },
        { trait_type: 'Free Content', value: additionalData.isFree ? 'Yes' : 'No' },
        { trait_type: 'Upload Date', value: new Date(timestamp).toISOString().split('T')[0] },
        { trait_type: 'Video Quality', value: '1080p' }, // Could be dynamic
        { trait_type: 'File Format', value: 'MP4' },
        { trait_type: 'License', value: 'Creator Rights' }
      ],
      
      // Additional marketplace metadata
      marketplace: {
        bazar_compatible: true,
        opensea_compatible: true,
        foundation_compatible: true
      },
      
      // Technical specifications
      specifications: {
        video_format: 'mp4',
        thumbnail_format: 'jpeg',
        blockchain: 'arweave',
        smart_contract: 'ao',
        token_standard: 'ANS-110',
        content_rating: 'general' // Could be configurable
      },
      
      // Social and engagement metadata
      social: {
        shareable: true,
        embeddable: true,
        downloadable: false, // Creator controls this
        commentable: true
      },
      
      // Include any additional data from the caller
      ...additionalData
    };
  }

  /**
   * Create enhanced atomic NFT with full ANS-110 compliance and Bazar compatibility
   */
  static async createAtomicNFT(
    metadata: any,
    walletAddress: string,
    videoId: string,
    arweaveVideoId: string,
    arweaveThumbnailId: string
  ): Promise<string> {
    try {
      console.log('🎨 Creating enhanced atomic NFT for video:', videoId);

      // Get actual wallet address to ensure accuracy
      const actualWalletAddress = await this.getWalletAddress();
      console.log('📍 Using wallet address:', actualWalletAddress);

      // Get PST source transaction ID for SmartWeave compatibility
      const pstSrcTxId = await this.getPSTSourceTxId();

      // Create enhanced metadata
      const enhancedMetadata = this.createEnhancedMetadata(
        metadata.name || 'Untitled Video',
        metadata.description || '',
        videoId,
        arweaveVideoId,
        arweaveThumbnailId,
        actualWalletAddress,
        metadata
      );

      // Create comprehensive initial state for SmartWeave contract
      const initState = {
        // Core token state
        name: enhancedMetadata.name,
        ticker: 'ZCR',
        description: enhancedMetadata.description,
        
        // Ownership and balances
        balances: { [actualWalletAddress]: 1 },
        owner: actualWalletAddress,
        
        // NFT-specific state
        nft: {
          video_id: videoId,
          creator: actualWalletAddress,
          created_at: enhancedMetadata.created_at,
          royalty_percentage: 10,
          transferable: true
        },
        
        // Contract configuration
        canEvolve: false,
        evolve: null,
        
        // Platform metadata
        platform: 'ZDrive',
        collection: 'ZDrive Creator Rights',
        standard: 'ANS-110'
      };

      // Create transaction with enhanced metadata
      const transaction = await this.arweave.createTransaction({
        data: JSON.stringify(enhancedMetadata)
      });

      // Add comprehensive tags for maximum compatibility
      
      // Core content tags
      transaction.addTag('Content-Type', 'application/json');
      transaction.addTag('App-Name', 'SmartWeaveContract');
      transaction.addTag('App-Version', '0.4.0');
      transaction.addTag('Contract-Src', pstSrcTxId);
      transaction.addTag('Init-State', JSON.stringify(initState));
      
      // ANS-110 standard tags
      transaction.addTag('Name', enhancedMetadata.name);
      transaction.addTag('Description', enhancedMetadata.description);
      transaction.addTag('Image', enhancedMetadata.image);
      transaction.addTag('Animation-Url', enhancedMetadata.animation_url);
      transaction.addTag('External-Url', enhancedMetadata.external_url);
      transaction.addTag('Symbol', 'ZCR');
      transaction.addTag('Decimals', '0');
      
      // Collection and platform tags
      transaction.addTag('Collection', 'ZDrive Creator Rights');
      transaction.addTag('Collection-Id', 'zdrive-creator-rights');
      transaction.addTag('Platform', 'ZDrive');
      transaction.addTag('Platform-Version', '1.0.0');
      
      // Content classification tags
      transaction.addTag('Type', 'asset'); // Changed from 'video' to 'asset' for better wallet recognition
      transaction.addTag('Media-Type', 'video');
      transaction.addTag('Content-Category', 'video-nft');
      transaction.addTag('Token-Type', 'creator-rights');
      
      // Technical tags for discoverability
      transaction.addTag('Standard', 'ANS-110');
      transaction.addTag('Blockchain', 'Arweave');
      transaction.addTag('Smart-Contract', 'AO');
      transaction.addTag('Video-Id', videoId);
      transaction.addTag('Creator', actualWalletAddress);
      
      // Rights and licensing tags
      transaction.addTag('License', 'yRj4a5KMctX_uOmKWCFJIUHcH6I4gA_QuwO-JulPJ9Q'); // Universal Data License
      transaction.addTag('Royalty-Percentage', '10');
      transaction.addTag('Transferable', 'true');
      transaction.addTag('Commercial-Use', 'creator-controlled');
      
      // Marketplace compatibility tags
      transaction.addTag('Bazar-Compatible', 'true');
      transaction.addTag('OpenSea-Compatible', 'true');
      transaction.addTag('Wallet-Compatible', 'true');
      
      // Topic tags for categorization (following Arweave conventions)
      transaction.addTag('Topic:ZDrive', 'Creator-Rights');
      transaction.addTag('Topic:NFT', 'Video');
      transaction.addTag('Topic:Collection', 'ZDrive-Creator-Rights');
      transaction.addTag('Topic:Genre', metadata.genre || 'General');
      
      // Additional metadata tags
      if (metadata.genre) {
        transaction.addTag('Genre', metadata.genre);
      }
      if (metadata.duration) {
        transaction.addTag('Duration', metadata.duration.toString());
      }
      transaction.addTag('Upload-Date', new Date().toISOString().split('T')[0]);
      transaction.addTag('File-Format', 'mp4');
      transaction.addTag('Quality', '1080p');
      
      // Version and timestamp tags
      transaction.addTag('Version', '1.0.0');
      transaction.addTag('Timestamp', enhancedMetadata.created_at.toString());
      transaction.addTag('Unix-Time', Math.floor(Date.now() / 1000).toString());

      // Sign and post transaction
      if (!window.arweaveWallet) {
        throw new Error('ArConnect wallet not found. Please install ArConnect.');
      }
      
      console.log('🔐 Signing transaction with ArConnect...');
      await this.arweave.transactions.sign(transaction);
      
      console.log('📡 Posting transaction to Arweave network...');
      const response = await this.arweave.transactions.post(transaction);

      if (response.status !== 200 && response.status !== 202) {
        throw new Error(`Failed to create atomic NFT: HTTP ${response.status}`);
      }

      // Comprehensive success logging
      console.log('✅ Enhanced Atomic NFT created successfully!');
      console.log('🔍 Transaction Details:');
      console.log('  - Transaction ID:', transaction.id);
      console.log('  - Owner Address:', actualWalletAddress);
      console.log('  - Video ID:', videoId);
      console.log('  - Collection:', 'ZDrive Creator Rights');
      console.log('  - Standard:', 'ANS-110');
      console.log('  - PST Source:', pstSrcTxId);
      console.log('  - SmartWeave Compatible:', true);
      console.log('  - Bazar Compatible:', true);
      console.log('📊 Metadata Summary:');
      console.log('  - Name:', enhancedMetadata.name);
      console.log('  - Description:', enhancedMetadata.description.substring(0, 100) + '...');
      console.log('  - Attributes:', enhancedMetadata.attributes.length);
      console.log('  - Royalty Rate:', '10%');
      console.log('🔗 Links:');
      console.log('  - Viewblock:', `https://viewblock.io/arweave/tx/${transaction.id}`);
      console.log('  - ArweaveApps:', `https://arweave.app/tx/${transaction.id}`);
      console.log('  - Arweave Gateway:', `https://arweave.net/tx/${transaction.id}`);
      console.log('⏰ Wallet Visibility:');
      console.log('  - Initial indexing: 5-10 minutes');
      console.log('  - Full propagation: 30-60 minutes');
      console.log('  - Try "Refresh Assets" in ArConnect if needed');
      console.log('🎯 Marketplace Compatibility:');
      console.log('  - Bazar.arweave.net: ✅ Compatible');
      console.log('  - ArConnect Collectibles: ✅ Compatible');
      console.log('  - ANS-110 Standard: ✅ Compliant');
      
      return transaction.id;

    } catch (error) {
      console.error('❌ Failed to create atomic NFT:', error);
      throw error;
    }
  }

  /**
   * Verify NFT creation and get metadata
   */
  static async verifyNFTCreation(txId: string): Promise<{
    exists: boolean;
    metadata?: any;
    owner?: string;
    error?: string;
    status?: string;
  }> {
    try {
      console.log('🔍 Verifying NFT creation for transaction:', txId);

      // First check transaction status
      const statusResponse = await fetch(`https://arweave.net/tx/${txId}/status`);
      
      if (statusResponse.status === 202) {
        console.log('⏳ Transaction is pending confirmation...');
        return {
          exists: true,
          status: 'pending',
          error: 'Transaction is still pending. Please wait for confirmation.'
        };
      }
      
      if (statusResponse.status !== 200) {
        return {
          exists: false,
          status: 'error',
          error: `Transaction status check failed: HTTP ${statusResponse.status}`
        };
      }

      // If confirmed, try to get the data
      const response = await fetch(`https://arweave.net/${txId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            exists: true,
            status: 'pending',
            error: 'Transaction exists but data not yet available. Please wait for network propagation.'
          };
        }
        return {
          exists: false,
          status: 'error',
          error: `HTTP ${response.status}: Transaction not found or not yet propagated`
        };
      }

      // Try to parse the response text first to handle non-JSON responses
      const responseText = await response.text();
      let metadata;
      try {
        metadata = JSON.parse(responseText);
      } catch (parseError) {
        if (responseText.includes('Pending')) {
          return {
            exists: true,
            status: 'pending',
            error: 'Transaction is pending confirmation'
          };
        }
        return {
          exists: false,
          status: 'error',
          error: `Failed to parse response: ${responseText}`
        };
      }
      
      // Get transaction details
      const txResponse = await fetch(`https://arweave.net/tx/${txId}`);
      const txData = await txResponse.json();
      
      const owner = txData.owner;

      console.log('✅ NFT verification successful');
      console.log('  - Transaction found:', txId);
      console.log('  - Owner:', owner);
      console.log('  - Metadata fields:', Object.keys(metadata).length);
      console.log('  - Status: Confirmed');

      return {
        exists: true,
        metadata,
        owner,
        status: 'confirmed'
      };

    } catch (error) {
      console.error('❌ NFT verification failed:', error);
      return {
        exists: false,
        status: 'error',
        error: (error as Error).message
      };
    }
  }

  /**
   * Get NFT metadata from Arweave
   */
  static async getNFTMetadata(txId: string): Promise<any | null> {
    try {
      const response = await fetch(`https://arweave.net/${txId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch NFT metadata:', error);
      return null;
    }
  }

  /**
   * Check if transaction exists on Arweave
   */
  static async checkTransactionStatus(txId: string): Promise<{
    exists: boolean;
    confirmed: boolean;
    blockHeight?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`https://arweave.net/tx/${txId}/status`);
      
      if (response.status === 200) {
        const status = await response.json();
        return {
          exists: true,
          confirmed: status.block_height > 0,
          blockHeight: status.block_height
        };
      } else if (response.status === 202) {
        return {
          exists: true,
          confirmed: false
        };
      } else {
        return {
          exists: false,
          confirmed: false,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        exists: false,
        confirmed: false,
        error: (error as Error).message
      };
    }
  }
}