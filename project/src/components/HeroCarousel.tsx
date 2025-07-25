import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight, Star, Eye, Clock, Crown, Zap } from 'lucide-react';
import { useRouter } from 'next/router';
import { Video } from '../types';
import { formatNumber, formatDuration, formatPrice } from '../utils/format';
import { useWallet } from '../contexts/WalletContext';

interface HeroCarouselProps {
  videos: Video[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ videos }) => {
  const router = useRouter();
  const { convertArToUsd } = useWallet();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || videos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, videos.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setIsAutoPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
    setIsAutoPlaying(false);
  };

  const handleVideoClick = () => {
    router.push(`/video/${videos[currentIndex].id}`);
  };

  if (videos.length === 0) {
    return (
      <div className="relative h-96 bg-gradient-to-r from-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">Welcome to ZDrive</div>
          <p className="text-white/60">Discover amazing NFT-powered video content</p>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="relative h-96 md:h-[500px] lg:h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentVideo.thumbnail}
          alt={currentVideo.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-end">
        <div className="container-responsive pb-8 md:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              {/* Video Badge */}
              <div className="flex items-center space-x-2 mb-4">
                {currentVideo.isFree ? (
                  <div className="nft-badge-free">
                    <Zap className="h-3 w-3 mr-1" />
                    Free
                  </div>
                ) : currentVideo.isPremium ? (
                  <div className="nft-badge-premium">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </div>
                ) : (
                  <div className="nft-badge-rental">
                    <Clock className="h-3 w-3 mr-1" />
                    Rent
                  </div>
                )}
                
                {currentVideo.creator.isVerified && (
                  <div className="flex items-center space-x-1 bg-blue-500/20 backdrop-blur-sm text-blue-400 px-2 py-1 rounded-full text-xs">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Verified</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 line-clamp-2">
                {currentVideo.title}
              </h1>

              {/* Creator */}
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={currentVideo.creator.avatar || '/default-avatar.png'}
                  alt={currentVideo.creator.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-white/80">{currentVideo.creator.name}</span>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 mb-6 text-white/60 text-sm">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{formatNumber(currentVideo.views)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{currentVideo.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(currentVideo.durationSeconds)}</span>
                </div>
              </div>

              {/* Price */}
              {!currentVideo.isFree && (
                <div className="flex items-center space-x-2 mb-6">
                  <span className="text-2xl font-bold text-primary-400">
                    {formatPrice(currentVideo.price || 0)} AR
                  </span>
                  <span className="text-white/50">
                    (~${convertArToUsd(currentVideo.price || 0).toFixed(2)})
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleVideoClick}
                  className="btn-primary px-8 py-3 text-lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {currentVideo.isFree ? 'Watch Now' : 'Buy & Watch'}
                </motion.button>
                
                {!currentVideo.isFree && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVideoClick}
                    className="btn-outline px-6 py-3 text-lg"
                  >
                    Learn More
                  </motion.button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      {videos.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 glass-dark p-3 rounded-full text-white hover:text-primary-400 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 glass-dark p-3 rounded-full text-white hover:text-primary-400 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {videos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsAutoPlaying(false);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary-400' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;