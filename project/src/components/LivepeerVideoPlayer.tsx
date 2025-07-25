import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { LivepeerService } from '../services/livepeerService';

interface LivepeerVideoPlayerProps {
  playbackId?: string;
  title: string;
  assetId?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

interface VideoMetrics {
  playTime: number;
  viewCount: number;
  playthroughRate: number;
}

const LivepeerVideoPlayer: React.FC<LivepeerVideoPlayerProps> = ({
  playbackId,
  title,
  assetId,
  poster,
  autoPlay = false,
  muted = false,
  loop = false,
  controls = true,
  onPlay,
  onPause,
  onEnd,
  onError,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen] = useState(false);
  const [quality, setQuality] = useState<string>('auto');
  const [metrics, setMetrics] = useState<VideoMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Load metrics from Livepeer service if assetId is provided
  useEffect(() => {
    if (assetId) {
      LivepeerService.getVideoMetrics(assetId).then(metricsData => {
        if (metricsData) {
          setMetrics({
            playTime: 0,
            viewCount: Array.isArray(metricsData) ? metricsData.length : 0,
            playthroughRate: 0,
          });
        }
      }).catch(error => {
        console.warn('Failed to load video metrics:', error);
      });
    }
  }, [assetId]);

  useEffect(() => {
    if (!playbackId || !videoRef.current) return;

    const video = videoRef.current;
    const hlsUrl = LivepeerService.getHLSUrl(playbackId);

    if (Hls.isSupported()) {
      // Use HLS.js for browsers that support it
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
        if (autoPlay) {
          video.play().catch(e => console.warn('Autoplay failed:', e));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error occurred while loading video');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error occurred');
              hls.recoverMediaError();
              break;
            default:
              setError('Fatal error occurred');
              hls.destroy();
              break;
          }
          onError?.(new Error(data.reason || 'HLS playback error'));
        }
      });

      // Quality level management
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        setQuality(level ? `${level.height}p` : 'auto');
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl;
      if (autoPlay) {
        video.play().catch(e => console.warn('Autoplay failed:', e));
      }
    } else {
      // Fallback to MP4
      const mp4Url = LivepeerService.getMP4Url(playbackId);
      video.src = mp4Url;
      if (autoPlay) {
        video.play().catch(e => console.warn('Autoplay failed:', e));
      }
    }
  }, [playbackId, autoPlay, onError]);

  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEnd?.();
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.warn('Play failed:', e));
      }
    }
  };

  const changeQuality = (newQuality: string) => {
    if (!hlsRef.current) return;

    if (newQuality === 'auto') {
      hlsRef.current.currentLevel = -1;
    } else {
      const level = hlsRef.current.levels.findIndex(l => `${l.height}p` === newQuality);
      if (level !== -1) {
        hlsRef.current.currentLevel = level;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Use HLS.js for streaming if playbackId is available
  if (playbackId) {
    return (
      <div ref={containerRef} className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          poster={poster}
          muted={muted}
          loop={loop}
          controls={controls}
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={(e) => {
            console.error('Video error:', e);
            setError('Video playback failed');
            onError?.(new Error('Video playback failed'));
          }}
        />
        
        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 text-red-500">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Playback Error</h3>
              <p className="text-white/80 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Video metrics overlay (for development) */}
        {metrics && process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
            <div>Views: {metrics.viewCount}</div>
            <div>Play Time: {formatTime(metrics.playTime)}</div>
            <div>Completion: {Math.round(metrics.playthroughRate * 100)}%</div>
          </div>
        )}

        {/* Quality indicator */}
        <div className="absolute top-4 left-4 bg-black/80 text-white px-2 py-1 rounded text-xs">
          {quality}
        </div>
      </div>
    );
  }

  // Fallback to native video element
  return (
    <div ref={containerRef} className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        muted={muted}
        loop={loop}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={(e) => {
          console.error('Video error:', e);
          setError('Video playback failed');
          onError?.(new Error('Video playback failed'));
        }}
      />
      
      {/* Custom controls overlay */}
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <div className="flex-1 flex items-center space-x-2">
              <span className="text-white text-sm">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white text-sm">{formatTime(duration)}</span>
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivepeerVideoPlayer;