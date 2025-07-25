# AO Integration Implementation

This document describes the implementation of AO (Arweave Operating System) communication in the ZDrive video platform using production AO processes.

## Overview

The implementation provides a complete NFT-based video streaming platform with:
- Video upload and Creator NFT minting
- Access token purchases (Basic and Premium)
- NFT transfers with royalty distribution
- Wallet integration (ArConnect/Wander)
- Real-time progress tracking

## Architecture

```
Frontend (React/Next.js)
    ↓
AO Hooks (useAO, useVideoAccess, useUserNFTs)
    ↓
AO Service (aoService.ts)
    ↓
AO Processes (Creator NFT, Basic Access, Premium Access, Access Control)
    ↓
Arweave Storage
```

## Environment Configuration

Create a `.env.local` file in the project root with the following configuration:

```env
# AO Process IDs (Production)
NEXT_PUBLIC_CREATOR_NFT_PROCESS=Lk-5IzUn46w7d0BliSvR9Yo4jazeEZ1kxt54F2SlpPc
NEXT_PUBLIC_BASIC_ACCESS_PROCESS=VxGBhfTqCQwrcxovPPpY6fdHqooHh8xITuI5ry3lTJs
NEXT_PUBLIC_PREMIUM_ACCESS_PROCESS=IXOzHMQZoBIyq_mtcoHG9mfhusxSwYu932wWB6L6RjE
NEXT_PUBLIC_ACCESS_CONTROL_PROCESS=X-Lbejt0NVMaYtknT9FW9FhXNeH8-pu0t7Y2ej0iawI
NEXT_PUBLIC_TOKEN_PROCESS=xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10

# Platform Configuration
NEXT_PUBLIC_PLATFORM_WALLET=WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg
NEXT_PUBLIC_UPLOAD_FEE_PERCENTAGE=0.0085
NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE=0.10
NEXT_PUBLIC_CREATOR_SHARE_PERCENTAGE=0.90
NEXT_PUBLIC_ROYALTY_PERCENTAGE=0.10

# AO Network Configuration
NEXT_PUBLIC_AO_GATEWAY_URL=https://arweave.net
NEXT_PUBLIC_AO_CU_URL=https://cu.ao.dev
NEXT_PUBLIC_AO_MU_URL=https://mu.ao.dev
NEXT_PUBLIC_AO_SU_URL=https://su.ao.dev

# Feature Flags
NEXT_PUBLIC_ENABLE_PRODUCTION_FALLBACK=false
```

## Hooks Implementation

### 1. useAO Hook

The main AO communication hook that handles all AO-related operations.

**Location:** `src/hooks/useAO.ts`

**Features:**
- Video upload with progress tracking
- NFT creation and management
- Access token purchases
- Process verification
- Error handling and retry logic

**Usage:**
```typescript
import { useAO } from '../hooks/useAO';

const MyComponent = () => {
  const { 
    uploadVideo, 
    uploadProgress, 
    isUploading, 
    purchaseAccess, 
    verifyAccess,
    getUserNFTs,
    transferNFT,
    verifyProcesses,
    error,
    clearError 
  } = useAO();

  // Upload a video
  const handleUpload = async (videoData) => {
    try {
      const videoId = await uploadVideo(videoData);
      console.log('Video uploaded:', videoId);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Purchase access
  const handlePurchase = async (videoId, accessType, duration) => {
    try {
      const tokenId = await purchaseAccess({
        videoId,
        accessType,
        duration,
        price: 0.001
      });
      console.log('Access purchased:', tokenId);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };
};
```

### 2. useVideoAccess Hook

Specialized hook for video access management.

**Location:** `src/hooks/useVideoAccess.ts`

**Features:**
- Access option retrieval
- Access purchase with pricing
- Access verification
- Access status checking

**Usage:**
```typescript
import { useVideoAccess } from '../hooks/useVideoAccess';

const VideoPlayer = ({ videoId }) => {
  const { 
    getAccessOptions, 
    purchaseAccess, 
    verifyAccess, 
    checkAccessStatus,
    isPurchasing 
  } = useVideoAccess();

  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [videoId]);

  const checkAccess = async () => {
    const status = await checkAccessStatus(videoId);
    setHasAccess(status.hasAccess);
  };

  const handlePurchase = async (accessType, duration) => {
    const success = await purchaseAccess(videoId, accessType, duration);
    if (success) {
      await checkAccess();
    }
  };
};
```

### 3. useUserNFTs Hook

Hook for managing user's NFT collection.

**Location:** `src/hooks/useUserNFTs.ts`

**Features:**
- NFT collection loading
- NFT filtering by type/video
- NFT transfers
- Expired NFT detection

