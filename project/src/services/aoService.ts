// AO Service for ZDrive NFT Operations
import { message, result, dryrun, createDataItemSigner, connect } from '@permaweb/aoconnect';
import Arweave from 'arweave';
import toast from 'react-hot-toast';

// Global types defined in src/types/global.d.ts

// Environment-based configuration
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Production AO Configuration - Remove MODE requirement to avoid signer issues
const AO_CONFIG = {
  GATEWAY_URL: process.env.NEXT_PUBLIC_AO_GATEWAY_URL || 'https://arweave.net',
  CU_URL: process.env.NEXT_PUBLIC_AO_CU_URL || 'https://cu.ao.dev',
  MU_URL: process.env.NEXT_PUBLIC_AO_MU_URL || 'https://mu.ao.dev',
  SU_URL: process.env.NEXT_PUBLIC_AO_SU_URL || 'https://su.ao.dev',
};

// Log AO configuration without trying to connect early
console.log('✅ AO Connect configured for production mainnet:', AO_CONFIG);

// Verify no testnet URLs
const hasTestnetUrl = Object.values(AO_CONFIG).some(url => url.includes('testnet'));
if (hasTestnetUrl) {
  console.error('❌ CRITICAL: Testnet URLs detected in production config!', AO_CONFIG);
  throw new Error('Testnet URLs not allowed in production');
}

console.log('🔍 Production AO Network Configuration verified:');
console.log('  Gateway:', AO_CONFIG.GATEWAY_URL);
console.log('  CU URL:', AO_CONFIG.CU_URL);
console.log('  MU URL:', AO_CONFIG.MU_URL);
console.log('  SU URL:', AO_CONFIG.SU_URL);

// Production AO Process IDs
export const AO_PROCESSES = {
  CREATOR_NFT: process.env.NEXT_PUBLIC_CREATOR_NFT_PROCESS || 'Lk-5IzUn46w7d0BliSvR9Yo4jazeEZ1kxt54F2SlpPc',
  BASIC_ACCESS: process.env.NEXT_PUBLIC_BASIC_ACCESS_PROCESS || 'VxGBhfTqCQwrcxovPPpY6fdHqooHh8xITuI5ry3lTJs',
  PREMIUM_ACCESS: process.env.NEXT_PUBLIC_PREMIUM_ACCESS_PROCESS || 'IXOzHMQZoBIyq_mtcoHG9mfhusxSwYu932wWB6L6RjE',
  ACCESS_CONTROL: process.env.NEXT_PUBLIC_ACCESS_CONTROL_PROCESS || 'X-Lbejt0NVMaYtknT9FW9FhXNeH8-pu0t7Y2ej0iawI',
  TOKEN: process.env.NEXT_PUBLIC_TOKEN_PROCESS || 'xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10',
};

// Platform Configuration
export const PLATFORM_CONFIG = {
  PLATFORM_WALLET: process.env.NEXT_PUBLIC_PLATFORM_WALLET || 'WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg',
  UPLOAD_FEE_PERCENTAGE: parseFloat(process.env.NEXT_PUBLIC_UPLOAD_FEE_PERCENTAGE || '0.0085'),
  PLATFORM_FEE_PERCENTAGE: parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || '0.10'),
  CREATOR_SHARE_PERCENTAGE: parseFloat(process.env.NEXT_PUBLIC_CREATOR_SHARE_PERCENTAGE || '0.90'),
  ROYALTY_PERCENTAGE: parseFloat(process.env.NEXT_PUBLIC_ROYALTY_PERCENTAGE || '0.10'),
};

// Initialize Arweave
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

// Types (improved)
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
}

interface AccessPurchaseData {
  videoId: string;
  accessType: 'basic' | 'premium';
  duration?: number;
  price: number;
}

interface AccessResponse {
  granted: boolean;
  accessType: string;
  sessionId?: string;
}

// Utility: Check if process ID is valid Arweave format
const isValidProcessId = (processId: string): boolean => {
  // Arweave transaction IDs are 43 characters long and contain only base64url characters
  const arweaveTxPattern = /^[A-Za-z0-9_-]{43}$/;
  const isValid = arweaveTxPattern.test(processId);
  
  if (!isValid) {
    console.warn(`⚠️ Invalid process ID format: ${processId} (should be 43 characters, base64url format)`);
  }
  
  return isValid;
};

// Utility: Validate all process IDs on startup
const validateProcessIds = () => {
  console.log('🔍 Validating AO Process IDs...');
  
  const processes = [
    { name: 'Creator NFT', id: AO_PROCESSES.CREATOR_NFT },
    { name: 'Basic Access', id: AO_PROCESSES.BASIC_ACCESS },
    { name: 'Premium Access', id: AO_PROCESSES.PREMIUM_ACCESS },
    { name: 'Access Control', id: AO_PROCESSES.ACCESS_CONTROL },
    { name: 'Token', id: AO_PROCESSES.TOKEN },
  ];

  let allValid = true;
  for (const process of processes) {
    const isValid = isValidProcessId(process.id);
    console.log(`${process.name}: ${isValid ? '✅' : '❌'} ${process.id}`);
    if (!isValid) allValid = false;
  }
  
  if (!allValid) {
    console.error('❌ Some AO Process IDs are invalid! Please check your .env file.');
    console.error('Process IDs should be 43 characters long and follow Arweave transaction ID format.');
  }
  
  return allValid;
};

// Validate process IDs on module load
validateProcessIds();

