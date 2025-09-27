/**
 * Mobile News Service
 * Provides paginated news with mobile-optimized formatting
 * Requirements: 1.3, 1.4, 3.3 - Mobile news endpoints with settings support
 */

import type {
  MobileNewsItem,
  MobileNewsDetail,
  MobileSettings,
  PaginatedNews
} from '@/types/mobile';
import {
  getAllNews,
  getNewsBySlug,
  incrementNewsViews,
  type PaginationOptions,
  type NewsFilters
} from '@/lib/db/news';
import { db } from '@/lib/db/client';
import { fixMediaUrlsInObject } from '@/lib/utils/url-fixer';

export class NewsService {
  /**
   * Get paginated news list with mobile settings applied
   * Applies maxNewsCount limit from settings
   *
   * @param page Page number (1-based)
   * @param limit Items per page
   * @param settings Mobile app settings
   * @param categoryId Optional category filter
   * @returns Paginated news response
   */
  async getNewsList(
    page: number = 1,
    limit: number = 10,
    settings: MobileSettings,
    categoryId?: number
  ): Promise<PaginatedNews> {
    try {
      // Check if news is enabled
      if (!settings.enableNews) {
        return {
          items: [],
          pagination: {
            page: 1,
            limit: 0,
            total: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      }

      // Apply maxNewsCount setting to limit
      const effectiveLimit = Math.min(limit, settings.maxNewsCount || 50);
      const offset = (page - 1) * effectiveLimit;

      // Prepare pagination options
      const pagination: PaginationOptions = {
        offset: Math.max(0, offset),
        limit: effectiveLimit
      };

      // Prepare filters - always show only active news
      const filters: NewsFilters = {
        is_active: true
      };

      // Add category filter if provided
      if (categoryId) {
        filters.category_id = categoryId;
      }

      // Get news from database
      const result = await getAllNews(pagination, filters);

      // Check if we've reached the max news count
      const totalAvailable = Math.min(result.total, settings.maxNewsCount || 50);
      const currentPosition = offset + result.items.length;

      // Transform news items to mobile format
      const items: MobileNewsItem[] = result.items.map((news: any) =>
        this.transformToMobileNewsItem(news)
      );

      return {
        items,
        pagination: {
          page,
          limit: effectiveLimit,
          total: totalAvailable,
          hasNext: currentPosition < totalAvailable,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting news list:', error);
      throw new Error('Failed to retrieve news list');
    }
  }

  /**
   * Get detailed news article by slug
   * Includes full content and image galleries
   *
   * @param slug News article slug
   * @returns Detailed news article or null
   */
  async getNewsDetail(slug: string): Promise<MobileNewsDetail | null> {
    try {
      // Get news by slug
      const news = await getNewsBySlug(slug);

      if (!news || !news.is_active) {
        return null;
      }

      // Increment view count
      try {
        await incrementNewsViews(news.id);
      } catch (error) {
        console.error('Error incrementing news views:', error);
        // Continue even if view increment fails
      }

      // Transform to mobile detail format
      return this.transformToMobileNewsDetail(news);
    } catch (error) {
      console.error('Error getting news detail:', error);
      throw new Error('Failed to retrieve news detail');
    }
  }

  /**
   * Get featured news for mobile homepage
   * Returns only featured, active news items
   *
   * @param limit Maximum number of featured items
   * @returns Array of featured news items
   */
  async getFeaturedNews(limit: number = 5): Promise<MobileNewsItem[]> {
    try {
      const filters: NewsFilters = {
        is_active: true,
        is_featured: true
      };

      const pagination: PaginationOptions = {
        offset: 0,
        limit
      };

      const result = await getAllNews(pagination, filters);

      return result.items.map((news: any) =>
        this.transformToMobileNewsItem(news)
      );
    } catch (error) {
      console.error('Error getting featured news:', error);
      return [];
    }
  }

  /**
   * Get breaking news for mobile notifications
   * Returns only breaking, active news items
   *
   * @param limit Maximum number of breaking news items
   * @returns Array of breaking news items
   */
  async getBreakingNews(limit: number = 3): Promise<MobileNewsItem[]> {
    try {
      const filters: NewsFilters = {
        is_active: true,
        is_breaking: true
      };

      const pagination: PaginationOptions = {
        offset: 0,
        limit
      };

      const result = await getAllNews(pagination, filters);

      return result.items.map((news: any) =>
        this.transformToMobileNewsItem(news)
      );
    } catch (error) {
      console.error('Error getting breaking news:', error);
      return [];
    }
  }

  /**
   * Transform database news to mobile item format
   * Applies URL fixing and field mapping
   *
   * @param news Database news object
   * @returns Mobile news item
   */
  private transformToMobileNewsItem(news: any): MobileNewsItem {
    return fixMediaUrlsInObject({
      id: news.id,
      title: news.title,
      slug: news.slug,
      summary: news.summary,
      featuredImage: news.featured_image,
      category: news.category_name || 'Genel',
      categoryId: news.category_id || 0,
      isFeatured: Boolean(news.is_featured),
      isBreaking: Boolean(news.is_breaking),
      isHot: Boolean(news.is_hot),
      publishedAt: news.published_at || news.created_at,
      views: news.views || 0
    });
  }

  /**
   * Transform database news to mobile detail format
   * Includes full content and additional fields
   *
   * @param news Database news object
   * @returns Mobile news detail
   */
  private transformToMobileNewsDetail(news: any): MobileNewsDetail {
    // Get base item data
    const baseItem = this.transformToMobileNewsItem(news);

    // Parse images from news_images relation or content
    let images: string[] = [];
    if (news.news_images && Array.isArray(news.news_images)) {
      images = news.news_images
        .filter((img: any) => img.image_url)
        .map((img: any) => img.image_url);
    }

    // Extract images from content if needed
    if (news.content) {
      const contentImages = this.extractImagesFromContent(news.content);
      images = [...new Set([...images, ...contentImages])]; // Combine and deduplicate
    }

    // Fix all image URLs
    images = images.map(url => {
      const fixed = fixMediaUrlsInObject({ url });
      return fixed.url;
    });

    // Get related news (placeholder - implement if needed)
    const relatedNews: MobileNewsItem[] = [];

    // Parse tags from content or metadata
    const tags = this.extractTagsFromNews(news);

    return fixMediaUrlsInObject({
      ...baseItem,
      content: news.content || '',
      images: images.length > 0 ? images : undefined,
      relatedNews: relatedNews.length > 0 ? relatedNews : undefined,
      author: news.author || news.created_by_name || 'Editör',
      tags: tags.length > 0 ? tags : undefined
    });
  }

  /**
   * Extract image URLs from HTML content
   *
   * @param content HTML content
   * @returns Array of image URLs
   */
  private extractImagesFromContent(content: string): string[] {
    const images: string[] = [];
    const imgRegex = /<img[^>]+src="([^">]+)"/gi;
    let match;

    while ((match = imgRegex.exec(content)) !== null) {
      images.push(match[1]);
    }

    return images;
  }

  /**
   * Extract tags from news metadata or content
   *
   * @param news News object
   * @returns Array of tags
   */
  private extractTagsFromNews(news: any): string[] {
    const tags: string[] = [];

    // Add category as a tag
    if (news.category_name) {
      tags.push(news.category_name);
    }

    // Add special status as tags
    if (news.is_featured) tags.push('Öne Çıkan');
    if (news.is_breaking) tags.push('Son Dakika');
    if (news.is_hot) tags.push('Gündem');

    return tags;
  }

  /**
   * Search news by query
   * Searches in title and content
   *
   * @param query Search query
   * @param limit Maximum results
   * @returns Array of matching news items
   */
  async searchNews(query: string, limit: number = 20): Promise<MobileNewsItem[]> {
    try {
      const filters: NewsFilters = {
        is_active: true,
        search: query
      };

      const pagination: PaginationOptions = {
        offset: 0,
        limit
      };

      const result = await getAllNews(pagination, filters);

      return result.items.map((news: any) =>
        this.transformToMobileNewsItem(news)
      );
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
  }
}

// Export singleton instance
const newsService = new NewsService();
export default newsService;