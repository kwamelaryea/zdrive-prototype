// Base types
export interface User {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatar?: string;
  email?: string;
  walletAddress?: string;
  joinDate: string;
  location?: string;
  website?: string;
  socialLinks?: SocialLink[];
  followers: number;
  following: number;
  totalViews: number;
  nftCount: number;
  isVerified: boolean;
  isCreator: boolean;
  tier: UserTier;
  preferences: UserPreferences;
}

export interface Creator extends User {
  slug: string;
  coverImage?: string;
  monthlyEarnings: number;
  totalEarnings: number;
  subscriberCount: number;
  createdVideos: number;
  nftsSold: number;
  averageRating: number;
  badges: CreatorBadge[];
  analytics: CreatorAnalytics;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl?: string;
  arweaveId?: string;
  creator: Creator;
  creatorId: string;
  duration: string;
  durationSeconds: number;
  rating: number;
  genre: string;
  tags: string[];
  price?: number;
  rentalPrice?: number;
  rentalDuration?: number; // in days
  isPremium: boolean;
  isFree: boolean;
  isRentable: boolean;
  nftSupply: number;
  nftsSold: number;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
  status: VideoStatus;
  visibility: VideoVisibility;
  monetization: VideoMonetization;
  blockchain: BlockchainData;
  analytics: VideoAnalytics;
  metadata: VideoMetadata;
  // Livepeer streaming metadata
  livepeerAssetId?: string;
  livepeerPlaybackId?: string;
  hlsUrl?: string;
  mp4Url?: string;
}

export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  videoId: string;
  video: Video;
  owner: User;
  creator: Creator;
  type: NFTType;
  tier: NFTTier;
  name: string;
  description: string;
  image: string;
  attributes: NFTAttribute[];
  price: number;
  currency: string;
  supply: number;
  remaining: number;
  isForSale: boolean;
  salePrice?: number;
  royaltyPercentage: number;
  createdAt: string;
  expiresAt?: string; // for rental NFTs
  blockchain: BlockchainData;
  history: NFTTransaction[];
}

export interface NFTTransaction {
  id: string;
  nftId: string;
  type: TransactionType;
  from: string;
  to: string;
  price: number;
  currency: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  status: TransactionStatus;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  user: User;
  content: string;
  likes: number;
  dislikes: number;
  replies: Comment[];
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isPinned: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  userId: string;
  user: User;
  videos: Video[];
  videoCount: number;
  visibility: PlaylistVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporter: User;
  reportedType: ReportType;
  reportedId: string;
  category: ReportCategory;
  reason: string;
  description?: string;
  evidence?: string[];
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
  createdAt: string;
}

export interface Analytics {
  id: string;
  userId?: string;
  videoId?: string;
  date: string;
  views: number;
  uniqueViews: number;
  watchTime: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  earnings: number;
  nftSales: number;
  conversionRate: number;
  demographics: AnalyticsDemographics;
  sources: AnalyticsSource[];
  devices: AnalyticsDevice[];
}

export interface Subscription {
  id: string;
  subscriberId: string;
  subscriber: User;
  creatorId: string;
  creator: Creator;
  tier: SubscriptionTier;
  price: number;
  currency: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  cancelledAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface WalletConnection {
  address: string;
  balance: number;
  currency: string;
  provider: WalletProvider;
  isConnected: boolean;
  network: string;
  tokens: Token[];
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  price: number;
  value: number;
}

// Enums and utility types
export enum VideoStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  PRIVATE = 'private',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum VideoVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  PREMIUM = 'premium',
}

export enum NFTType {
  OWNERSHIP = 'ownership',
  ACCESS = 'access',
  RENTAL = 'rental',
  COLLECTIBLE = 'collectible',
}

export enum NFTTier {
  BASIC = 'basic',
  PREMIUM = 'premium',
  EXCLUSIVE = 'exclusive',
  LEGENDARY = 'legendary',
}

export enum TransactionType {
  MINT = 'mint',
  BUY = 'buy',
  SELL = 'sell',
  TRANSFER = 'transfer',
  RENT = 'rent',
  RETURN = 'return',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum UserTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  CREATOR = 'creator',
  ADMIN = 'admin',
}

export enum PlaylistVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
}

