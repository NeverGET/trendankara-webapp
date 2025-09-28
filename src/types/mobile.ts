/**
 * TypeScript interfaces for mobile API responses
 * Provides type safety for mobile app communication with radio configuration endpoints
 * Supports requirement 5.1 and 5.2 for mobile API radio configuration
 */

/**
 * Mobile radio configuration interface for API responses
 * Used by /api/mobile/v1/radio endpoint to provide current radio configuration to mobile apps
 *
 * @interface MobileRadioConfig
 * @description Provides radio streaming configuration data with connection status and testing information
 * @requirements 5.1, 5.2, 6.3, 7.1 - Mobile API radio configuration and real-time updates, player logo URL
 */
export interface MobileRadioConfig {
  /** Primary stream URL for radio broadcasting */
  stream_url: string;

  /** Optional metadata URL for stream information and current playing data */
  metadata_url: string | null;

  /** Display name of the radio station */
  station_name: string;

  /**
   * Current connection status of the stream
   * - 'active': Stream is confirmed working and available
   * - 'testing': Stream is currently being tested for connectivity
   * - 'failed': Stream connectivity test failed or stream is unavailable
   */
  connection_status: 'active' | 'testing' | 'failed';

  /**
   * ISO timestamp of when the stream was last tested for connectivity
   * Used to determine if stream status information is current
   */
  last_tested: string;

  /** Optional player logo URL for custom player branding */
  playerLogoUrl?: string;
}

/**
 * Mobile card interface for card-based content management
 * Used by mobile app to display featured and normal cards with modal support
 * Requirements: 2.1, 2.2, 2.3 - Card-based content management
 */
export interface MobileCard {
  /** Unique identifier for the card */
  id: number;

  /** Card title displayed prominently */
  title: string;

  /** Optional description shown in modal or expanded view */
  description?: string;

  /** Optional image URL (automatically converted to proxy URL) */
  imageUrl?: string;

  /** Optional URL to redirect when card is tapped (deprecated - use contact fields) */
  redirectUrl?: string;

  /** Type of redirect/contact method */
  redirectType?: 'website' | 'email' | 'phone' | 'whatsapp' | 'instagram' | 'tiktok' | 'location';

  /** Sponsor contact information */
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;

  /** Social media profiles */
  socialInstagram?: string;
  socialTiktok?: string;

  /** Location information */
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;

  /** Time limit fields */
  isTimeLimited?: boolean;
  validFrom?: string;
  validUntil?: string;

  /** Whether this card is featured (appears at top with distinct styling) */
  isFeatured: boolean;

  /** Display order within featured/normal groups */
  displayOrder: number;

  /** Whether this card is active and visible */
  isActive: boolean;

  /** ISO timestamp of creation */
  createdAt?: string;

  /** ISO timestamp of last update */
  updatedAt?: string;
}

/**
 * Input interface for creating or updating mobile cards
 * Used by admin panel for card management operations
 * Requirements: 2.1, 4.3 - Card creation and management
 */
export interface CardInput {
  title: string;
  description?: string;
  imageUrl?: string;
  redirectUrl?: string;
  isFeatured?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Mobile settings interface for app configuration
 * Controls app behavior, limits, and feature toggles
 * Requirements: 3.1, 3.2, 3.3 - Mobile app settings management
 */
export interface MobileSettings {
  /** Poll display configuration */
  showOnlyLastActivePoll: boolean;

  /** Maximum number of news items to return */
  maxNewsCount: number;

  /** Whether polls feature is enabled */
  enablePolls: boolean;

  /** Whether news feature is enabled */
  enableNews: boolean;

  /** Optional player logo URL for branding */
  playerLogoUrl?: string;

  /** Whether to show live playing info (current song/program) */
  enableLiveInfo?: boolean;

  /** Social media URLs for player */
  playerFacebookUrl?: string;
  playerInstagramUrl?: string;
  playerWhatsappNumber?: string;

  /** Live call phone number for on-air participation */
  liveCallPhoneNumber?: string;

  /** Card display mode preference */
  cardDisplayMode: 'grid' | 'list';

  /** Maximum number of featured cards to show */
  maxFeaturedCards?: number;

  /** Whether to enable card animations */
  enableCardAnimation?: boolean;

  /** Maintenance mode flag */
  maintenanceMode?: boolean;

  /** Minimum required app version */
  minimumAppVersion?: string;

  /** Whether to force app update */
  forceUpdate?: boolean;
}

/**
 * Generic mobile API response wrapper
 * Provides consistent response format with caching and pagination support
 * Requirements: 1.7 - Sub-200ms response times with caching
 */
export interface MobileApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;

  /** Response data payload */
  data: T;

  /** Optional error message for failed requests */
  error?: string;

  /** Optional pagination metadata for list responses */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev?: boolean;
  };

  /** Optional cache metadata for client-side caching */
  cache?: {
    etag: string;
    maxAge: number;
  };
}

/**
 * Mobile poll interface for active polls display
 * Used by mobile app to show current polls with voting capability
 * Requirements: 1.1, 1.2 - Mobile poll endpoints
 */
export interface MobilePoll {
  id: number;
  title: string;
  description?: string;
  pollType: 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  isActive: boolean;
  items: MobilePollItem[];
  totalVotes: number;
  userHasVoted?: boolean;
  timeRemaining?: string;
}

/**
 * Mobile poll item interface
 * Represents individual options within a poll
 * Requirements: 1.1 - Poll items with images and vote counts
 */
export interface MobilePollItem {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  voteCount: number;
  percentage?: number;
  displayOrder: number;
}

/**
 * Device information for vote tracking
 * Used to prevent duplicate voting
 * Requirements: 1.1 - Device-based vote validation
 */
export interface DeviceInfo {
  deviceId: string;
  platform?: string;
  appVersion?: string;
  userAgent?: string;
}

/**
 * Vote submission result
 * Returns updated vote counts after successful submission
 * Requirements: 1.1 - Vote submission with updated counts
 */
export interface VoteResult {
  success: boolean;
  message: string;
  updatedCounts?: {
    itemId: number;
    voteCount: number;
    percentage: number;
  }[];
}

/**
 * Mobile news item interface for list display
 * Used in paginated news feeds
 * Requirements: 1.3 - Paginated news with thumbnails
 */
export interface MobileNewsItem {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  featuredImage?: string;
  category: string;
  categoryId: number;
  isFeatured: boolean;
  isBreaking: boolean;
  isHot: boolean;
  publishedAt: string;
  views: number;
}

/**
 * Mobile news detail interface
 * Full article content with galleries
 * Requirements: 1.4 - Detailed news with image galleries
 */
export interface MobileNewsDetail extends MobileNewsItem {
  content: string;
  images?: string[];
  relatedNews?: MobileNewsItem[];
  author?: string;
  tags?: string[];
}

/**
 * Paginated response for news lists
 * Requirements: 1.3 - Infinite scroll support
 */
export interface PaginatedNews {
  items: MobileNewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Cache entry interface for memory caching
 * Used by MobileCacheManager for TTL-based caching
 * Requirements: 1.7, NFR-Performance - Caching strategy
 */
export interface CacheEntry<T> {
  data: T;
  etag: string;
  expires: number;
  created: number;
}