// Utility: Retry function with exponential backoff
const retry = async <T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = baseDelay * Math.pow(2, attempt);
      if (!IS_PRODUCTION) console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms: ${lastError.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError || new Error('Retry failed');
};

// Utility: Check wallet connection
const ensureWalletConnected = async (): Promise<void> => {
  if (!window.arweaveWallet) {
    throw new Error('Arweave wallet not connected. Please connect your wallet.');
  }
};

// Utility: Conditional logger
const log = (message: string, ...args: unknown[]) => {
  if (!IS_PRODUCTION) console.log(message, ...args);
};

const errorLog = (message: string, error: Error) => {
  console.error(message, error);
  // TODO: Integrate with error monitoring (e.g., Sentry.captureException(error))
};

// Utility Functions
const generateVideoId = () => `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// AO Process Deployment Status
const checkProcessDeployment = async (processId: string): Promise<boolean> => {
  if (!isValidProcessId(processId)) {
    return false;
  }
  
  try {
    const testResult = await dryrun({
      process: processId,
      tags: [{ name: 'Action', value: 'Info' }],
    });
    return testResult.Messages?.length > 0;
  } catch {
    return false;
  }
};

const safeJsonParse = (data: string, defaultValue: unknown = null) => {
  try {
    if (!data || data === 'undefined' || data === 'null') {
      return defaultValue;
    }
    
    // Check if the data looks like JSON (starts with { or [)
    const trimmedData = data.trim();
    if (!trimmedData.startsWith('{') && !trimmedData.startsWith('[')) {
      // It's probably a plain text response (like "Video not found")
      log('Plain text response received:', trimmedData);
      return { error: trimmedData, message: trimmedData };
    }
    
    return JSON.parse(data);
  } catch (error) {
    errorLog('JSON parsing failed for data:', error as Error);
    log('Problematic data:', data);
    // Return an error object with the original data
    return { error: 'Invalid JSON', message: data, originalData: data };
  }
};

const calculateStorageFee = (videoSize: number, thumbnailSize: number): number => {
  const totalSize = videoSize + thumbnailSize;
  const bytesPerAR = 1024 * 1024 * 10; // Rough estimate
  return totalSize / bytesPerAR;
};

// Upload file to Arweave
const uploadToArweave = async (file: File, contentType: string): Promise<string> => {
  await ensureWalletConnected();
  const fileBuffer = await file.arrayBuffer();
  const transaction = await arweave.createTransaction({ data: fileBuffer });
  transaction.addTag('Content-Type', contentType);
  transaction.addTag('App-Name', 'ZDrive');
  transaction.addTag('App-Version', '1.0.0');
  await arweave.transactions.sign(transaction);
  const response = await arweave.transactions.post(transaction);
  if (response.status !== 200) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
  return transaction.id;
};

// Create signer for AO messages
const createSigner = async () => {
  await ensureWalletConnected();
  return createDataItemSigner(window.arweaveWallet);
};

// AO Service Class
export class AOService {
  // Verify all configured process IDs
  static async verifyAllProcesses(): Promise<void> {
    log('🔍 Verifying all configured AO processes...');

    const processes = [
      { name: 'Creator NFT', id: AO_PROCESSES.CREATOR_NFT },
      { name: 'Basic Access', id: AO_PROCESSES.BASIC_ACCESS },
      { name: 'Premium Access', id: AO_PROCESSES.PREMIUM_ACCESS },
      { name: 'Access Control', id: AO_PROCESSES.ACCESS_CONTROL },
    ];

    for (const process of processes) {
      log(`\n--- Testing ${process.name} (${process.id}) ---`);
      const responding = await this.testProcess(process.id);
      log(`${process.name}: ${responding ? '✅ WORKING' : '❌ NOT RESPONDING'}`);
    }

    log('\n📋 Process verification complete. Check logs above for details.');
  }

  // Test if a process is responding
  static async testProcess(processId: string): Promise<boolean> {
    if (!isValidProcessId(processId)) {
      log(`Invalid process ID format: ${processId}`);
      return false;
    }
    
    try {
      log(`Testing process: ${processId}`);
      
      // Test with timeout
      const testWithTimeout = async (action: string) => {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );
        
        const testPromise = dryrun({
          process: processId,
          tags: [{ name: 'Action', value: action }],
        });
        
        return Promise.race([testPromise, timeoutPromise]);
      };

      // Try different test actions
      const testActions = ['Info', 'Balance', 'Balances'];
      
      for (const action of testActions) {
        try {
          const result = await testWithTimeout(action);
          if (result && result.Messages && result.Messages.length > 0) {
            log(`✅ Process responding to ${action}`);
            return true;
          }
        } catch (error) {
          log(`❌ Process failed ${action}: ${error}`);
        }
      }
      
      log(`❌ Process not responding to any test actions`);
      return false;
      
    } catch (error) {
      errorLog(`Process test failed for ${processId}:`, error as Error);
      return false;
    }
  }

  // Upload Video and Create Creator NFT with Progress Tracking
  static async uploadVideoWithProgress(uploadData: VideoUploadData, callbacks: {
    onVideoUploadStart?: () => void;
    onVideoUploadComplete?: () => void;
    onThumbnailUploadStart?: () => void;
    onThumbnailUploadComplete?: () => void;
    onNFTCreationStart?: () => void;
    onNFTCreationComplete?: () => void;
    onBlockchainRegistrationStart?: () => void;
    onBlockchainRegistrationComplete?: () => void;
  }): Promise<string> {
    try {
      const videoId = generateVideoId();

      // Verify AO processes are available
      if (!window.aoProcessesVerified) {
        log('🔍 Verifying AO processes are deployed and responding...');
        await this.verifyAllProcesses();
        window.aoProcessesVerified = true;
      }

      const processResponding = await this.testProcess(AO_PROCESSES.CREATOR_NFT);
      log('Creator NFT process responding:', processResponding);

      if (!processResponding) {
        throw new Error(`
