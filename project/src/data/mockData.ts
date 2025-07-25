export interface Video {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorAddress: string;
  thumbnail: string;
  duration: string;
  views: number;
  likes: number;
  price: number;
  rentPrice: number;
  rentDuration: number;
  isFree: boolean;
  tags: string[];
  genre?: string; // Video genre
  createdAt: string;
  arweaveId: string;
  videoUrl?: string; // Add optional videoUrl property for compatibility
  livepeerAssetId?: string; // Livepeer asset ID
  livepeerPlaybackId?: string; // Livepeer playback ID
  hlsUrl?: string; // HLS streaming URL
  mp4Url?: string; // MP4 URL
  nftTokenId?: string;
}

export interface Creator {
  id: string;
  name: string;
  address: string;
  avatar: string;
  bio: string;
  followers: number;
  videos: number;
  totalEarnings: number;
  verified: boolean;
}

export interface NFT {
  id: string;
  type: 'creator' | 'access';
  videoId: string;
  owner: string;
  price: number;
  expiresAt?: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
  };
}

// Mock Videos
export const mockVideos: Video[] = [
  {
    id: '1',
    title: 'Building the Future of Web3',
    description: 'A comprehensive guide to building decentralized applications with modern tools and frameworks.',
    creator: 'CryptoDev',
    creatorAddress: '0x1234...5678',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop',
    duration: '15:30',
    views: 12450,
    likes: 892,
    price: 2.99,
    rentPrice: 0.99,
    rentDuration: 7,
    isFree: false,
    tags: ['Web3', 'Development', 'Blockchain'],
    createdAt: '2024-01-15',
    arweaveId: 'abc123...',
    nftTokenId: 'creator-1'
  },
  {
    id: '2',
    title: 'NFT Art Creation Masterclass',
    description: 'Learn how to create stunning NFT artwork using digital tools and blockchain technology.',
    creator: 'DigitalArtist',
    creatorAddress: '0x8765...4321',
    thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=225&fit=crop',
    duration: '22:15',
    views: 8930,
    likes: 567,
    price: 4.99,
    rentPrice: 1.99,
    rentDuration: 14,
    isFree: false,
    tags: ['NFT', 'Art', 'Digital'],
    createdAt: '2024-01-10',
    arweaveId: 'def456...',
    nftTokenId: 'creator-2'
  },
  {
    id: '3',
    title: 'Introduction to Arweave',
    description: 'Understanding permanent data storage on the blockchain with Arweave.',
    creator: 'BlockchainGuru',
    creatorAddress: '0x9999...8888',
    thumbnail: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=225&fit=crop',
    duration: '12:45',
    views: 15670,
    likes: 1203,
    price: 0,
    rentPrice: 0,
    rentDuration: 0,
    isFree: true,
    tags: ['Arweave', 'Blockchain', 'Storage'],
    createdAt: '2024-01-05',
    arweaveId: 'ghi789...'
  },
  {
    id: '4',
    title: 'DeFi Strategies for 2024',
    description: 'Advanced DeFi strategies and yield farming techniques for the current market.',
    creator: 'DeFiMaster',
    creatorAddress: '0x5555...6666',
    thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=225&fit=crop',
    duration: '28:20',
    views: 9870,
    likes: 745,
    price: 3.99,
    rentPrice: 1.49,
    rentDuration: 10,
    isFree: false,
    tags: ['DeFi', 'Finance', 'Crypto'],
    createdAt: '2024-01-12',
    arweaveId: 'jkl012...',
    nftTokenId: 'creator-4'
  },
  {
    id: '5',
    title: 'Smart Contract Security',
    description: 'Best practices for writing secure smart contracts and avoiding common vulnerabilities.',
    creator: 'SecurityExpert',
    creatorAddress: '0x7777...8888',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
    duration: '19:30',
    views: 11230,
    likes: 923,
    price: 5.99,
    rentPrice: 2.49,
    rentDuration: 21,
    isFree: false,
    tags: ['Security', 'Smart Contracts', 'Auditing'],
    createdAt: '2024-01-08',
    arweaveId: 'mno345...',
    nftTokenId: 'creator-5'
  },
  {
    id: '6',
    title: 'The Future of DAOs',
    description: 'Exploring decentralized autonomous organizations and their impact on governance.',
    creator: 'DAOVisionary',
    creatorAddress: '0xaaaa...bbbb',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop',
    duration: '16:45',
    views: 7650,
    likes: 456,
    price: 0,
    rentPrice: 0,
    rentDuration: 0,
    isFree: true,
    tags: ['DAO', 'Governance', 'Decentralization'],
    createdAt: '2024-01-03',
    arweaveId: 'pqr678...'
  }
];

// Mock Creators
export const mockCreators: Creator[] = [
  {
    id: '1',
    name: 'CryptoDev',
    address: '0x1234...5678',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    bio: 'Full-stack developer passionate about Web3 and blockchain technology.',
    followers: 15420,
    videos: 23,
    totalEarnings: 12450.75,
    verified: true
  },
  {
    id: '2',
    name: 'DigitalArtist',
    address: '0x8765...4321',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    bio: 'Digital artist creating unique NFT collections and digital art.',
    followers: 8920,
    videos: 15,
    totalEarnings: 8760.50,
    verified: true
  },
  {
    id: '3',
    name: 'BlockchainGuru',
    address: '0x9999...8888',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    bio: 'Blockchain educator and researcher sharing knowledge about decentralized technologies.',
    followers: 23450,
    videos: 42,
    totalEarnings: 18920.25,
    verified: true
  }
];

// Mock NFTs
export const mockNFTs: NFT[] = [
  {
    id: 'nft-1',
    type: 'creator',
    videoId: '1',
    owner: '0x1234...5678',
    price: 2.99,
    metadata: {
      name: 'Creator Rights - Building the Future of Web3',
      description: 'Distribution rights for the video "Building the Future of Web3"',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop',
      attributes: [
        { trait_type: 'Content Type', value: 'Video' },
        { trait_type: 'Rights Type', value: 'Distribution' },
        { trait_type: 'Royalty Rate', value: '10%' }
      ]
    }
  },
  {
    id: 'nft-2',
    type: 'access',
    videoId: '2',
    owner: '0x8765...4321',
    price: 4.99,
    expiresAt: '2024-02-15',
    metadata: {
      name: 'Access Pass - NFT Art Creation Masterclass',
      description: 'Time-limited viewing rights for NFT Art Creation Masterclass',
      image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=225&fit=crop',
      attributes: [
        { trait_type: 'Access Type', value: 'Time-Limited' },
        { trait_type: 'Duration', value: '14 days' },
        { trait_type: 'Tier', value: 'Basic' }
      ]
    }
  }
];

// Mock user data
export const mockUser = {
  id: 'user-1',
  address: '0x1234...5678',
  name: 'CryptoDev',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  balance: 1250.75,
  ownedNFTs: ['nft-1'],
  watchHistory: ['1', '3', '6'],
  favorites: ['2', '4']
};