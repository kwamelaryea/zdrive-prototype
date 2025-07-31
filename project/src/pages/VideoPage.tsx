import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { mockCreators, mockVideos } from '../data/mockData';
import { formatNumber } from '../utils/format';
import { useWallet } from '../contexts/WalletContext';
import { useVideos } from '../contexts/VideoContext';
import { AOService, AO_PROCESSES } from '../services/aoService';
import VideoPlayer from '../components/VideoPlayer';
import toast from 'react-hot-toast';

interface VideoPageProps {
  videoId: string;
}

// Define the purchase data type inline
interface AccessPurchaseData {
  videoId: string;
  accessType: 'basic' | 'premium';
  duration?: number;
  price: number;
}

const VideoPage: React.FC<VideoPageProps> = ({ videoId }) => {
  const router = useRouter();
  const { isConnected, walletAddress } = useWallet();
  const { getVideo, incrementViews, toggleLike, videos, reloadVideos, addVideo, updateVideo, refreshVideoFromNFT, refreshVideoFromBlockchain, refreshAllData } = useVideos();
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [accessStatus, setAccessStatus] = useState<{ granted: boolean; accessType: string; sessionId?: string }>({ granted: false, accessType: 'none' });
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track if views have been incremented for this video
  const viewsIncrementedRef = useRef<string | null>(null);

  const video = getVideo(videoId);
  const creator = mockCreators.find(c => c.name === video?.creator);

  // Debug logging - only run once on mount
  useEffect(() => {
    console.log('VideoPage mounted with videoId:', videoId);
    console.log('Available videos:', videos.length);
    console.log('Available video IDs:', videos.map(v => v.id));
    console.log('Found video:', video);
    console.log('Video thumbnail URL:', video?.thumbnail);
    console.log('Video arweaveId:', video?.arweaveId);
    console.log('Is connected:', isConnected);
    console.log('Wallet address:', walletAddress);
    
    // If video is not found, try to refresh from blockchain (source of truth)
    if (!video && videoId) {
      console.log('Video not found, refreshing from blockchain (source of truth)...');
      refreshVideoFromBlockchain(videoId);
    }
    
    setIsLoading(false);
  }, []); // Empty dependency array - only run once on mount

  // Increment views when video is accessed - but only once per video
  useEffect(() => {
    if (video && viewsIncrementedRef.current !== video.id) {
      console.log('Incrementing views for video:', video.id);
      incrementViews(video.id);
      viewsIncrementedRef.current = video.id;
    }
  }, [video?.id]); // Only depend on video.id, not the entire video object

  // Check access when component loads or wallet changes
  useEffect(() => {
    if (videoId && isConnected) {
      checkAccess();
    } else if (videoId && !isConnected) {
      // If not connected, set default access status
      setAccessStatus({
        granted: false,
        accessType: 'none'
      });
      setIsLoadingAccess(false);
    }
  }, [videoId, isConnected, walletAddress]);

  // Handle purchase action from URL params
  useEffect(() => {
    const action = router.query.action;
    if (action === 'purchase' && isConnected) {
      // Scroll to purchase section or show purchase modal
      const purchaseSection = document.getElementById('purchase-section');
      if (purchaseSection) {
        purchaseSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [router.query, isConnected]);

  const checkAccess = async () => {
    if (!videoId) return;
    
    setIsLoadingAccess(true);
    try {
      // Default to no access
      let hasAccess = false;
      let accessType = 'none';
      
      // Check if video is free
      if (video?.isFree) {
        hasAccess = true;
        accessType = 'free';
      }
      // Check if user is the creator (owns the video)
      else if (isConnected && walletAddress && video?.creatorAddress === walletAddress) {
        hasAccess = true;
        accessType = 'creator';
      }
      // Check if user has purchased access via AO
      else if (isConnected && walletAddress) {
        try {
          // Try to get access from AO
          const processId = AO_PROCESSES.ACCESS_CONTROL;
          if (processId && processId.length === 43) {
            const access = await AOService.requestAccess(videoId);
            if (access.granted) {
              hasAccess = true;
              accessType = access.accessType;
            }
          }
        } catch (aoError) {
          console.log('AO access check failed:', aoError);
          // Keep hasAccess = false (no access by default)
        }
      }
      
      setAccessStatus({
        granted: hasAccess,
        accessType: accessType,
        sessionId: hasAccess ? `session-${Date.now()}` : undefined
      });
      
    } catch (error) {
      console.error('Access check failed:', error);
      // Default to no access on error
      setAccessStatus({
        granted: false,
        accessType: 'none'
      });
    } finally {
      setIsLoadingAccess(false);
    }
  };

  const handlePurchase = async (accessType: 'basic' | 'premium', duration?: number) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!videoId) {
      toast.error('No video selected');
      return;
    }

    try {
      toast.loading(`Processing ${accessType} purchase...`);
      
      const purchaseData: AccessPurchaseData = {
        videoId,
        accessType,
        duration: duration || (accessType === 'basic' ? 30 : undefined),
        price: accessType === 'premium' ? 2.99 : 0.99
      };

      let tokenId: string;
      
      try {
        // First try the bypass method
        tokenId = await AOService.purchaseAccessWithBypass(purchaseData);
      } catch (bypassError) {
        console.log('Bypass purchase failed, trying direct purchase:', bypassError);
        
        // If bypass fails with "already has access" error, try direct purchase
        if (bypassError instanceof Error && 
            (bypassError.message.includes('already has premium access') || 
             bypassError.message.includes('already has basic access'))) {
          
          toast.loading('Trying direct purchase method...');
          try {
            tokenId = await AOService.purchaseAccessDirect(purchaseData);
          } catch (directError) {
            console.log('Direct purchase also failed:', directError);
            throw bypassError; // Throw the original error
          }
        } else {
          throw bypassError;
        }
      }

      toast.dismiss();
      
      if (tokenId.startsWith('existing-access-')) {
        toast.success('✅ You already have access to this video!');
      } else {
        toast.success(`✅ ${accessType} access purchased successfully! Token ID: ${tokenId}`);
      }

      // Refresh access status
      await checkAccess();

    } catch (error) {
      toast.dismiss();
      console.error('Purchase failed:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('User already has premium access')) {
          toast.success('✅ You already have premium access to this video!');
          await checkAccess();
          return;
        }
        if (error.message.includes('User already has basic access')) {
          toast.success('✅ You already have basic access to this video!');
          await checkAccess();
          return;
        }
      }
      
      toast.error(`❌ Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStartWatching = async () => {
    if (!accessStatus.granted || !accessStatus.sessionId) {
      toast.error('No valid access session');
      return;
    }

    try {
      try {
        const started = await AOService.startViewingSession(accessStatus.sessionId, videoId!);
        if (started) {
          toast.success('Starting video playback');
          // Here you would integrate with your video player
        }
      } catch (aoError) {
        console.log('AO start watching failed, simulating success:', aoError);
        // Simulate successful start for demo purposes
        toast.success('Starting video playback (Demo Mode)');
        // Here you would integrate with your video player
      }
    } catch (error) {
      console.error('Start watching failed:', error);
      toast.error('Failed to start video playback');
    }
  };

  // Add reset function for testing
  const handleResetProcessState = async () => {
    try {
      toast.loading('🔄 Resetting process state...');
      
      // Use comprehensive reset
      await AOService.comprehensiveReset();
      
      toast.dismiss();
      toast.success('✅ Process state reset complete!');
      
      // Force page refresh to get fresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      toast.dismiss();
      console.error('Reset failed:', error);
      toast.error('❌ Reset failed. Please try again.');
    }
  };

  const handleCheckActualAccess = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    try {
      toast.loading('🔍 Checking actual access...');
      
      const actualAccess = await AOService.checkActualAccess(videoId!, walletAddress);
      
      toast.dismiss();
      
      // Show detailed results
      const message = `Access Check Results:
• Creator Access: ${actualAccess.hasCreatorAccess ? '✅ Yes' : '❌ No'}
• Basic Access: ${actualAccess.hasBasicAccess ? '✅ Yes' : '❌ No'}
• Premium Access: ${actualAccess.hasPremiumAccess ? '✅ Yes' : '❌ No'}
• Balances: ${JSON.stringify(actualAccess.accessDetails)}`;
      
      console.log('Actual access check:', actualAccess);
      toast.success('Access check complete! Check console for details.');
      
    } catch (error) {
      toast.dismiss();
      console.error('Access check failed:', error);
      toast.error('❌ Access check failed');
    }
  };

  const handleTestMainnetConnectivity = async () => {
    try {
      toast.loading('🧪 Testing mainnet connectivity...');
      
      const result = await AOService.testMainnetConnectivity();
      
      toast.dismiss();
      
      if (result.success) {
        toast.success('✅ Mainnet connectivity test passed!');
      } else {
        toast.error(`❌ Mainnet connectivity test failed: ${result.errors.join(', ')}`);
      }
      
      console.log('Mainnet connectivity test results:', result);
      
    } catch (error) {
      toast.dismiss();
      console.error('Mainnet connectivity test failed:', error);
      toast.error('❌ Mainnet connectivity test failed');
    }
  };

  const handleTestAccessDetection = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    try {
      toast.loading('🧪 Testing access detection...');
      
      const result = await AOService.testAccessDetection(walletAddress, videoId!);
      
      toast.dismiss();
      
      if (result.success) {
        toast.success('✅ Access detection test passed!');
      } else {
        toast.error(`❌ Access detection test failed: ${result.errors.join(', ')}`);
      }
      
      console.log('Access detection test results:', result);
      
    } catch (error) {
      toast.dismiss();
      console.error('Access detection test failed:', error);
      toast.error('❌ Access detection test failed');
    }
  };

  if (isLoading) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-white mb-4">Loading Video...</h1>
          <p className="text-white/60 mb-6">Please wait while we load the video.</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Video Not Found</h1>
          <p className="text-white/60 mb-6">The video with ID "{videoId}" doesn't exist on the blockchain.</p>
          <div className="text-white/40 text-sm mb-6">
            <p>Available videos: {videos.length}</p>
            <p>Video IDs: {videos.slice(0, 5).map(v => v.id).join(', ')}...</p>
          </div>
          
          {/* Load from blockchain */}
          <button
            onClick={() => {
              console.log('🔄 Refreshing video from blockchain:', videoId);
              refreshVideoFromBlockchain(videoId);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4 mr-2"
          >
            🔄 Load from Blockchain
          </button>
          
          {/* Refresh all data */}
          <button
            onClick={() => {
              console.log('🔄 Refreshing all videos from blockchain');
              refreshAllData();
              setTimeout(() => window.location.reload(), 2000);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors mb-4 mr-2"
          >
            🔄 Refresh All Data
          </button>
          
          {/* Debug: Add test video */}
          <button
            onClick={() => {
              const testVideo = {
                id: videoId,
                title: 'Test Video - Uploaded Content',
                description: 'This is a test video for debugging uploaded content with proper thumbnail and video URLs',
                creator: 'Test Creator',
                creatorAddress: 'test-address',
                thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop',
                duration: '5:00',
                views: 0,
                likes: 0,
                price: 0,
                rentPrice: 0,
                rentDuration: 7,
                isFree: true,
                tags: ['test', 'uploaded', 'demo'],
                createdAt: new Date().toISOString().split('T')[0],
                arweaveId: 'https://arweave.net/demo-video-tx-id', // Use a demo Arweave URL
                nftTokenId: videoId,
              };
              console.log('Adding test video:', testVideo);
              addVideo(testVideo);
              window.location.reload();
            }}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition-colors mb-4 mr-2"
          >
            🐛 Add Test Video (Debug)
          </button>
          
          <Link 
            href="/"
            className="block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video Section */}
        <div className="lg:col-span-2">
          {/* Video Player - Only show if access is granted */}
          <div className="relative aspect-video bg-black rounded-lg mb-6 overflow-hidden">
            {(accessStatus.granted || video.isFree) ? (
              <>
                <VideoPlayer
                  videoUrl={video.videoUrl || (video.arweaveId?.startsWith('blob:') || video.arweaveId?.startsWith('https://arweave.net/') ? video.arweaveId : `https://arweave.net/${video.arweaveId}`)}
                  thumbnailUrl={video.thumbnail}
                  title={video.title}
                  isUploaded={Boolean(video.arweaveId || video.videoUrl)}
                  playbackId={video.livepeerPlaybackId}
                  hlsUrl={video.hlsUrl}
                />
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between text-white">
                    <span className="text-sm">{video.duration}</span>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => {
                          setIsLiked(!isLiked);
                          if (video) {
                            toggleLike(video.id);
                          }
                        }}
                        className={`p-2 rounded-full ${isLiked ? 'bg-red-500' : 'bg-black/50'}`}
                      >
                        {isLiked ? '❤️' : '🤍'}
                      </button>
                      <button 
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={`p-2 rounded-full ${isFavorite ? 'bg-red-500' : 'bg-black/50'}`}
                      >
                        {isFavorite ? '⭐' : '☆'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Access denied - show locked video preview
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black relative">
                {/* Background thumbnail with blur */}
                <div 
                  className="absolute inset-0 bg-cover bg-center filter blur-sm opacity-30"
                  style={{
                    backgroundImage: `url(${video.thumbnail})`
                  }}
                />
                
                {/* Lock overlay */}
                <div className="relative z-10 text-center">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Premium Content</h3>
                  <p className="text-white/80 mb-4">
                    Purchase access to watch this video
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-white/60">
                    <span>💰 Buy: ${video.price}</span>
                    <span>🎬 Rent: ${video.rentPrice}</span>
                  </div>
                </div>
                
                {/* Scroll to purchase button */}
                <button
                  onClick={() => {
                    const purchaseSection = document.getElementById('purchase-section');
                    if (purchaseSection) {
                      purchaseSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Purchase Access →
                </button>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="card-hover p-6 mb-6">
            <h1 className="text-2xl font-bold text-white mb-4">{video.title}</h1>
            <p className="text-white/60 mb-4">{video.description}</p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-white/60">
                <span>👁️ {formatNumber(video.views)} views</span>
                <span>❤️ {formatNumber(video.likes)} likes</span>
                <span>📅 {new Date(video.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <span 
                  key={tag}
                  className="bg-white/10 text-white/60 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Creator Info */}
          {creator && (
            <div className="card-hover p-6">
              <div className="flex items-center space-x-4">
                <img 
                  src={creator.avatar} 
                  alt={creator.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{creator.name}</h3>
                  <p className="text-white/60 text-sm mb-2">{creator.bio}</p>
                  <div className="flex items-center space-x-4 text-xs text-white/40">
                    <span>👥 {formatNumber(creator.followers)} followers</span>
                    <span>🎬 {creator.videos} videos</span>
                    {creator.verified && <span className="text-blue-400">✓ Verified</span>}
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Follow
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Purchase Options */}
          <div id="purchase-section" className="card-hover p-6">
            <h3 className="text-lg font-semibold text-white mb-4">💰 Access Options</h3>
            
            {/* Reset Button for Testing */}
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm mb-2">🧪 Testing Tools</p>
              <button 
                onClick={handleResetProcessState}
                className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm mb-2"
              >
                🔄 Reset Process State
              </button>
              <button 
                onClick={handleCheckActualAccess}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                🔍 Check Actual Access
              </button>
              <button 
                onClick={handleTestMainnetConnectivity}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm mb-2"
              >
                🌐 Test Mainnet Connectivity
              </button>
              <button 
                onClick={handleTestAccessDetection}
                className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm"
              >
                🧪 Test Access Detection
              </button>
              <button 
                onClick={async () => {
                  if (!walletAddress) {
                    toast.error('Please connect your wallet first');
                    return;
                  }
                  try {
                    toast.loading('🚀 Testing direct purchase...');
                    const purchaseData: AccessPurchaseData = {
                      videoId: videoId!,
                      accessType: 'premium',
                      price: 2.99
                    };
                    const tokenId = await AOService.purchaseAccessDirect(purchaseData);
                    toast.dismiss();
                    toast.success(`✅ Direct purchase successful! Token ID: ${tokenId}`);
                    await checkAccess();
                  } catch (error) {
                    toast.dismiss();
                    console.error('Direct purchase test failed:', error);
                    toast.error(`❌ Direct purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                🚀 Test Direct Purchase
              </button>
              <button 
                onClick={async () => {
                  try {
                    toast.loading('🧪 Testing AO process actions...');
                    
                    const processes = [
                      { name: 'Premium Access', id: 'IXOzHMQZoBIyq_mtcoHG9mfhusxSwYu932wWB6L6RjE' },
                      { name: 'Basic Access', id: 'VxGBhfTqCQwrcxovPPpY6fdHqooHh8xITuI5ry3lTJs' }
                    ];
                    
                    const results: any = {};
                    
                    for (const process of processes) {
                      const result = await AOService.testProcessActions(process.id);
                      results[process.name] = result;
                    }
                    
                    toast.dismiss();
                    console.log('AO Process Actions Test Results:', results);
                    toast.success('✅ AO process actions test complete! Check console for details.');
                    
                  } catch (error) {
                    toast.dismiss();
                    console.error('AO process actions test failed:', error);
                    toast.error(`❌ AO process actions test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                🧪 Test AO Process Actions
              </button>
              <p className="text-yellow-400/60 text-xs mt-1">
                Clears all access records for fresh testing
              </p>
            </div>
            
            {/* Show access status */}
            {isLoadingAccess ? (
              <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-white/60">Checking access...</p>
              </div>
            ) : accessStatus.granted ? (
              <div className="text-center">
                <div className="text-4xl mb-4">
                  {accessStatus.accessType === 'creator' ? '👑' : 
                   accessStatus.accessType === 'free' ? '🎉' : 
                   accessStatus.accessType === 'premium' ? '⭐' : '🎬'}
                </div>
                <h4 className="text-xl font-semibold text-green-400 mb-2">
                  {accessStatus.accessType === 'creator' ? 'Creator Access' :
                   accessStatus.accessType === 'free' ? 'Free Video' :
                   accessStatus.accessType === 'premium' ? 'Premium Access' :
                   'Basic Access'}
                </h4>
                <p className="text-white/60 mb-4">
                  {accessStatus.accessType === 'creator' ? 'You own this video' :
                   accessStatus.accessType === 'free' ? 'This video is free to watch' :
                   'You have access to this video'}
                </p>
                <button 
                  onClick={handleStartWatching}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  🎬 Watch Now
                </button>
              </div>
            ) : video.isFree ? (
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h4 className="text-xl font-semibold text-green-400 mb-2">Free Video</h4>
                <p className="text-white/60 mb-4">This video is completely free to watch!</p>
                <button 
                  onClick={handleStartWatching}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  🎬 Watch Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Premium Option */}
                <div className="border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">Premium Access</h4>
                    <span className="text-2xl font-bold text-blue-400">${video.price}</span>
                  </div>
                  <p className="text-white/60 text-sm mb-3">
                    Permanent access to this video. You'll receive an NFT that you can trade or sell.
                  </p>
                  <button 
                    onClick={() => handlePurchase('premium')}
                    disabled={isPurchasing}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isPurchasing ? '⏳ Processing...' : '💰 Buy Premium'}
                  </button>
                </div>

                {/* Basic Access Options */}
                <div className="border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">Basic Access</h4>
                    <span className="text-2xl font-bold text-green-400">${video.rentPrice}</span>
                  </div>
                  <p className="text-white/60 text-sm mb-3">
                    Time-limited access. Perfect for one-time viewing.
                  </p>
                  
                  {/* Duration Options */}
                  <div className="space-y-2 mb-3">
                    <button 
                      onClick={() => handlePurchase('basic', 7)}
                      disabled={isPurchasing}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {isPurchasing ? '⏳ Processing...' : '7 Days - $0.99'}
                    </button>
                    <button 
                      onClick={() => handlePurchase('basic', 30)}
                      disabled={isPurchasing}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {isPurchasing ? '⏳ Processing...' : '30 Days - $2.99'}
                    </button>
                    <button 
                      onClick={() => handlePurchase('basic', 90)}
                      disabled={isPurchasing}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {isPurchasing ? '⏳ Processing...' : '90 Days - $6.99'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NFT Info */}
          {video.nftTokenId && (
            <div className="card-hover p-6">
              <h3 className="text-lg font-semibold text-white mb-4">🖼️ NFT Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Token ID:</span>
                  <span className="text-white font-mono text-sm">{video.nftTokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Type:</span>
                  <span className="text-purple-400">Creator Rights</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Royalty:</span>
                  <span className="text-green-400">10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Network:</span>
                  <span className="text-blue-400">Arweave</span>
                </div>
              </div>
            </div>
          )}

          {/* Related Videos */}
          <div className="card-hover p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📺 Related Videos</h3>
            <div className="space-y-3">
              {mockVideos
                .filter(v => v.id !== video.id)
                .slice(0, 3)
                .map((relatedVideo) => (
                  <Link 
                    key={relatedVideo.id} 
                    href={`/video/${relatedVideo.id}`}
                    className="flex space-x-3 group"
                  >
                    <img 
                      src={relatedVideo.thumbnail} 
                      alt={relatedVideo.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {relatedVideo.title}
                      </h4>
                      <p className="text-white/60 text-xs">
                        {relatedVideo.creator || 'Unknown Creator'}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-white/40">
                        <span>{relatedVideo.duration}</span>
                        <span>•</span>
                        <span>{formatNumber(relatedVideo.views)} views</span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;