**Usage:**
```typescript
import { useUserNFTs } from '../hooks/useUserNFTs';

const NFTGallery = () => {
  const { 
    nfts, 
    isLoading, 
    refreshNFTs, 
    transferNFT,
    getNFTsByType,
    getActiveNFTs 
  } = useUserNFTs();

  const creatorNFTs = getNFTsByType('creator');
  const activeNFTs = getActiveNFTs();

  const handleTransfer = async (tokenId, recipient, price) => {
    const success = await transferNFT(tokenId, recipient, price);
    if (success) {
      await refreshNFTs();
    }
  };
};
```

## Components

### 1. VideoAccessModal

Modal component for purchasing video access.

**Location:** `src/components/VideoAccessModal.tsx`

**Features:**
- Access option display
- Purchase flow
- Wallet connection check
- Error handling

**Usage:**
```typescript
import VideoAccessModal from '../components/VideoAccessModal';

const VideoPage = () => {
  const [showAccessModal, setShowAccessModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowAccessModal(true)}>
        Purchase Access
      </button>
      
      <VideoAccessModal
        videoId="video-123"
        videoTitle="My Video"
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        onAccessGranted={() => {
          // Handle access granted
          setShowAccessModal(false);
        }}
      />
    </div>
  );
};
```

## Upload Flow

The video upload process follows these steps:

1. **Validation** - Check file formats and sizes
2. **Video Upload** - Upload video file to Arweave
3. **Thumbnail Upload** - Upload thumbnail to Arweave
4. **NFT Creation** - Create Creator NFT on AO blockchain
5. **Blockchain Registration** - Confirm NFT creation

**Progress Tracking:**
```typescript
const { uploadProgress, isUploading } = useAO();

// uploadProgress contains:
[
  {
    step: 'verification',
    progress: 100,
    status: 'completed',
    message: 'AO processes verified'
  },
  {
    step: 'video-upload',
    progress: 75,
    status: 'processing',
    message: 'Uploading to Arweave...'
  }
  // ... more steps
]
```

## Error Handling

All hooks include comprehensive error handling:

```typescript
const { error, clearError } = useAO();

// Display error
if (error) {
  return (
    <div className="error-message">
      {error}
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}
```

## Wallet Integration

The implementation supports both ArConnect and Wander wallets:

```typescript
import { useWallet } from '../contexts/WalletContext';

const { 
  isConnected, 
  walletAddress, 
  connectWallet, 
  disconnectWallet 
} = useWallet();

// Connect wallet
await connectWallet();

// Check connection
if (!isConnected) {
  // Show wallet connection prompt
}
```

## AO Process Verification

Before performing operations, the system verifies AO processes are responding:

```typescript
const { verifyProcesses } = useAO();

// Verify all processes
await verifyProcesses();
```

## Testing

To test the implementation:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Connect your wallet** (ArConnect or Wander)

3. **Test video upload:**
   - Navigate to `/upload`
   - Fill in video details
   - Upload video and thumbnail
   - Monitor progress

4. **Test access purchase:**
   - Navigate to a video page
   - Click "Purchase Access"
   - Select access option
   - Complete purchase

5. **Test NFT management:**
   - View your NFT collection
   - Transfer NFTs
   - Check access status

## Troubleshooting

### Common Issues

1. **AO Process Not Responding**
   - Check process IDs in `.env.local`
   - Verify processes are deployed
   - Check network connectivity

2. **Wallet Connection Issues**
   - Ensure ArConnect/Wander is installed
   - Check wallet permissions
   - Try reconnecting wallet

3. **Upload Failures**
   - Check file sizes
   - Verify Arweave connectivity
   - Check wallet balance

4. **Purchase Failures**
   - Verify wallet has sufficient balance
   - Check AO process status
   - Review error messages

### Debug Mode

Enable debug logging by setting:
```env
NEXT_PUBLIC_ENABLE_PRODUCTION_FALLBACK=true
```

This will provide detailed logs in the browser console.

## Production Deployment

For production deployment:

1. **Deploy AO processes** using the provided scripts
2. **Update environment variables** with production process IDs
3. **Test all functionality** in staging environment
4. **Deploy frontend** to production
5. **Monitor logs** for any issues

## Security Considerations

- All transactions are signed by the user's wallet
- No private keys are stored in the application
- AO processes handle all sensitive operations
- Input validation is performed on both client and server
- Error messages don't expose sensitive information

## Performance Optimization

- Progress tracking reduces perceived loading time
- Retry logic handles temporary network issues
- Caching of NFT data reduces API calls
- Lazy loading of components improves initial load time

## Future Enhancements

- Batch operations for multiple purchases
- Advanced NFT filtering and search
- Real-time notifications for NFT events
- Mobile wallet support
- Offline mode with sync
- Analytics and reporting dashboard 