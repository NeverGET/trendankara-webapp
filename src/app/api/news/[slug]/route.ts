import { NextRequest, NextResponse } from 'next/server';
import { getNewsBySlug, incrementNewsViews } from '@/lib/db/news';

/**
 * GET /api/news/[slug]
 * Public endpoint to fetch a single news article by slug
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slug is required'
        },
        { status: 400 }
      );
    }

    // Get news article by slug (only active articles)
    const article = await getNewsBySlug(slug);

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: 'News article not found'
        },
        { status: 404 }
      );
    }

    // Check if article is active (public shouldn't see inactive articles)
    if (!article.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'News article not found'
        },
        { status: 404 }
      );
    }

    // Increment view count
    try {
      await incrementNewsViews(article.id);
    } catch (error) {
      // Don't fail the request if view increment fails
      console.error('Failed to increment news views:', error);
    }

    // Transform data for public consumption
    const publicData = {
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
      views: (article.views || 0) + 1, // Include the new view
      author: article.creator_name ? {
        id: article.created_by,
        name: article.creator_name
      } : undefined
    };

    return NextResponse.json({
      success: true,
      data: publicData
    });

  } catch (error) {
    console.error('Error in public news detail API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch news article'
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