export enum ReportType {
  VIDEO = 'video',
  USER = 'user',
  COMMENT = 'comment',
  NFT = 'nft',
}

export enum ReportCategory {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  COPYRIGHT = 'copyright',
  FRAUD = 'fraud',
  VIOLENCE = 'violence',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum SubscriptionTier {
  BASIC = 'basic',
  PREMIUM = 'premium',
  VIP = 'vip',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PAST_DUE = 'past_due',
}

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  NFT_SALE = 'nft_sale',
  NFT_PURCHASE = 'nft_purchase',
  VIDEO_UPLOAD = 'video_upload',
  SYSTEM = 'system',
}

export enum WalletProvider {
  ARCONNECT = 'arconnect',
  WANDER = 'wander',
  METAMASK = 'metamask',
  PHANTOM = 'phantom',
}

// Complex types
export interface SocialLink {
  platform: string;
  url: string;
  verified: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    likes: boolean;
    comments: boolean;
    follows: boolean;
    nftSales: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showWallet: boolean;
    showEarnings: boolean;
  };
}

export interface CreatorBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
}

export interface CreatorAnalytics {
  totalViews: number;
  totalEarnings: number;
  subscriberGrowth: number;
  engagementRate: number;
  topVideos: Video[];
  revenueByMonth: { month: string; revenue: number }[];
  audienceInsights: {
    topCountries: { country: string; percentage: number }[];
    ageGroups: { group: string; percentage: number }[];
    platforms: { platform: string; percentage: number }[];
  };
}

export interface VideoMonetization {
  enabled: boolean;
  type: 'free' | 'premium' | 'rental' | 'nft';
  price: number;
  currency: string;
  nftConfig?: {
    supply: number;
    royaltyPercentage: number;
    attributes: NFTAttribute[];
  };
}

export interface BlockchainData {
  network: string;
  contractAddress?: string;
  tokenId?: string;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  gasPrice?: number;
  confirmed: boolean;
}

export interface VideoAnalytics {
  views: number;
  uniqueViews: number;
  watchTime: number;
  averageWatchTime: number;
  completionRate: number;
  engagement: number;
  retention: { time: number; percentage: number }[];
  revenue: number;
  nftSales: number;
}

export interface VideoMetadata {
  resolution: string;
  bitrate: number;
  fps: number;
  codec: string;
  size: number;
  aspectRatio: string;
  hasSubtitles: boolean;
  languages: string[];
  chapters?: { title: string; time: number }[];
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
  max_value?: number;
}

export interface AnalyticsDemographics {
  countries: { country: string; percentage: number }[];
  ages: { range: string; percentage: number }[];
  genders: { gender: string; percentage: number }[];
}

export interface AnalyticsSource {
  source: string;
  views: number;
  percentage: number;
}

export interface AnalyticsDevice {
  device: string;
  views: number;
  percentage: number;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Form types
export interface VideoUploadForm {
  title: string;
  description: string;
  thumbnail: File | string;
  video: File | string;
  genre: string;
  tags: string[];
  visibility: VideoVisibility;
  monetization: VideoMonetization;
  nftConfig?: {
    supply: number;
    price: number;
    royaltyPercentage: number;
    attributes: NFTAttribute[];
  };
}

export interface ProfileUpdateForm {
  name: string;
  bio: string;
  avatar?: File | string;
  coverImage?: File | string;
  location?: string;
  website?: string;
  socialLinks: SocialLink[];
}

export interface ReportForm {
  category: ReportCategory;
  reason: string;
  description?: string;
  evidence?: File[];
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  genre?: string;
  duration?: string;
  price?: string;
  rating?: number;
  creator?: string;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'rating' | 'price';
  type?: 'all' | 'free' | 'premium' | 'nft';
}

export interface VideoFilters extends SearchFilters {
  hasNFT?: boolean;
  isRentable?: boolean;
}

export interface CreatorFilters {
  query?: string;
  verified?: boolean;
  minFollowers?: number;
  sortBy?: 'newest' | 'popular' | 'earnings';
}

export interface NFTFilters {
  query?: string;
  type?: NFTType;
  tier?: NFTTier;
  minPrice?: number;
  maxPrice?: number;
  creator?: string;
  sortBy?: 'newest' | 'price_low' | 'price_high' | 'popular';
}