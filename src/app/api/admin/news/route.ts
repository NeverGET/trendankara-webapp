import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, checkRole, getUserId } from '@/lib/auth/utils';
import {
  getAllNews,
  createNews,
  updateNews,
  deleteNews,
  getNewsById,
  newsSlugExists,
  generateSlug,
  type NewsData
} from '@/lib/db/news';

/**
 * GET /api/admin/news
 * Get all news articles for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    if (!checkRole(session, 'admin')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('id');

    // If ID provided, get specific news article
    if (newsId) {
      const news = await getNewsById(parseInt(newsId));
      if (!news) {
        return NextResponse.json(
          { success: false, error: 'News article not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: news
      });
    }

    // Get all news articles
    const news = await getAllNews();

    return NextResponse.json({
      success: true,
      data: news
    });

  } catch (error) {
    console.error('Error in admin news GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/news
 * Create a new news article
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    if (!checkRole(session, 'admin')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      summary,
      content,
      featured_image,
      category_id,
      is_featured,
      is_breaking,
      is_hot,
      is_active,
      published_at
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, content' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = generateSlug(title);
    }

    // Check if slug already exists
    const slugExists = await newsSlugExists(finalSlug);
    if (slugExists) {
      // Generate a unique slug by appending timestamp
      const timestamp = Date.now();
      finalSlug = `${finalSlug}-${timestamp}`;
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid user session' },
        { status: 400 }
      );
    }

    const newsData: NewsData = {
      title,
      slug: finalSlug,
      summary,
      content,
      featured_image,
      category_id: category_id ? parseInt(category_id) : undefined,
      is_featured: is_featured === true,
      is_breaking: is_breaking === true,
      is_hot: is_hot === true,
      is_active: is_active !== false,
      published_at: published_at || null,
      created_by: parseInt(userId)
    };

    const newsId = await createNews(newsData);

    return NextResponse.json({
      success: true,
      data: { id: newsId },
      message: 'News article created successfully'
    });

  } catch (error) {
    console.error('Error in admin news POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/news
 * Update an existing news article
 */
export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    if (!checkRole(session, 'admin')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    // Validate news ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'News ID is required' },
        { status: 400 }
      );
    }

    // Check if news exists
    const existingNews = await getNewsById(parseInt(id));
    if (!existingNews) {
      return NextResponse.json(
        { success: false, error: 'News article not found' },
        { status: 404 }
      );
    }

    // If slug is being updated, check for uniqueness
    if (updateData.slug && updateData.slug !== existingNews.slug) {
      const slugExists = await newsSlugExists(updateData.slug, parseInt(id));
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 400 }
        );
      }
    }

    // Convert category_id to number if provided
    if (updateData.category_id) {
      updateData.category_id = parseInt(updateData.category_id);
    }

    await updateNews(parseInt(id), updateData);

    return NextResponse.json({
      success: true,
      message: 'News article updated successfully'
    });

  } catch (error) {
    console.error('Error in admin news PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/news
 * Soft delete a news article
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    if (!checkRole(session, 'admin')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('id');

    // Validate news ID
    if (!newsId) {
      return NextResponse.json(
        { success: false, error: 'News ID is required' },
        { status: 400 }
      );
    }

    // Check if news exists
    const existingNews = await getNewsById(parseInt(newsId));
    if (!existingNews) {
      return NextResponse.json(
        { success: false, error: 'News article not found' },
        { status: 404 }
      );
    }

    await deleteNews(parseInt(newsId));

    return NextResponse.json({
      success: true,
      message: 'News article deleted successfully'
    });

  } catch (error) {
    console.error('Error in admin news DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}