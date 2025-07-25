import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useWallet } from '../contexts/WalletContext';
import { useVideos } from '../contexts/VideoContext';
import { useAO } from '../hooks/useAO';
import { VideoMetadataService } from '../services/videoMetadataService';
import { AtomicNFTService } from '../services/atomicNftService';
import { Video } from '../data/mockData';
import toast from 'react-hot-toast';
import Arweave from 'arweave';

interface UploadStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

const UPLOAD_STEPS: UploadStep[] = [
  {
    id: 'validation',
    title: 'Validating Files',
    description: 'Checking file formats and sizes',
    status: 'pending',
    progress: 0
  },
  {
    id: 'video-upload',
    title: 'Uploading Video',
    description: 'Uploading video file to Arweave',
    status: 'pending',
    progress: 0
  },
  {
    id: 'thumbnail-upload',
    title: 'Uploading Thumbnail',
    description: 'Uploading thumbnail image to Arweave',
    status: 'pending',
    progress: 0
  },
  {
    id: 'nft-creation',
    title: 'Creating NFT',
    description: 'Minting Creator NFT on AO blockchain',
    status: 'pending',
    progress: 0
  },
  {
    id: 'blockchain-registration',
    title: 'Blockchain Registration',
    description: 'Registering NFT on blockchain',
    status: 'pending',
    progress: 0
  }
];

