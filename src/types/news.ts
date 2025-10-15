export type NewsCategory = 'MAGAZINE' | 'ARTIST' | 'ALBUM' | 'CONCERT' | string;

export interface MediaFile {
  id: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnail: MediaFile | string;
  featured_image?: string; // For backward compatibility with database
  images?: MediaFile[];
  category: NewsCategory;
  tags?: string[];
  isHot: boolean;
  isBreaking: boolean;
  isFeatured?: boolean;
  is_featured?: boolean; // Database compatibility
  is_breaking?: boolean; // Database compatibility
  is_hot?: boolean; // Database compatibility
  is_active?: boolean; // Database compatibility
  publishedAt: Date | string;
  author?: {
    id: number;
    name: string;
  };
  viewCount: number;
}

export interface NewsListResponse {
  articles: NewsArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export interface NewsCardProps {
  id: number;
  title: string;
  slug: string;
  summary: string;
  thumbnail: string;
  category: NewsCategory;
  isHot?: boolean;
  isBreaking?: boolean;
  publishedAt: Date | string;
  onClick?: (id: number) => void;
}