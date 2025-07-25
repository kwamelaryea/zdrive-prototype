import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '../contexts/WalletContext';
import { useVideos } from '../contexts/VideoContext';
import { mockUser, mockNFTs, mockVideos } from '../data/mockData';
import { formatNumber, formatAddress } from '../utils/format';
import { AOService, AO_PROCESSES } from '../services/aoService';

const Profile: React.FC = () => {
  const { isConnected, walletAddress } = useWallet();
  const { userVideos } = useVideos();
  const [nftBalance, setNftBalance] = useState<number>(0);
  const [creatorNFTs, setCreatorNFTs] = useState<any[]>([]);
  const [processStatus, setProcessStatus] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get user's owned NFTs
  const userNFTs = mockNFTs.filter(nft => nft.owner === mockUser.address);
  
  // Get user's watch history videos
  const watchHistory = mockVideos.filter(video => mockUser.watchHistory.includes(video.id));

  // Load actual NFT data from AO blockchain
  useEffect(() => {
    const loadNFTData = async () => {
      if (!isConnected || !walletAddress) return;
      
      setIsLoading(true);
      try {
        const [balance, nfts, processDeployment] = await Promise.all([
          AOService.getUserNFTBalance(walletAddress),
          AOService.getUserCreatorNFTs(walletAddress),
          AOService.checkAllProcessesDeployment()
        ]);
        
        setNftBalance(balance);
        setCreatorNFTs(nfts);
        setProcessStatus(processDeployment);
      } catch (error) {
        console.error('Failed to load NFT data:', error);
        // Still try to get process status
        try {
          const processDeployment = await AOService.checkAllProcessesDeployment();
          setProcessStatus(processDeployment);
        } catch (statusError) {
          console.error('Failed to check process status:', statusError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadNFTData();
  }, [isConnected, walletAddress]);
  
  // Get user's favorite videos
  const favorites = mockVideos.filter(video => mockUser.favorites.includes(video.id));

  if (!isConnected) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-white/60 mb-6">
            Connect your wallet to view your profile and manage your NFTs
          </p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive py-8">
      {/* Profile Header */}
      <div className="card-hover p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <img 
            src={mockUser.avatar} 
            alt={mockUser.name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{mockUser.name}</h1>
            <p className="text-white/60 mb-2">{formatAddress(walletAddress || '')}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-white/60">💰 {formatNumber(mockUser.balance)} AR</span>
              <span className="text-white/60">🎬 {watchHistory.length} watched</span>
              <span className="text-white/60">❤️ {favorites.length} favorites</span>
              <span className="text-white/60">🖼️ {userNFTs.length} NFTs</span>
            </div>
          </div>
          <button className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">{userNFTs.length}</div>
          <div className="text-white/60 text-sm">Owned NFTs</div>
        </div>
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">{watchHistory.length}</div>
          <div className="text-white/60 text-sm">Watched</div>
        </div>
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">{favorites.length}</div>
          <div className="text-white/60 text-sm">Favorites</div>
        </div>
        <div className="card-hover p-4 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1">{formatNumber(mockUser.balance)}</div>
          <div className="text-white/60 text-sm">Balance (AR)</div>
        </div>
      </div>

      {/* NFT Debug Section */}
      {isConnected && (
        <div className="mb-8">
          <div className="card-hover p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🔍 AO Process Deployment Status</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">AO Creator NFT Balance:</span>
                <span className="text-white">{isLoading ? 'Loading...' : nftBalance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">On-Chain Creator NFTs:</span>
                <span className="text-white">{isLoading ? 'Loading...' : creatorNFTs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Local Videos:</span>
                <span className="text-white">{userVideos.length}</span>
              </div>
              
              <hr className="border-white/20 my-3" />
              <div className="text-white/80 font-medium mb-2">Process Deployment Status:</div>
              
              {Object.entries(AO_PROCESSES).map(([name, processId]) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-white/60">{name}:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      processStatus[name] ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                    }`}>
                      {isLoading ? 'Checking...' : (processStatus[name] ? '✅ Deployed' : '❌ Not Found')}
                    </span>
                  </div>
                </div>
              ))}
              
              <hr className="border-white/20 my-3" />
              <div className="flex justify-between">
                <span className="text-white/60">Wallet Address:</span>
                <span className="text-white text-xs break-all">{walletAddress || 'Not connected'}</span>
              </div>
              
              {Object.values(processStatus).some(status => !status) && (
                <div className="mt-3 p-3 bg-red-600/10 border border-red-600/20 rounded-lg">
                  <p className="text-red-400 text-xs font-medium mb-1">⚠️ Deployment Required</p>
                  <p className="text-red-300/80 text-xs">
                    Some AO processes are not deployed. Run the deployment script to create real NFTs.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Owned NFTs */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">🖼️ My NFTs</h2>
        {userNFTs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userNFTs.map((nft) => (
              <div key={nft.id} className="card-hover p-4">
                <img 
                  src={nft.metadata.image} 
                  alt={nft.metadata.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h3 className="text-white font-semibold text-sm mb-1">{nft.metadata.name}</h3>
                <p className="text-white/60 text-xs mb-2">{nft.metadata.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Type: {nft.type}</span>
                  <span className="text-blue-400">${nft.price}</span>
                </div>
                {nft.expiresAt && (
                  <div className="text-xs text-orange-400 mt-1">
                    Expires: {new Date(nft.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card-hover p-8 text-center">
            <div className="text-4xl mb-4">🖼️</div>
            <h3 className="text-lg font-semibold text-white mb-2">No NFTs Yet</h3>
            <p className="text-white/60 mb-4">Purchase videos to start your NFT collection</p>
            <Link 
              href="/search"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Videos
            </Link>
          </div>
        )}
      </div>

      {/* Watch History */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">👁️ Watch History</h2>
        {watchHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {watchHistory.map((video) => (
              <Link key={video.id} href={`/video/${video.id}`} className="group block">
                <div className="card-hover overflow-hidden rounded-lg">
                  <div className="relative aspect-video">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-white/60 text-xs">
                      {video.creator || 'Unknown Creator'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card-hover p-8 text-center">
            <div className="text-4xl mb-4">👁️</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Watch History</h3>
            <p className="text-white/60 mb-4">Start watching videos to build your history</p>
            <Link 
              href="/search"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Discover Videos
            </Link>
          </div>
        )}
      </div>

      {/* Favorites */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">❤️ Favorites</h2>
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map((video) => (
              <Link key={video.id} href={`/video/${video.id}`} className="group block">
                <div className="card-hover overflow-hidden rounded-lg">
                  <div className="relative aspect-video">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                      ❤️
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-white/60 text-xs">
                      {video.creator || 'Unknown Creator'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card-hover p-8 text-center">
            <div className="text-4xl mb-4">❤️</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Favorites</h3>
            <p className="text-white/60 mb-4">Like videos to add them to your favorites</p>
            <Link 
              href="/search"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Find Videos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;