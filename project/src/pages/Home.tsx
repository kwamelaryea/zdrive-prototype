import React, { useEffect } from 'react';
import Link from 'next/link';
import { useVideos } from '../contexts/VideoContext';
import { formatNumber } from '../utils/format';

const Home: React.FC = () => {
  const { videos, fixBrokenThumbnails, loadVideosFromNFT } = useVideos();
  
  // Load videos from NFT metadata on component mount
  useEffect(() => {
    const loadNFTVideos = async () => {
      console.log('🏠 Home: Loading videos from NFT metadata (source of truth)...');
      await loadVideosFromNFT();
    };
    
    loadNFTVideos();
  }, []); // Run once on mount
  console.log('Home component rendering, videos:', videos.length);
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    console.warn('Thumbnail failed to load:', {
      src: img.src,
      alt: img.alt,
      videoId: img.getAttribute('data-video-id')
    });
    // Set fallback image if thumbnail fails to load
    img.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop';
  };
  
  return (
    <div className="container-responsive py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Welcome to <span className="text-blue-400">ZDrive</span>
        </h1>
        <p className="text-white/60 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          The future of NFT-powered video streaming. Own exclusive content, support creators, and earn from the decentralized creator economy.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/search" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            🔍 Discover Content
          </Link>
          <Link 
            href="/upload" 
            className="bg-white/10 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
          >
            📤 Upload Video
          </Link>
        </div>
      </div>

      {/* Featured Videos */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Featured Videos ({videos.length})</h2>
          <div className="flex items-center space-x-4">
            {/* Debug buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  console.log('Fixing broken thumbnails...');
                  fixBrokenThumbnails();
                }}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                🔧 Fix Thumbnails
              </button>
              <button
                onClick={() => {
                  console.log('Current videos:', videos);
                  console.log('Video thumbnails:', videos.map(v => ({ 
                    id: v.id, 
                    title: v.title, 
                    thumbnail: v.thumbnail,
                    thumbnailType: v.thumbnail.startsWith('data:') ? 'data-url' : 
                                   v.thumbnail.startsWith('blob:') ? 'blob-url' : 
                                   v.thumbnail.startsWith('https://arweave.net/') ? 'arweave-url' : 
                                   v.thumbnail.startsWith('https://images.unsplash.com/') ? 'fallback-url' : 'other'
                  })));
                  alert('Check console for detailed video data');
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                📊 Debug Data
              </button>
              <button
                onClick={() => {
                  // Clear all videos and reload
                  localStorage.removeItem('zdrive-videos');
                  window.location.reload();
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                🗑️ Clear All
              </button>
            </div>
            <Link href="/search" className="text-blue-400 hover:text-blue-300 transition-colors">
              View All →
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.slice(0, 4).map((video) => (
            <Link 
              key={video.id} 
              href={`/video/${video.id}`}
              className="group block"
            >
              <div className="card-hover overflow-hidden rounded-lg">
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    data-video-id={video.id}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  
                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                  
                  {/* Price Badge */}
                  {!video.isFree && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
                      ${video.price}
                    </div>
                  )}
                  
                  {/* Free Badge */}
                  {video.isFree && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">
                      FREE
                    </div>
                  )}
                </div>
                
                {/* Video Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-white/60 text-xs mb-3 line-clamp-2">
                    {video.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>
                      {typeof video.creator === 'string' 
                        ? video.creator 
                        : video.creator?.name || 'Unknown Creator'
                      }
                    </span>
                    <div className="flex items-center space-x-3">
                      <span>👁️ {formatNumber(video.views)}</span>
                      <span>❤️ {formatNumber(video.likes)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Platform Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card-hover p-6 text-center">
          <div className="text-4xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-white mb-2">NFT Videos</h3>
          <p className="text-white/60">Own exclusive video content as NFTs with permanent access rights</p>
        </div>
        
        <div className="card-hover p-6 text-center">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-white mb-2">Creator Economy</h3>
          <p className="text-white/60">Support creators directly and earn royalties from content sales</p>
        </div>
        
        <div className="card-hover p-6 text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold text-white mb-2">Decentralized</h3>
          <p className="text-white/60">Built on Arweave blockchain for permanent, censorship-resistant storage</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">{videos.length}+</div>
          <div className="text-white/60 text-sm">Videos</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">3</div>
          <div className="text-white/60 text-sm">Creators</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">2</div>
          <div className="text-white/60 text-sm">NFTs</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">∞</div>
          <div className="text-white/60 text-sm">Storage</div>
        </div>
      </div>
    </div>
  );
};

export default Home;