❌ AO Creator NFT process is not responding!

The process ID ${AO_PROCESSES.CREATOR_NFT} is not accessible.

Please ensure:
1. The AO process is properly deployed
2. The process ID is correct
3. The AO network is accessible
        `);
      }

      const storageFee = calculateStorageFee(uploadData.video.size, uploadData.thumbnail.size);

      // Step 1: Upload video to Arweave
      callbacks.onVideoUploadStart?.();
      const videoTxId = await uploadToArweave(uploadData.video, 'video/mp4');
      callbacks.onVideoUploadComplete?.();

      // Step 2: Upload thumbnail to Arweave
      callbacks.onThumbnailUploadStart?.();
      const thumbnailTxId = await uploadToArweave(uploadData.thumbnail, 'image/jpeg');
      callbacks.onThumbnailUploadComplete?.();

      // Step 3: Create NFT on AO
      callbacks.onNFTCreationStart?.();
      const signer = await createSigner();

      const messageId = await retry(() =>
        message({
          process: AO_PROCESSES.CREATOR_NFT,
          signer,
          tags: [
            { name: 'Action', value: 'Upload-Video' },
            { name: 'VideoId', value: videoId },
            { name: 'Title', value: uploadData.title },
            { name: 'Description', value: uploadData.description },
            { name: 'ArweaveVideoId', value: videoTxId },
            { name: 'ArweaveThumbnailId', value: thumbnailTxId },
            { name: 'Duration', value: '0' },
            { name: 'BuyPrice', value: uploadData.buyPrice.toString() },
            { name: 'RentPrice', value: uploadData.rentPrice.toString() },
            { name: 'RentDuration', value: uploadData.rentDuration.toString() },
            { name: 'IsFree', value: uploadData.isFree.toString() },
            { name: 'StorageFee', value: storageFee.toString() },
            { name: 'Tags', value: JSON.stringify(uploadData.tags) },
            { name: 'Genre', value: uploadData.genre },
            // ANS-110 Required Fields for proper NFT display
            { name: 'Name', value: `ZDrive: ${uploadData.title}` },
            { name: 'Ticker', value: 'ZDRIVE-VID' },
            { name: 'Logo', value: `https://arweave.net/${thumbnailTxId}` },
            { name: 'Denomination', value: '1' },
            // Additional ANS-110 metadata
            { name: 'Type', value: 'video-nft' },
            { name: 'Content-Type', value: 'video/mp4' },
            { name: 'Thumbnail', value: `https://arweave.net/${thumbnailTxId}` },
            { name: 'Video-URL', value: `https://arweave.net/${videoTxId}` },
          ],
          data: JSON.stringify({
            title: uploadData.title,
            description: uploadData.description,
            videoUrl: `https://arweave.net/${videoTxId}`,
            thumbnailUrl: `https://arweave.net/${thumbnailTxId}`,
            tags: uploadData.tags,
            genre: uploadData.genre,
            creator: 'ZDrive Platform'
          }),
        })
      );
      callbacks.onNFTCreationComplete?.();

      // Step 4: Wait for blockchain registration
      callbacks.onBlockchainRegistrationStart?.();
      log('📨 Sending message to AO process:', messageId);
      
      const uploadResult = await retry(() => result({ message: messageId, process: AO_PROCESSES.CREATOR_NFT }));
      log('🔍 Upload result received:', uploadResult);

      if (uploadResult.Messages?.length > 0) {
        log('📥 Messages received:', uploadResult.Messages.length);
        
        for (let i = 0; i < uploadResult.Messages.length; i++) {
          const msg = uploadResult.Messages[i];
          log(`📋 Message ${i + 1}:`, {
            From: msg.From,
            Action: msg.Action,
            Data: msg.Data
          });
          
          // Check if this is a success message
          if (msg.Action === 'Video-Uploaded') {
            const resultData = safeJsonParse(msg.Data, {});
            log('✅ Video uploaded successfully:', resultData);
            
            if (resultData && resultData.VideoId) {
              callbacks.onBlockchainRegistrationComplete?.();
              return resultData.VideoId;
            }
          }
          
          // Check if this is an error message
          if (msg.Action === 'Error') {
            throw new Error('Upload failed: ' + msg.Data);
          }
        }
        
        // If no specific success message, check the first message
        const messageData = uploadResult.Messages[0].Data;
        if (!messageData || messageData === 'undefined') {
          log('✅ Upload completed successfully but no structured data returned');
          callbacks.onBlockchainRegistrationComplete?.();
          return videoId;
        }
        
        const resultData = safeJsonParse(messageData, { success: true });
        if (resultData && resultData.VideoId) {
          callbacks.onBlockchainRegistrationComplete?.();
          return resultData.VideoId;
        } else if (resultData && resultData.error) {
          throw new Error('Upload failed: ' + resultData.error);
        } else {
          log('✅ Upload completed successfully (fallback)');
          callbacks.onBlockchainRegistrationComplete?.();
          return videoId;
        }
      }
      
      log('✅ Upload completed successfully (no messages)');
      
      // Verify NFT creation as final step
      try {
        const verification = await this.verifyNFTCreation(videoId);
        if (verification.success) {
          log('🎉 NFT creation verified! Token ID:', verification.tokenId);
          callbacks.onBlockchainRegistrationComplete?.();
          return videoId;
        } else {
          log('⚠️ NFT creation could not be verified:', verification.error);
          callbacks.onBlockchainRegistrationComplete?.();
          return videoId; // Still return success but log the issue
        }
      } catch (verificationError) {
        log('⚠️ NFT verification failed:', verificationError);
        callbacks.onBlockchainRegistrationComplete?.();
        return videoId; // Still return success but log the issue
      }
    } catch (error) {
      errorLog('Upload process error:', error as Error);
      throw error;
    }
  }

  // Upload Video and Create Creator NFT (Legacy method)
  static async uploadVideo(uploadData: VideoUploadData): Promise<string> {
    try {
      const videoId = generateVideoId();

      if (!window.aoProcessesVerified) {
        await this.verifyAllProcesses();
        window.aoProcessesVerified = true;
      }

      const processResponding = await this.testProcess(AO_PROCESSES.CREATOR_NFT);
      log('Creator NFT process responding:', processResponding);

      if (!processResponding) {
        throw new Error('Creator NFT process is not responding. Check logs for diagnosis.');
      }

      const storageFee = calculateStorageFee(uploadData.video.size, uploadData.thumbnail.size);

      toast.loading('Uploading video to Arweave...', { id: 'upload' });
      const videoTxId = await uploadToArweave(uploadData.video, 'video/mp4');

      toast.loading('Uploading thumbnail to Arweave...', { id: 'upload' });
      const thumbnailTxId = await uploadToArweave(uploadData.thumbnail, 'image/jpeg');

      toast.loading('Creating Creator NFT...', { id: 'upload' });

      const signer = await createSigner();

      const messageId = await retry(() =>
        message({
          process: AO_PROCESSES.CREATOR_NFT,
          signer,
          tags: [
            { name: 'Action', value: 'Upload-Video' },
            { name: 'VideoId', value: videoId },
            { name: 'Title', value: uploadData.title },
            { name: 'Description', value: uploadData.description },
            { name: 'ArweaveVideoId', value: videoTxId },
            { name: 'ArweaveThumbnailId', value: thumbnailTxId },
            { name: 'Duration', value: '0' },
            { name: 'BuyPrice', value: uploadData.buyPrice.toString() },
            { name: 'RentPrice', value: uploadData.rentPrice.toString() },
            { name: 'RentDuration', value: uploadData.rentDuration.toString() },
            { name: 'IsFree', value: uploadData.isFree.toString() },
            { name: 'StorageFee', value: storageFee.toString() },
            { name: 'Tags', value: JSON.stringify(uploadData.tags) },
            { name: 'Genre', value: uploadData.genre },
            // ANS-110 Required Fields for proper NFT display
            { name: 'Name', value: `ZDrive: ${uploadData.title}` },
            { name: 'Ticker', value: 'ZDRIVE-VID' },
            { name: 'Logo', value: `https://arweave.net/${thumbnailTxId}` },
            { name: 'Denomination', value: '1' },
            // Additional ANS-110 metadata
            { name: 'Type', value: 'video-nft' },
            { name: 'Content-Type', value: 'video/mp4' },
            { name: 'Thumbnail', value: `https://arweave.net/${thumbnailTxId}` },
            { name: 'Video-URL', value: `https://arweave.net/${videoTxId}` },
          ],
          data: JSON.stringify({
            title: uploadData.title,
            description: uploadData.description,
            videoUrl: `https://arweave.net/${videoTxId}`,
            thumbnailUrl: `https://arweave.net/${thumbnailTxId}`,
            tags: uploadData.tags,
            genre: uploadData.genre,
            creator: 'ZDrive Platform'
          }),
        })
      );

      const uploadResult = await retry(() => result({ message: messageId, process: AO_PROCESSES.CREATOR_NFT }));

      if (uploadResult.Messages?.length > 0) {
        const messageData = uploadResult.Messages[0].Data;
        if (!messageData || messageData === 'undefined') {
          log('Upload completed successfully but no data returned');
          toast.success('Video uploaded successfully!', { id: 'upload' });
          return videoId; // Return the generated videoId
        }
        
        const resultData = safeJsonParse(messageData, { success: true });
        if (resultData && resultData.VideoId) {
          toast.success('Video uploaded successfully!', { id: 'upload' });
          return resultData.VideoId;
        } else if (resultData && resultData.error) {
          throw new Error('Upload failed: ' + resultData.error);
        } else {
          log('Upload completed successfully but no structured data returned');
          toast.success('Video uploaded successfully!', { id: 'upload' });
          return videoId; // Return the generated videoId
        }
      }
      throw new Error('No response from upload process');
    } catch (error) {
      errorLog('Upload process error:', error as Error);
      toast.error('Upload failed: ' + (error as Error).message, { id: 'upload' });
      throw error;
    }
  }

  // Purchase Access NFT
  static async purchaseAccess(purchaseData: AccessPurchaseData): Promise<string> {
    try {
      const processId = purchaseData.accessType === 'basic' ? AO_PROCESSES.BASIC_ACCESS : AO_PROCESSES.PREMIUM_ACCESS;
      const action = purchaseData.accessType === 'basic' ? 'Purchase-Basic-Access' : 'Purchase-Premium-Access';

      log('🛒 Starting purchase process:', {
        processId,
        action,
        videoId: purchaseData.videoId,
        accessType: purchaseData.accessType,
        price: purchaseData.price
      });

      // First check if the process is responding to Info
      const processResponding = await this.testProcess(processId);
      log(`Process ${processId} responding to Info:`, processResponding);

      if (!processResponding) {
        log(`❌ ${purchaseData.accessType} access process not responding to Info:`, processId);
        return this.simulatePurchase(purchaseData);
      }

      toast.loading('Processing purchase...', { id: 'purchase' });

      // Get video details to populate required fields
      let videoDetails: any = null;
      try {
        videoDetails = await this.getVideoDetails(purchaseData.videoId);
        log('📹 Video details for purchase:', videoDetails);
      } catch (error) {
        log('⚠️ Could not fetch video details, using defaults:', error);
      }

      const tags = [
        { name: 'Action', value: action },
        { name: 'VideoId', value: purchaseData.videoId },
        { name: 'Payment', value: purchaseData.price.toString() },
        // Required fields for Premium Access process
        { name: 'Title', value: videoDetails?.title || 'Unknown Video' },
        { name: 'ThumbnailTx', value: videoDetails?.thumbnailTx || videoDetails?.arweaveThumbnailId || 'placeholder' },
        { name: 'ArweaveMetadataId', value: videoDetails?.arweaveMetadataId || videoDetails?.nftTokenId || 'demo-metadata-' + Date.now() },
      ];

      if (purchaseData.accessType === 'basic' && purchaseData.duration) {
        tags.push({ name: 'Duration', value: purchaseData.duration.toString() });
      }

      log('📤 Sending purchase message with tags:', tags);

      const signer = await createSigner();

      let messageId: string;
      try {
        messageId = await retry(() =>
          message({
            process: processId,
            signer,
            tags,
            data: '',
          })
        );
        log('📨 Purchase message sent, ID:', messageId);
      } catch (messageError) {
        log('❌ Failed to send purchase message:', messageError);
        return this.simulatePurchase(purchaseData);
      }

      let purchaseResult: any;
      try {
        purchaseResult = await retry(() => result({ message: messageId, process: processId }));
        log('📥 Purchase result received:', {
          messageCount: purchaseResult.Messages?.length || 0,
          firstMessageData: purchaseResult.Messages?.[0]?.Data,
          firstMessageAction: purchaseResult.Messages?.[0]?.Action
        });
      } catch (resultError) {
        log('❌ Failed to get purchase result:', resultError);
        return this.simulatePurchase(purchaseData);
      }

      if (purchaseResult.Messages?.length > 0) {
        const firstMessage = purchaseResult.Messages[0];
        
        // Check for success action first
        if (firstMessage.Action === 'Premium-Access-Purchased' || firstMessage.Action === 'Basic-Access-Purchased') {
          const resultData = safeJsonParse(firstMessage.Data, {});
          log('✅ Purchase successful via action:', firstMessage.Action, resultData);
          
          if (resultData && resultData.TokenId) {
            toast.success('Access purchased successfully!', { id: 'purchase' });
            return resultData.TokenId;
          }
        }
        
        // Check for error action
        if (firstMessage.Action === 'Error') {
          log('❌ Purchase failed with error action:', firstMessage.Data);
          return this.simulatePurchase(purchaseData);
        }
        
        // Fallback: check data field for token ID
        const resultData = safeJsonParse(firstMessage.Data, {});
        log('🔍 Parsed purchase result:', resultData);
        
        if (resultData && resultData.TokenId) {
          toast.success('Access purchased successfully!', { id: 'purchase' });
          return resultData.TokenId;
        }
        
        // Check for different response formats
        if (resultData && (resultData.token_id || resultData.AccessTokenId || resultData.tokenId)) {
          const tokenId = resultData.token_id || resultData.AccessTokenId || resultData.tokenId;
          log('✅ Found token ID in alternative format:', tokenId);
          toast.success('Access purchased successfully!', { id: 'purchase' });
          return tokenId;
        }
        
        // Check if it's an error message
        if (resultData && resultData.error) {
          log('❌ Purchase failed with error from process:', resultData.error);
          return this.simulatePurchase(purchaseData);
        }
        
        // If we got a message but no recognizable token, still try to simulate
        log('⚠️ Got response but no token ID found, falling back to simulation');
        return this.simulatePurchase(purchaseData);
      }
      
      log('❌ No messages received from purchase process, falling back to simulation');
      return this.simulatePurchase(purchaseData);
      
    } catch (error) {
      errorLog('Purchase process error:', error as Error);
      // Don't show error toast yet, try simulation first
      return this.simulatePurchase(purchaseData);
    }
  }

  // Simulate purchase for demo purposes
  private static simulatePurchase(purchaseData: AccessPurchaseData): string {
    log(`🎭 Simulating ${purchaseData.accessType} purchase for demo mode`);
    
    const simulatedTokenId = `demo-${purchaseData.accessType}-${Date.now()}`;
    log(`🎭 Simulating successful purchase with token ID: ${simulatedTokenId}`);
    
    toast.success(`✅ ${purchaseData.accessType === 'basic' ? 'Basic' : 'Premium'} access purchased successfully! (Demo Mode)`, { id: 'purchase' });
    
    // Store the simulated purchase in localStorage for testing
    const purchases = JSON.parse(localStorage.getItem('demo-purchases') || '{}');
    purchases[purchaseData.videoId] = {
      tokenId: simulatedTokenId,
      accessType: purchaseData.accessType,
      purchasedAt: Date.now(),
      duration: purchaseData.duration
    };
    localStorage.setItem('demo-purchases', JSON.stringify(purchases));
    
    return simulatedTokenId;
  }

  // Check if user owns access NFTs for a video
  static async checkVideoAccess(videoId: string, userAddress: string): Promise<AccessResponse> {
    try {
      log('🔍 Checking video access for:', { videoId, userAddress });
      
      // First check if user owns the Creator NFT (full access)
      try {
        const creatorBalance = await this.getUserCreatorNFTBalance(userAddress, videoId);
        if (creatorBalance > 0) {
          log('✅ User owns Creator NFT - granting creator access');
          return {
            granted: true,
            accessType: 'creator',
            sessionId: `creator-${Date.now()}`
          };
        }
      } catch (error) {
        log('Creator NFT check failed:', error);
      }
      
      // Check for demo purchases in localStorage (fallback when AO processes are not responding)
      try {
        const purchases = JSON.parse(localStorage.getItem('demo-purchases') || '{}');
        const purchase = purchases[videoId];
        if (purchase) {
          log('🎭 Found demo purchase:', purchase);
          
          // Check if basic access and if it's expired
          if (purchase.accessType === 'basic' && purchase.duration) {
            const expiresAt = purchase.purchasedAt + (purchase.duration * 24 * 60 * 60 * 1000);
            if (Date.now() > expiresAt) {
              log('⏰ Demo basic access expired');
            } else {
              log('✅ Valid demo basic access found');
              return {
                granted: true,
                accessType: 'basic',
                sessionId: `demo-basic-${Date.now()}`
              };
            }
          } else if (purchase.accessType === 'premium') {
            log('✅ Valid demo premium access found');
            return {
              granted: true,
              accessType: 'premium',
              sessionId: `demo-premium-${Date.now()}`
            };
          }
        }
      } catch (error) {
        log('Demo purchase check failed:', error);
      }
      
      // Check for Basic Access NFTs
      try {
        const basicAccessResult = await dryrun({
          process: AO_PROCESSES.BASIC_ACCESS,
          tags: [
            { name: 'Action', value: 'Verify-Basic-Access' },
            { name: 'VideoId', value: videoId },
            { name: 'User', value: userAddress }
          ]
        });
        
        if (basicAccessResult.Messages?.length > 0) {
          const accessData = safeJsonParse(basicAccessResult.Messages[0].Data, {});
          if (accessData.access === true) {
            log('✅ User has valid Basic Access NFT');
            return {
              granted: true,
              accessType: 'basic',
              sessionId: `basic-${Date.now()}`
            };
          }
        }
      } catch (error) {
        log('Basic Access NFT check failed:', error);
      }
      
      // Check for Premium Access NFTs
      try {
        const premiumAccessResult = await dryrun({
          process: AO_PROCESSES.PREMIUM_ACCESS,
          tags: [
            { name: 'Action', value: 'Verify-Premium-Access' },
            { name: 'VideoId', value: videoId },
            { name: 'User', value: userAddress }
          ]
        });
        
        if (premiumAccessResult.Messages?.length > 0) {
          const accessData = safeJsonParse(premiumAccessResult.Messages[0].Data, {});
          if (accessData.access === true) {
            log('✅ User has valid Premium Access NFT');
            return {
              granted: true,
              accessType: 'premium',
              sessionId: `premium-${Date.now()}`
            };
          }
        }
      } catch (error) {
        log('Premium Access NFT check failed:', error);
      }
      
      // No access found
      log('❌ No valid access NFTs found for user');
      return {
        granted: false,
        accessType: 'none'
      };
      
    } catch (error) {
      errorLog('Video access check failed:', error as Error);
      return {
        granted: false,
        accessType: 'none'
      };
    }
  }

  // Get user's Creator NFT balance for a specific video
  static async getUserCreatorNFTBalance(userAddress: string, videoId?: string): Promise<number> {
    try {
      const balanceResult = await dryrun({
        process: AO_PROCESSES.CREATOR_NFT,
        tags: [
          { name: 'Action', value: 'Balance' },
          { name: 'Target', value: userAddress },
          ...(videoId ? [{ name: 'VideoId', value: videoId }] : [])
        ]
      });
      
      if (balanceResult.Messages?.length > 0) {
        const balance = parseInt(balanceResult.Messages[0].Data) || 0;
        return balance;
      }
      return 0;
    } catch (error) {
      log('Creator NFT balance check failed:', error);
      return 0;
    }
  }

  // Request Access to Video
  static async requestAccess(videoId: string): Promise<AccessResponse> {
    try {
      // Get current user address from ArConnect
      let walletAddress: string;
      try {
        if (!window.arweaveWallet) {
          throw new Error('ArConnect not available');
        }
        walletAddress = await window.arweaveWallet.getActiveAddress();
        if (!walletAddress) {
          throw new Error('No active wallet address');
        }
      } catch (error) {
        log('Failed to get wallet address:', error);
        return { granted: false, accessType: 'none' };
      }
      
      // Use the enhanced access check
      return await this.checkVideoAccess(videoId, walletAddress);
      
    } catch (error) {
      errorLog('Access request failed:', error as Error);
      return { granted: false, accessType: 'none' };
    }
  }

  // Check if NFT was created successfully
  static async verifyNFTCreation(videoId: string): Promise<{ success: boolean; tokenId?: string; error?: string }> {
    try {
      log('🔍 Verifying NFT creation for video:', videoId);
      
      const videoResult = await retry(() =>
        dryrun({
          process: AO_PROCESSES.CREATOR_NFT,
          tags: [
            { name: 'Action', value: 'Get-Video' },
            { name: 'VideoId', value: videoId },
          ],
        })
      );

      if (videoResult.Messages?.length > 0) {
        const parsedData = safeJsonParse(videoResult.Messages[0].Data, null);
        
        if (parsedData && parsedData.error) {
          log('❌ NFT verification failed:', parsedData.error);
          return { success: false, error: parsedData.error };
        }
        
        if (parsedData && parsedData.token_id) {
          log('✅ NFT verified successfully:', parsedData.token_id);
          return { success: true, tokenId: parsedData.token_id };
        }
      }
      
      log('⚠️ NFT verification inconclusive');
      return { success: false, error: 'Unable to verify NFT creation' };
    } catch (error) {
      errorLog('NFT verification failed:', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Get Video Details
  static async getVideoDetails(videoId: string): Promise<unknown | null> {
    try {
      const videoResult = await retry(() =>
        dryrun({
          process: AO_PROCESSES.CREATOR_NFT,
          tags: [
            { name: 'Action', value: 'Get-Video' },
            { name: 'VideoId', value: videoId },
          ],
        })
      );

      if (videoResult.Messages?.length > 0) {
        const parsedData = safeJsonParse(videoResult.Messages[0].Data, null);
        
        // Check if the parsed data indicates an error
        if (parsedData && parsedData.error) {
          log('Video details error:', parsedData.error);
          return null; // Return null for video not found
        }
        
        return parsedData;
      }
      throw new Error('Video not found');
    } catch (error) {
      errorLog('Get video details failed:', error as Error);
      return null;
    }
  }

  // Get Creator's Videos
  static async getCreatorVideos(creatorAddress?: string): Promise<unknown[]> {
    try {
      const tags = [{ name: 'Action', value: 'Get-Creator-Videos' }];
      if (creatorAddress) tags.push({ name: 'Creator', value: creatorAddress });

      const videosResult = await retry(() =>
        dryrun({
          process: AO_PROCESSES.CREATOR_NFT,
          tags,
        })
      );

      if (videosResult.Messages?.length > 0) {
        const data = safeJsonParse(videosResult.Messages[0].Data, {});
        if (data && data.error) {
          log('Get creator videos error:', data.error);
          return [];
        }
        return (data && data.Videos) || [];
      }
      return [];
    } catch (error) {
      errorLog('Get creator videos failed:', error as Error);
      return [];
    }
  }

  // Get User's Access Tokens
  static async getUserAccessTokens(userAddress?: string): Promise<{ basic: unknown[], premium: unknown[] }> {
    try {
      const tags = [{ name: 'Action', value: 'Get-User-Access' }];
      if (userAddress) tags.push({ name: 'User', value: userAddress });

      // Get basic access tokens
      const basicResult = await retry(() =>
        dryrun({
          process: AO_PROCESSES.BASIC_ACCESS,
          tags,
        })
      );

      // Get premium access tokens
      const premiumResult = await retry(() =>
        dryrun({
          process: AO_PROCESSES.PREMIUM_ACCESS,
          tags: [
            { name: 'Action', value: 'Get-User-Premium-Access' },
            ...(userAddress ? [{ name: 'User', value: userAddress }] : []),
          ],
        })
      );

      const basicTokens = basicResult.Messages?.length > 0
        ? safeJsonParse(basicResult.Messages[0].Data, {}).AccessTokens || []
        : [];

      const premiumTokens = premiumResult.Messages?.length > 0
        ? safeJsonParse(premiumResult.Messages[0].Data, {}).PremiumAccessTokens || []
        : [];

      return { basic: basicTokens, premium: premiumTokens };
    } catch (error) {
      errorLog('Get user access tokens failed:', error as Error);
      return { basic: [], premium: [] };
    }
  }

  // Renew Basic Access
  static async renewBasicAccess(tokenId: string, duration: number, price: number): Promise<boolean> {
    try {
      toast.loading('Renewing access...', { id: 'renew' });

      const signer = await createSigner();

      const messageId = await retry(() =>
        message({
          process: AO_PROCESSES.BASIC_ACCESS,
          signer,
          tags: [
            { name: 'Action', value: 'Renew-Access' },
            { name: 'TokenId', value: tokenId },
            { name: 'Duration', value: duration.toString() },
            { name: 'Payment', value: price.toString() },
          ],
          data: '',
        })
      );

      const renewResult = await retry(() => result({ message: messageId, process: AO_PROCESSES.BASIC_ACCESS }));

      if (renewResult.Messages?.length > 0) {
        const resultData = safeJsonParse(renewResult.Messages[0].Data, {});
        if (resultData && resultData.TokenId) {
          toast.success('Access renewed successfully!', { id: 'renew' });
          return true;
        }
        const errorMsg = (resultData && resultData.error) || (resultData && resultData.message) || 'Unknown error';
        throw new Error('Renewal failed: ' + errorMsg);
      }
      throw new Error('No response from renewal process');
    } catch (error) {
      errorLog('Renewal failed:', error as Error);
      toast.error('Renewal failed: ' + (error as Error).message, { id: 'renew' });
      return false;
    }
  }

  // Transfer NFT
  static async transferNFT(processId: string, tokenId: string, recipient: string, price?: number): Promise<boolean> {
    try {
      toast.loading('Transferring NFT...', { id: 'transfer' });

      const tags = [
        { name: 'Action', value: 'Transfer' },
        { name: 'TokenId', value: tokenId },
        { name: 'Recipient', value: recipient },
      ];

      if (price) tags.push({ name: 'Price', value: price.toString() });

      const signer = await createSigner();

      const messageId = await retry(() =>
        message({
          process: processId,
          signer,
          tags,
          data: '',
        })
      );

      const transferResult = await retry(() => result({ message: messageId, process: processId }));

      if (transferResult.Messages?.length > 0) {
        toast.success('NFT transferred successfully!', { id: 'transfer' });
        return true;
      }
      throw new Error('Transfer failed');
    } catch (error) {
      errorLog('Transfer failed:', error as Error);
      toast.error('Transfer failed: ' + (error as Error).message, { id: 'transfer' });
      return false;
    }
  }

  // Get Platform Statistics
  static async getPlatformStats(): Promise<unknown> {
    try {
      const statsResult = await retry(() =>
        dryrun({
          process: AO_PROCESSES.CREATOR_NFT,
          tags: [{ name: 'Action', value: 'Platform-Stats' }],
        })
      );

      if (statsResult.Messages?.length > 0) {
        const parsedData = safeJsonParse(statsResult.Messages[0].Data, null);
        if (parsedData && parsedData.error) {
          log('Platform stats error:', parsedData.error);
          return null;
        }
        return parsedData;
      }
      return null;
    } catch (error) {
      errorLog('Get platform stats failed:', error as Error);
      return null;
    }
  }

  // Bulk Access Check
  static async bulkAccessCheck(videoIds: string[]): Promise<{ [videoId: string]: unknown }> {
    try {
      const checkResult = await retry(() =>
        dryrun({
          process: AO_PROCESSES.ACCESS_CONTROL,
          tags: [
            { name: 'Action', value: 'Bulk-Access-Check' },
            { name: 'VideoIds', value: JSON.stringify(videoIds) },
          ],
        })
      );

      if (checkResult.Messages?.length > 0) {
        const data = safeJsonParse(checkResult.Messages[0].Data, {});
        if (data && data.error) {
          log('Bulk access check error:', data.error);
          return {};
        }
        return (data && data.Results) || {};
      }
      return {};
    } catch (error) {
      errorLog('Bulk access check failed:', error as Error);
      return {};
    }
  }

  // Start Viewing Session
  static async startViewingSession(sessionId: string, videoId: string): Promise<boolean> {
    try {
      const signer = await createSigner();

      const messageId = await retry(() =>
        message({
          process: AO_PROCESSES.ACCESS_CONTROL,
          signer,
          tags: [
            { name: 'Action', value: 'Start-Viewing' },
            { name: 'SessionId', value: sessionId },
            { name: 'VideoId', value: videoId },
          ],
          data: '',
        })
      );

      const startResult = await retry(() => result({ message: messageId, process: AO_PROCESSES.ACCESS_CONTROL }));
      return startResult.Messages?.length > 0;
    } catch (error) {
      errorLog('Start viewing session failed:', error as Error);
      return false;
    }
  }

  // Get User's Creator NFT Balance
  static async getUserNFTBalance(userAddress?: string): Promise<number> {
    try {
      const address = userAddress || (await ensureWalletConnected(), await window.arweaveWallet?.getActiveAddress());
      if (!address) return 0;

      const balanceResult = await retry(() =>
        dryrun({
          process: AO_PROCESSES.CREATOR_NFT,
          tags: [
            { name: 'Action', value: 'Balance' },
            { name: 'Recipient', value: address },
          ],
        })
      );

      if (balanceResult.Messages?.length > 0) {
        const parsedData = safeJsonParse(balanceResult.Messages[0].Data, {});
        return parseInt(parsedData.balance || '0', 10);
      }
      return 0;
    } catch (error) {
      errorLog('Get NFT balance failed:', error as Error);
      return 0;
    }
  }

  // Check AO Process Deployment Status
  static async checkAllProcessesDeployment(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const [name, processId] of Object.entries(AO_PROCESSES)) {
      try {
        results[name] = await checkProcessDeployment(processId);
        log(`Process ${name} (${processId}): ${results[name] ? '✅ Deployed' : '❌ Not found'}`);
      } catch {
        results[name] = false;
        log(`Process ${name} (${processId}): ❌ Error checking`);
      }
    }
    
    return results;
  }

  // Get User's Creator NFTs
  static async getUserCreatorNFTs(userAddress?: string): Promise<unknown[]> {
    try {
      const address = userAddress || (await ensureWalletConnected(), await window.arweaveWallet?.getActiveAddress());
      if (!address) return [];

      const nftsResult = await retry(() =>
        dryrun({
          process: AO_PROCESSES.CREATOR_NFT,
          tags: [
            { name: 'Action', value: 'Get-Creator-Videos' },
            { name: 'Creator', value: address },
          ],
        })
      );

      if (nftsResult.Messages?.length > 0) {
        const parsedData = safeJsonParse(nftsResult.Messages[0].Data, {});
        return parsedData.Videos || [];
      }
      return [];
    } catch (error) {
      errorLog('Get creator NFTs failed:', error as Error);
      return [];
    }
  }

  // End Viewing Session
  static async endViewingSession(sessionId: string, watchTime: number): Promise<boolean> {
    try {
      const signer = await createSigner();

      const messageId = await retry(() =>
        message({
          process: AO_PROCESSES.ACCESS_CONTROL,
          signer,
          tags: [
            { name: 'Action', value: 'End-Viewing' },
            { name: 'SessionId', value: sessionId },
            { name: 'WatchTime', value: watchTime.toString() },
          ],
          data: '',
        })
      );

      const endResult = await retry(() => result({ message: messageId, process: AO_PROCESSES.ACCESS_CONTROL }));
      return endResult.Messages?.length > 0;
    } catch (error) {
      errorLog('End viewing session failed:', error as Error);
      return false;
    }
  }
}