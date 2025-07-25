import React, { useState, useRef } from 'react';
import LivepeerVideoPlayer from './LivepeerVideoPlayer';

interface VideoPlayerProps {
  videoUrl?: string;
  thumbnailUrl: string;
  title: string;
  isUploaded?: boolean; // For uploaded videos vs mock videos
  playbackId?: string; // Livepeer playback ID
  assetId?: string; // Livepeer asset ID
  hlsUrl?: string; // HLS streaming URL
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  thumbnailUrl, 
  title, 
  isUploaded = false,
  playbackId,
  assetId,
  hlsUrl
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use Livepeer player if playbackId is available
  if (playbackId) {
    return (
      <LivepeerVideoPlayer
        playbackId={playbackId}
        assetId={assetId}
        title={title}
        poster={thumbnailUrl}
        controls={true}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnd={() => setIsPlaying(false)}
        className="w-full h-full"
      />
    );
  }

  const handlePlay = () => {
    if (isUploaded && videoUrl && videoUrl.startsWith('https://arweave.net/')) {
      // For Arweave-stored videos, try to play the actual video file
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.play().catch(error => {
          console.warn('Arweave video playback failed:', error);
          // Fallback to demo mode if video fails to play
          alert('🎬 Demo video playback! In a real implementation, this would stream from Arweave.');
        });
      }
    } else {
      // For mock videos or videos without URL, show demo message
      alert('🎬 Demo video playback! In a real implementation, this would stream from Arweave.');
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden group">
      {/* Video Element (for uploaded videos) */}
      {isUploaded && (videoUrl || hlsUrl) && (
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${isPlaying ? 'block' : 'hidden'}`}
          controls={true}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        >
          {hlsUrl && (
            <source src={hlsUrl} type="application/vnd.apple.mpegurl" />
          )}
          {videoUrl && (
            <source src={videoUrl} type="video/mp4" />
          )}
          Your browser does not support the video tag.
        </video>
      )}

      {/* Thumbnail (shown when not playing or for mock videos) */}
      <div className={`w-full h-full ${isPlaying && isUploaded ? 'hidden' : 'block'}`}>
        <img 
          src={thumbnailUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop'} 
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.warn('Thumbnail failed to load:', thumbnailUrl);
            // Set fallback thumbnail
            e.currentTarget.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop';
          }}
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handlePlay}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 transform hover:scale-110 transition-all duration-200 shadow-lg"
          >
            <svg 
              className="w-8 h-8 ml-1" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Video Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          {!isUploaded && (
            <p className="text-white/60 text-sm mt-1">
              🎬 Demo Mode - Click to simulate playback
            </p>
          )}
          {isUploaded && !videoUrl && !hlsUrl && (
            <p className="text-white/60 text-sm mt-1">
              📱 Uploaded Video - Processing for playback
            </p>
          )}
          {playbackId && (
            <p className="text-white/60 text-sm mt-1">
              🎥 Streaming via Livepeer
            </p>
          )}
        </div>
      </div>

      {/* Controls Overlay for uploaded videos */}
      {isUploaded && isPlaying && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={handlePause}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;