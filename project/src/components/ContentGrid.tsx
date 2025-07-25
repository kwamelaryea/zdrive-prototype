import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';
import VideoCard from './VideoCard';
import { Video } from '../types';

interface ContentGridProps {
  title: string;
  videos: Video[];
  showViewAll?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  maxItems?: number;
  className?: string;
}

const ContentGrid: React.FC<ContentGridProps> = ({
  title,
  videos,
  showViewAll = false,
  icon: Icon,
  maxItems = 8,
  className = ''
}) => {
  const router = useRouter();
  const displayVideos = videos.slice(0, maxItems);

  const handleViewAll = () => {
    // Navigate to search page with filters
    router.push(`/search?q=${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}&type=all`);
  };

  if (displayVideos.length === 0) {
    return null;
  }

  return (
    <div className={`py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {Icon && <Icon className="h-6 w-6 text-primary-400" />}
          <h2 className="text-responsive-lg font-bold text-white">{title}</h2>
        </div>
        
        {showViewAll && (
          <button
            onClick={handleViewAll}
            className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
          >
            <span className="text-sm">View All</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {displayVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <VideoCard
              video={video}
              size="medium"
              showCreator={true}
              showStats={true}
              showActions={true}
            />
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {displayVideos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-white/40 text-lg">No videos found</div>
          <p className="text-white/20 text-sm mt-2">Check back later for new content</p>
        </div>
      )}
    </div>
  );
};

export default ContentGrid;