import { NextRequest, NextResponse } from 'next/server';
import {
  getAllNews,
  type PaginationOptions,
  type NewsFilters
} from '@/lib/db/news';
import { fixMediaUrlsInObject } from '@/lib/utils/url-fixer';

/**
 * GET /api/news
 * Public endpoint to fetch news articles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const pagination: PaginationOptions = {
      offset: Math.max(0, offset),
      limit: Math.min(50, Math.max(1, limit)) // Max 50 for public API
    };

    // Parse filtering parameters (public filters only)
    const filters: NewsFilters = {
      is_active: true // Always filter for active news only
    };

    // Category filter
    const category = searchParams.get('category');
    if (category) {
      // Map category names to IDs
      const categoryMap: Record<string, number> = {
        'MAGAZINE': 1,
        'ARTIST': 2,
        'ALBUM': 3,
        'CONCERT': 4
      };
      if (categoryMap[category]) {
        filters.category_id = categoryMap[category];
      }
    }

    // Category ID filter (if provided directly)
    const categoryId = searchParams.get('category_id');
    if (categoryId && !isNaN(parseInt(categoryId))) {
      filters.category_id = parseInt(categoryId);
    }

    // Featured filter
    const featured = searchParams.get('featured');
    if (featured === 'true') {
      filters.is_featured = true;
    }

    // Breaking news filter
    const breaking = searchParams.get('breaking');
    if (breaking === 'true') {
      filters.is_breaking = true;
    }

    // Hot news filter
    const hot = searchParams.get('hot');
    if (hot === 'true') {
      filters.is_hot = true;
    }

    // Search query
    const search = searchParams.get('search');
    if (search && search.trim()) {
      filters.search = search.trim();
    }

    // Get news with pagination and filtering
    const result = await getAllNews(pagination, filters);

    // Transform data for public consumption (remove sensitive fields)
    const publicData = result.data.map(article => fixMediaUrlsInObject({
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      content: article.content,
      featured_image: article.featured_image,
      thumbnail: article.featured_image, // For compatibility
      category_id: article.category_id,
      category_name: article.category_name,
      category: article.category_name || getCategoryName(article.category_id),
      is_featured: Boolean(article.is_featured),
      is_breaking: Boolean(article.is_breaking),
      is_hot: Boolean(article.is_hot),
      published_at: article.published_at || article.created_at,
      created_at: article.created_at,
      updated_at: article.updated_at,
      views: article.views || 0,
      author: article.creator_name ? {
        id: article.created_by,
        name: article.creator_name
      } : undefined
    }));

    return NextResponse.json({
      success: true,
      data: publicData,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    });

  } catch (error) {
    console.error('Error in public news API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news',
        data: []
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get category name from ID
 */
function getCategoryName(categoryId: number): string {
  const categoryMap: Record<number, string> = {
    1: 'MAGAZINE',
    2: 'ARTIST',
    3: 'ALBUM',
    4: 'CONCERT'
  };
  return categoryMap[categoryId] || 'MAGAZINE';
}