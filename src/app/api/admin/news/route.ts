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
  searchNews,
  getNewsStats,
  type NewsData,
  type PaginationOptions,
  type NewsFilters
} from '@/lib/db/news';
import { getStorageClient } from '@/lib/storage/client';

/**
 * GET /api/admin/news
 * Get all news articles for admin dashboard with pagination, search, and filtering
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

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const pagination: PaginationOptions = {
      offset: Math.max(0, offset),
      limit: Math.min(100, Math.max(1, limit)) // Max 100, min 1
    };

    // Parse filtering parameters
    const filters: NewsFilters = {};

    // Search term
    const search = searchParams.get('search');
    if (search && search.trim()) {
      filters.search = search.trim();
    }

    // Category filter
    const categoryId = searchParams.get('category_id');
    if (categoryId && !isNaN(parseInt(categoryId))) {
      filters.category_id = parseInt(categoryId);
    }

    // Boolean filters
    const isFeatured = searchParams.get('is_featured');
    if (isFeatured === 'true') filters.is_featured = true;
    if (isFeatured === 'false') filters.is_featured = false;

    const isBreaking = searchParams.get('is_breaking');
    if (isBreaking === 'true') filters.is_breaking = true;
    if (isBreaking === 'false') filters.is_breaking = false;

    const isHot = searchParams.get('is_hot');
    if (isHot === 'true') filters.is_hot = true;
    if (isHot === 'false') filters.is_hot = false;

    const isActive = searchParams.get('is_active');
    if (isActive === 'true') filters.is_active = true;
    if (isActive === 'false') filters.is_active = false;

    // Author filter
    const createdBy = searchParams.get('created_by');
    if (createdBy && !isNaN(parseInt(createdBy))) {
      filters.created_by = parseInt(createdBy);
    }

    // Date range filters
    const startDate = searchParams.get('start_date');
    if (startDate) {
      filters.start_date = startDate;
    }

    const endDate = searchParams.get('end_date');
    if (endDate) {
      filters.end_date = endDate;
    }

    // Get news with pagination and filtering
    let result;
    if (filters.search) {
      // Use dedicated search function for better performance with search terms
      result = await searchNews(filters.search, pagination, filters);
    } else {
      // Use general getAllNews function
      result = await getAllNews(pagination, filters);
    }

    // Include stats if requested
    const includeStats = searchParams.get('include_stats') === 'true';
    let stats = null;
    if (includeStats) {
      stats = await getNewsStats();
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      },
      filters,
      ...(stats && { stats })
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
 * Create a new news article with optional image upload
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

    const contentType = request.headers.get('content-type') || '';
    let body: any;
    let imageFile: File | null = null;

    // Handle both JSON and FormData requests
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await request.formData();

      // Extract form fields
      body = {
        title: formData.get('title'),
        slug: formData.get('slug'),
        summary: formData.get('summary'),
        content: formData.get('content'),
        category_id: formData.get('category_id'),
        is_featured: formData.get('is_featured'),
        is_breaking: formData.get('is_breaking'),
        is_hot: formData.get('is_hot'),
        is_active: formData.get('is_active'),
        published_at: formData.get('published_at')
      };

      // Extract image file if present
      const uploadedFile = formData.get('featured_image') as File;
      if (uploadedFile && uploadedFile.size > 0) {
        imageFile = uploadedFile;
      }
    } else {
      // Handle JSON request
      body = await request.json();
    }

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

    // Handle image upload if provided
    let finalFeaturedImage = featured_image;
    if (imageFile) {
      try {
        const storageClient = getStorageClient();

        // Convert file to buffer
        const arrayBuffer = await imageFile.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        // Upload to MinIO
        const uploadResult = await storageClient.uploadFile(
          fileBuffer,
          `news-${Date.now()}-${imageFile.name}`,
          {
            contentType: imageFile.type,
            metadata: {
              originalName: imageFile.name,
              uploadedBy: userId,
              newsTitle: title
            }
          }
        );

        finalFeaturedImage = uploadResult.originalUrl;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return NextResponse.json(
          { success: false, error: 'Failed to upload image' },
          { status: 500 }
        );
      }
    }

    const newsData: NewsData = {
      title,
      slug: finalSlug,
      summary,
      content,
      featured_image: finalFeaturedImage,
      category_id: category_id ? parseInt(category_id) : undefined,
      is_featured: is_featured === true || is_featured === 'true',
      is_breaking: is_breaking === true || is_breaking === 'true',
      is_hot: is_hot === true || is_hot === 'true',
      is_active: is_active !== false && is_active !== 'false',
      published_at: published_at || null,
      created_by: parseInt(userId)
    };

    const newsId = await createNews(newsData);

    // Get the created news article to return full data
    const createdNews = await getNewsById(newsId);

    return NextResponse.json({
      success: true,
      data: createdNews,
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
 * Update an existing news article with optional image upload
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

    const contentType = request.headers.get('content-type') || '';
    let body: any;
    let imageFile: File | null = null;
    let newsId: number;

    // Handle both JSON and FormData requests
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with file upload)
      const formData = await request.formData();

      // Extract form fields
      body = {
        id: formData.get('id'),
        title: formData.get('title'),
        slug: formData.get('slug'),
        summary: formData.get('summary'),
        content: formData.get('content'),
        category_id: formData.get('category_id'),
        is_featured: formData.get('is_featured'),
        is_breaking: formData.get('is_breaking'),
        is_hot: formData.get('is_hot'),
        is_active: formData.get('is_active'),
        published_at: formData.get('published_at')
      };

      // Extract image file if present
      const uploadedFile = formData.get('featured_image') as File;
      if (uploadedFile && uploadedFile.size > 0) {
        imageFile = uploadedFile;
      }
    } else {
      // Handle JSON request
      body = await request.json();
    }

    const { id, ...updateData } = body;
    newsId = parseInt(id);

    // Validate news ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'News ID is required' },
        { status: 400 }
      );
    }

    // Check if news exists
    const existingNews = await getNewsById(newsId);
    if (!existingNews) {
      return NextResponse.json(
        { success: false, error: 'News article not found' },
        { status: 404 }
      );
    }

    // If slug is being updated, check for uniqueness
    if (updateData.slug && updateData.slug !== existingNews.slug) {
      const slugExists = await newsSlugExists(updateData.slug, newsId);
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 400 }
        );
      }
    }

    // Handle image upload if provided
    if (imageFile) {
      try {
        const storageClient = getStorageClient();
        const userId = getUserId(session);

        // Convert file to buffer
        const arrayBuffer = await imageFile.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        // Upload to MinIO
        const uploadResult = await storageClient.uploadFile(
          fileBuffer,
          `news-${Date.now()}-${imageFile.name}`,
          {
            contentType: imageFile.type,
            metadata: {
              originalName: imageFile.name,
              uploadedBy: userId,
              newsId: newsId.toString(),
              updatedAt: new Date().toISOString()
            }
          }
        );

        updateData.featured_image = uploadResult.originalUrl;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        return NextResponse.json(
          { success: false, error: 'Failed to upload image' },
          { status: 500 }
        );
      }
    }

    // Convert category_id to number if provided
    if (updateData.category_id) {
      updateData.category_id = parseInt(updateData.category_id);
    }

    // Convert boolean string values to boolean
    if (updateData.is_featured !== undefined) {
      updateData.is_featured = updateData.is_featured === true || updateData.is_featured === 'true';
    }
    if (updateData.is_breaking !== undefined) {
      updateData.is_breaking = updateData.is_breaking === true || updateData.is_breaking === 'true';
    }
    if (updateData.is_hot !== undefined) {
      updateData.is_hot = updateData.is_hot === true || updateData.is_hot === 'true';
    }
    if (updateData.is_active !== undefined) {
      updateData.is_active = updateData.is_active === true || updateData.is_active === 'true';
    }

    await updateNews(newsId, updateData);

    // Get the updated news article to return full data
    const updatedNews = await getNewsById(newsId);

    return NextResponse.json({
      success: true,
      data: updatedNews,
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