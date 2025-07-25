import React, { useState } from 'react';
import { Play, Star, Clock, User, Crown, Eye, Heart, Share2, Bookmark, ShoppingCart, Zap, Calendar, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Video, NFTType, NFTTier } from '../types';
import { formatDuration, formatNumber, formatPrice } from '../utils/format';
import { useWallet } from '../contexts/WalletContext';
import toast from 'react-hot-toast';

interface VideoCardProps {
  video: Video;
  size?: 'small' | 'medium' | 'large';
  showCreator?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  className?: string;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  size = 'medium', 
  showCreator = true,
  showStats = true,
  showActions = true,
  className = ''
}) => {
  const router = useRouter();
  const { isConnected, convertArToUsd } = useWallet();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Card size configurations
  const sizeConfig = {
    small: {
      container: 'w-full max-w-sm',
      image: 'aspect-video',
      title: 'text-sm',
      metadata: 'text-xs',
    },
    medium: {
      container: 'w-full',
      image: 'aspect-video',
      title: 'text-base',
      metadata: 'text-sm',
    },
    large: {
      container: 'w-full max-w-md',
      image: 'aspect-video',
      title: 'text-lg',
      metadata: 'text-base',
    },
  };

  const config = sizeConfig[size];

  const handleVideoClick = () => {
    router.push(`/video/${video.id}`);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/creator/${video.creator.id}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConnected) {
      toast.error('Please connect your wallet to like videos');
      return;
    }
    
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Like removed' : 'Video liked!');
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConnected) {
      toast.error('Please connect your wallet to bookmark videos');
      return;
    }
    
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Bookmark removed' : 'Video bookmarked!');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Check out this video by ${video.creator.name}`,
          url: `${window.location.origin}/video/${video.id}`,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/video/${video.id}`);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  const handlePurchase = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConnected) {
      toast.error('Please connect your wallet to purchase NFTs');
      return;
    }
    
    router.push(`/video/${video.id}?action=purchase`);
  };

  const renderNFTBadge = () => {
    if (video.isFree) {
      return (
        <div className="nft-badge-free">
          <Zap className="h-3 w-3 mr-1" />
          Free
        </div>
      );
    }

    if (video.isRentable) {
      return (
        <div className="nft-badge-rental">
          <Calendar className="h-3 w-3 mr-1" />
          Rent
        </div>
      );
    }

    if (video.isPremium) {
      return (
        <div className="nft-badge-premium">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </div>
      );
    }

    return null;
  };

  const renderPriceInfo = () => {
    if (video.isFree) return null;

    const displayPrice = video.price || 0;
    const usdPrice = convertArToUsd(displayPrice);

    return (
      <div className="flex items-center space-x-2 mt-2">
        {video.price && (
          <div className="flex items-center space-x-1">
            <span className="text-primary-400 font-semibold">
              {formatPrice(displayPrice)} AR
            </span>
            <span className="text-white/50 text-xs">
              (~${usdPrice.toFixed(2)})
            </span>
          </div>
        )}
        
        {video.isRentable && video.rentalPrice && (
          <div className="flex items-center space-x-1">
            <span className="text-blue-400 font-semibold">
              {formatPrice(video.rentalPrice)} AR/
            </span>
            <span className="text-white/60 text-xs">
              {video.rentalDuration}d
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderNFTInfo = () => {
    if (video.nftSupply === 0) return null;

    const soldPercentage = (video.nftsSold / video.nftSupply) * 100;
    const isNearSoldOut = soldPercentage > 80;

    return (
      <div className="flex items-center justify-between mt-2 p-2 bg-white/5 rounded-lg">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-4 w-4 text-primary-400" />
          <div>
            <span className="text-white/80 text-xs">
              {video.nftSupply - video.nftsSold} / {video.nftSupply} left
            </span>
            {isNearSoldOut && (
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp className="h-3 w-3 text-orange-400" />
                <span className="text-orange-400 text-xs font-medium">
                  Almost sold out!
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${soldPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Set fallback image if thumbnail fails to load
    e.currentTarget.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group cursor-pointer ${config.container} ${className}`}
      onClick={handleVideoClick}
    >
      {/* Video Thumbnail */}
      <div className={`relative overflow-hidden rounded-xl bg-dark-800 ${config.image} mb-3`}>
        {!imageLoaded && (
          <div className="absolute inset-0 loading-pulse" />
        )}
        
        <img
          src={video.thumbnail}
          alt={video.title}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="glass-dark rounded-full p-4"
          >
            <Play className="h-6 w-6 text-white fill-current" />
          </motion.div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          {renderNFTBadge()}
          
          {video.creator.isVerified && (
            <div className="flex items-center space-x-1 bg-blue-500/20 backdrop-blur-sm text-blue-400 px-2 py-1 rounded-full text-xs">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verified</span>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="absolute bottom-3 right-3 glass-dark text-white px-2 py-1 rounded text-xs font-medium">
          {formatDuration(video.durationSeconds)}
        </div>

        {/* Views - Show on hover */}
        <div className="absolute bottom-3 left-3 glass-dark text-white px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-1">
          <Eye className="h-3 w-3" />
          <span>{formatNumber(video.views)}</span>
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`glass-dark p-2 rounded-full ${
                isLiked ? 'text-red-400' : 'text-white hover:text-red-400'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleBookmark}
              className={`glass-dark p-2 rounded-full ${
                isBookmarked ? 'text-primary-400' : 'text-white hover:text-primary-400'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="glass-dark p-2 rounded-full text-white hover:text-primary-400"
            >
              <Share2 className="h-4 w-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="space-y-2">
        {/* Title */}
        <h3 className={`text-heading line-clamp-2 ${config.title} group-hover:text-primary-400 transition-colors`}>
          {video.title}
        </h3>
        
        {/* Creator Info */}
        {showCreator && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <img
                src={video.creator.avatar || '/default-avatar.png'}
                alt={video.creator.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <button
                onClick={handleCreatorClick}
                className="text-caption hover:text-white transition-colors truncate"
              >
                {video.creator.name}
              </button>
            </div>
            
            {video.creator.isVerified && (
              <svg className="h-4 w-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
        
        {/* Stats */}
        {showStats && (
          <div className="flex items-center justify-between text-caption">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{formatNumber(video.views)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{video.rating.toFixed(1)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(video.durationSeconds)}</span>
              </div>
            </div>
            
            <div className="text-xs text-white/40">
              {new Date(video.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Price Info */}
        {renderPriceInfo()}

        {/* NFT Info */}
        {renderNFTInfo()}

        {/* Purchase Button */}
        {!video.isFree && video.nftSupply > video.nftsSold && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePurchase}
            className="w-full btn-primary mt-3 text-sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {video.isRentable ? 'Rent Now' : 'Buy NFT'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default VideoCard;