const Upload: React.FC = () => {
  const router = useRouter();
  const { isConnected, walletAddress } = useWallet();
  const { addVideo, loadVideosFromNFT } = useVideos();
  const { uploadVideo, error, clearError } = useAO();
  
  // Initialize Arweave
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    rentPrice: '',
    rentDuration: '7',
    isFree: false,
    tags: '',
    genre: 'General',
    thumbnail: null as File | null,
    video: null as File | null
  });
  const [showProgress, setShowProgress] = useState(false);
  const [customSteps, setCustomSteps] = useState<UploadStep[]>(UPLOAD_STEPS);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const updateStep = (stepId: string, status: UploadStep['status'], progress: number) => {
    setCustomSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status, progress } : step
      )
    );
  };

  // Helper function to upload file to Arweave
  const uploadToArweave = async (file: File | Blob, contentType: string, stepId: string, customTags?: Record<string, string>): Promise<string> => {
    try {
      updateStep(stepId, 'processing', 10);
      
      // Check if wallet is connected
      if (!window.arweaveWallet) {
        throw new Error('ArConnect wallet not found. Please install ArConnect.');
      }

      // Get file data
      const fileBuffer = await file.arrayBuffer();
      updateStep(stepId, 'processing', 30);

      // Create Arweave transaction
      const transaction = await arweave.createTransaction({
        data: fileBuffer
      });

      // Add basic tags
      transaction.addTag('Content-Type', contentType);
      transaction.addTag('App-Name', 'ZDrive');
      transaction.addTag('App-Version', '1.0.0');
      
      // Add file-specific tags if it's a File (not Blob)
      if (file instanceof File) {
        transaction.addTag('File-Name', file.name);
        transaction.addTag('File-Size', file.size.toString());
      }
      
      // Add custom tags for NFT metadata
      if (customTags) {
        Object.entries(customTags).forEach(([name, value]) => {
          transaction.addTag(name, value);
        });
      }

      updateStep(stepId, 'processing', 50);

      // Sign transaction with ArConnect
      await arweave.transactions.sign(transaction);
      updateStep(stepId, 'processing', 70);

      // Upload to Arweave
      const response = await arweave.transactions.post(transaction);
      
      if (response.status !== 200 && response.status !== 202) {
        throw new Error(`Arweave upload failed with status: ${response.status}`);
      }

      updateStep(stepId, 'completed', 100);
      console.log(`✅ ${stepId} uploaded successfully:`, transaction.id);
      
      return transaction.id;
    } catch (error) {
      updateStep(stepId, 'error', 0);
      console.error(`❌ ${stepId} upload failed:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Production wallet validation
    if (!isConnected) {
      toast.error('Please connect your wallet to upload videos');
      return;
    }

    if (!walletAddress) {
      toast.error('Wallet address not found. Please reconnect your wallet.');
      return;
    }

    // Validate ArConnect connection
    if (!window.arweaveWallet) {
      toast.error('ArConnect wallet not found. Please install ArConnect extension.');
      return;
    }

    if (!formData.video || !formData.thumbnail) {
      toast.error('Please select both video and thumbnail files');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a video title');
      return;
    }

    setShowProgress(true);
    setIsUploading(true);
    clearError();

    try {
      // Step 1: Validation
      updateStep('validation', 'processing', 0);
      
      // Validate file sizes and formats
      const maxVideoSize = 500 * 1024 * 1024; // 500MB
      const maxThumbnailSize = 10 * 1024 * 1024; // 10MB
      
      if (formData.video.size > maxVideoSize) {
        throw new Error('Video file too large. Maximum size is 500MB.');
      }
      
      if (formData.thumbnail.size > maxThumbnailSize) {
        throw new Error('Thumbnail file too large. Maximum size is 10MB.');
      }
      
      updateStep('validation', 'completed', 100);

      // Step 2: Upload video to Arweave
      const videoTxId = await uploadToArweave(
        formData.video, 
        'video/mp4', 
        'video-upload'
      );

      // Step 3: Upload thumbnail to Arweave  
      const thumbnailTxId = await uploadToArweave(
        formData.thumbnail,
        'image/jpeg',
        'thumbnail-upload'
      );

      // Step 4: Create atomic NFT with SmartWeave contract for wallet visibility
      updateStep('nft-creation', 'processing', 0);
      
      const videoId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const metadata = {
        name: `ZDrive: ${formData.title}`,
        description: formData.description,
        image: `https://arweave.net/${thumbnailTxId}`,
        animation_url: `https://arweave.net/${videoTxId}`,
        external_url: `https://zdrive.app/video/${videoId}`,
        // Enhanced metadata for better compatibility
        genre: formData.genre,
        duration: 0, // Could be extracted from video file
        isFree: formData.isFree,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        buyPrice: formData.isFree ? 0 : parseFloat(formData.price) || 0,
        rentPrice: formData.isFree ? 0 : parseFloat(formData.rentPrice) || 0,
        rentDuration: parseInt(formData.rentDuration),
        attributes: [
          { trait_type: "Creator", value: "ZDrive Platform" },
          { trait_type: "Genre", value: formData.genre },
          { trait_type: "Type", value: "Video NFT" },
          { trait_type: "Collection", value: "ZDrive Creator Rights" },
          { trait_type: "Price", value: formData.isFree ? "0" : (formData.price || "0") },
          { trait_type: "Free", value: formData.isFree.toString() },
          { trait_type: "Platform", value: "ZDrive" },
          { trait_type: "Standard", value: "ANS-110" },
          { trait_type: "Blockchain", value: "Arweave/AO" }
        ]
      };

      // Create enhanced atomic NFT for maximum wallet compatibility
      console.log('🎨 Creating enhanced atomic NFT for production...');
      updateStep('nft-creation', 'processing', 25);
      
      const metadataTxId = await AtomicNFTService.createAtomicNFT(
        metadata,
        walletAddress || '',
        videoId,
        videoTxId,
        thumbnailTxId
      );
      console.log('✅ Enhanced atomic NFT created with transaction ID:', metadataTxId);

      // Verify NFT creation
      updateStep('nft-creation', 'processing', 50);
      console.log('🔍 Verifying NFT creation...');
      
      const verificationResult = await AtomicNFTService.verifyNFTCreation(metadataTxId);
      if (verificationResult.exists) {
        if (verificationResult.status === 'confirmed') {
          console.log('✅ NFT verification successful');
          updateStep('nft-creation', 'processing', 75);
        } else if (verificationResult.status === 'pending') {
          console.log('⏳ NFT verification pending:', verificationResult.error);
          updateStep('nft-creation', 'processing', 75);
          // Show pending status to user
          toast.success('NFT created! Waiting for confirmation...', {
            duration: 5000,
          });
        } else {
          console.warn('⚠️ NFT verification status unknown:', verificationResult.error);
          updateStep('nft-creation', 'processing', 75);
        }
      } else {
        console.warn('⚠️ NFT verification failed:', verificationResult.error);
        // Continue anyway as verification might fail due to network delays
        toast('NFT created but verification pending. Check wallet in 5-10 minutes.', {
          duration: 5000,
          icon: '⚠️'
        });
      }
      
      updateStep('nft-creation', 'completed', 100);

      // Step 5: Prepare upload data for AO with Arweave transaction IDs
      const uploadData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        video: formData.video,
        thumbnail: formData.thumbnail,
        buyPrice: formData.isFree ? 0 : parseFloat(formData.price) || 0,
        rentPrice: formData.isFree ? 0 : parseFloat(formData.rentPrice) || 0,
        rentDuration: parseInt(formData.rentDuration),
        isFree: formData.isFree,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        genre: formData.genre,
        // Add Arweave transaction IDs
        arweaveVideoId: videoTxId,
        arweaveThumbnailId: thumbnailTxId,
        arweaveMetadataId: metadataTxId,
      };

      // Step 6: Create NFT using the AO hook with production error handling
      console.log('📡 Sending to AO processes for production integration...');
      let aoResult;
      try {
        aoResult = await uploadVideo(uploadData);
        console.log('✅ AO integration successful:', aoResult);
      } catch (aoError) {
        console.error('❌ AO integration error:', aoError);
        // For production resilience, continue with atomic NFT even if AO fails
        console.log('⚠️ Continuing with atomic NFT only (AO integration failed)');
        aoResult = videoId;
        toast.error('AO integration failed, but atomic NFT created successfully');
      }
      
      updateStep('nft-creation', 'completed', 100);
      updateStep('blockchain-registration', 'completed', 100);

      // Add the video to the video context
      const videoData = typeof aoResult === 'object' ? aoResult : { 
        videoId: videoId, 
        thumbnailUrl: `https://arweave.net/${thumbnailTxId}`, 
        videoUrl: `https://arweave.net/${videoTxId}` 
      };
      
      const newVideo = {
        id: typeof aoResult === 'string' ? aoResult : videoData.videoId,
        title: uploadData.title,
        description: uploadData.description,
        thumbnail: videoData.thumbnailUrl,
        videoUrl: videoData.videoUrl,
        arweaveId: videoData.videoUrl.split('/').pop(),
        creator: walletAddress || 'Unknown Creator',
        creatorAddress: walletAddress || '',
        duration: '0:00',
        views: 0,
        likes: 0,
        price: uploadData.buyPrice,
        rentPrice: uploadData.rentPrice,
        rentDuration: uploadData.rentDuration,
        isFree: uploadData.isFree,
        tags: uploadData.tags,
        genre: uploadData.genre,
        createdAt: new Date().toISOString().split('T')[0],
      };
      
      addVideo(newVideo as any);
      
      // Store video metadata as source of truth
      await VideoMetadataService.storeVideoMetadata(newVideo as Video);
      
      // Force reload videos from metadata service to ensure visibility
      await loadVideosFromNFT();
      
      const actualVideoId = typeof aoResult === 'string' ? aoResult : videoData.videoId;
      console.log('✅ Upload completed successfully! Video ID:', actualVideoId);
      
      // Set upload complete state
      setUploadComplete(true);
      setUploadedVideoId(actualVideoId);
      
      // Show success message
      toast.success('🎉 Video uploaded successfully! NFT created!', {
        duration: 4000,
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed: ' + (error as Error).message);
      
      // Mark current processing step as error
      setCustomSteps(prev => 
        prev.map(step => 
          step.status === 'processing' ? { ...step, status: 'error' } : step
        )
      );
      
      // Reset upload state
      setUploadComplete(false);
      setUploadedVideoId(null);
    } finally {
      // Always reset uploading state
      setIsUploading(false);
    }
  };

  // Use custom steps that include Livepeer integration
  const uploadSteps = customSteps;

  return (
    <div className="container-responsive py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Upload Video</h1>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mb-8 card-hover p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload Progress</h3>
            <div className="space-y-4">
              {uploadSteps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.status === 'completed' ? 'bg-green-600 text-white' :
                    step.status === 'processing' ? 'bg-blue-600 text-white animate-pulse' :
                    step.status === 'error' ? 'bg-red-600 text-white' :
                    'bg-white/20 text-white/60'
                  }`}>
                    {step.status === 'completed' ? '✓' :
                     step.status === 'error' ? '✗' :
                     step.status === 'processing' ? '⟳' :
                     index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium ${
                        step.status === 'processing' ? 'text-blue-400' :
                        step.status === 'completed' ? 'text-green-400' :
                        step.status === 'error' ? 'text-red-400' :
                        'text-white/60'
                      }`}>
                        {step.title}
                      </span>
                      <span className="text-sm text-white/40">
                        {step.status === 'processing' ? 'In Progress...' :
                         step.status === 'completed' ? 'Complete' :
                         step.status === 'error' ? 'Failed' :
                         'Pending'}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          step.status === 'completed' ? 'bg-green-500' :
                          step.status === 'processing' ? 'bg-blue-500' :
                          step.status === 'error' ? 'bg-red-500' :
                          'bg-white/20'
                        }`}
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-white/60 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Upload Success State */}
        {uploadComplete && uploadedVideoId && (
          <div className="card-hover p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-4">Upload Successful!</h2>
            <p className="text-white/60 mb-6">
              Your video has been uploaded to Arweave and an NFT has been created successfully!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  if (uploadedVideoId && typeof uploadedVideoId === 'string') {
                    router.push(`/video/${uploadedVideoId}`);
                  } else {
                    console.warn('Invalid video ID, redirecting to home:', uploadedVideoId);
                    router.push('/');
                  }
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                🎬 View Video
              </button>
              
              <button
                onClick={() => {
                  setUploadComplete(false);
                  setUploadedVideoId(null);
                  setShowProgress(false);
                  setFormData({
                    title: '',
                    description: '',
                    price: '',
                    rentPrice: '',
                    rentDuration: '7',
                    isFree: false,
                    tags: '',
                    genre: 'General',
                    thumbnail: null,
                    video: null
                  });
                }}
                className="bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                📤 Upload Another
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="bg-white/10 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        )}

        {/* Upload Form */}
        {!isUploading && !uploadComplete && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="card-hover p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-white/80 mb-2">
                    Video Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter video title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-white/80 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your video"
                  />
                </div>

                <div>
                  <label htmlFor="genre" className="block text-sm font-medium text-white/80 mb-2">
                    Genre
                  </label>
                  <select
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="General">General</option>
                    <option value="Music">Music</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Technology">Technology</option>
                    <option value="Sports">Sports</option>
                    <option value="News">News</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Documentary">Documentary</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-white/80 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="card-hover p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Video Files</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="video" className="block text-sm font-medium text-white/80 mb-2">
                    Video File *
                  </label>
                  <input
                    type="file"
                    id="video"
                    name="video"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="thumbnail" className="block text-sm font-medium text-white/80 mb-2">
                    Thumbnail Image *
                  </label>
                  <input
                    type="file"
                    id="thumbnail"
                    name="thumbnail"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Monetization */}
            <div className="card-hover p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Monetization</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isFree"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="isFree" className="text-sm font-medium text-white/80">
                    Make this video free to watch
                  </label>
                </div>

                {!formData.isFree && (
                  <>
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-white/80 mb-2">
                        Buy Price (AR)
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        step="0.001"
                        min="0"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.001"
                      />
                    </div>

                    <div>
                      <label htmlFor="rentPrice" className="block text-sm font-medium text-white/80 mb-2">
                        Rent Price (AR)
                      </label>
                      <input
                        type="number"
                        id="rentPrice"
                        name="rentPrice"
                        value={formData.rentPrice}
                        onChange={handleInputChange}
                        step="0.001"
                        min="0"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.0005"
                      />
                    </div>

                    <div>
                      <label htmlFor="rentDuration" className="block text-sm font-medium text-white/80 mb-2">
                        Rent Duration (days)
                      </label>
                      <select
                        id="rentDuration"
                        name="rentDuration"
                        value={formData.rentDuration}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Upload;