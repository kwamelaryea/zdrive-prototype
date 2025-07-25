import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useVideos } from '../contexts/VideoContext';
import { formatNumber } from '../utils/format';

const Search: React.FC = () => {
  const router = useRouter();
  const { videos } = useVideos();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [filteredVideos, setFilteredVideos] = useState(videos);

  // Update filteredVideos when videos context changes
  useEffect(() => {
    setFilteredVideos(videos);
  }, [videos]);

  // Get search query from URL state
  useEffect(() => {
    const { q } = router.query;
    if (q) {
      setSearchQuery(q as string);
    }
  }, [router.query]);

  // Filter videos based on search query and filter
  useEffect(() => {
    let filtered = videos;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply type filter
    switch (filter) {
      case 'free':
        filtered = filtered.filter(video => video.isFree);
        break;
      case 'paid':
        filtered = filtered.filter(video => !video.isFree);
        break;
      case 'nft':
        filtered = filtered.filter(video => video.nftTokenId);
        break;
      default:
        break;
    }

    setFilteredVideos(filtered);
  }, [searchQuery, filter]);

  return (
    <div className="container-responsive py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Discover Content</h1>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search videos, creators, NFTs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40">
            🔍
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'All', count: videos.length },
            { key: 'free', label: 'Free', count: videos.filter(v => v.isFree).length },
            { key: 'paid', label: 'Paid', count: videos.filter(v => !v.isFree).length },
            { key: 'nft', label: 'NFT', count: videos.filter(v => v.nftTokenId).length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-white/60 text-sm">
          {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found
          {searchQuery && ` for "${searchQuery}"`}
        </div>
      </div>

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                  {/* NFT Badge */}
                  {video.nftTokenId && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded font-semibold">
                      NFT
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

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {video.tags.slice(0, 2).map((tag) => (
                      <span 
                        key={tag}
                        className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {video.tags.length > 2 && (
                      <span className="text-xs text-white/40">
                        +{video.tags.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No videos found</h3>
          <p className="text-white/60">
            {searchQuery 
              ? `No videos match "${searchQuery}"`
              : 'Try adjusting your search or filters'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;