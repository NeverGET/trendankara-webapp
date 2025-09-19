import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, checkRole, getUserId } from '@/lib/auth/utils';
import {
  getAllContentPages,
  createContentPage,
  updateContentPage,
  deleteContentPage,
  getContentPageById,
  getContentPageBySlug,
  duplicateContentPage,
  setContentPagePublishStatus,
  setAsHomepage,
  contentPageSlugExists,
  generateSlug,
  validateComponents,
  type ContentPageData,
  type PaginationOptions,
  type ContentPageFilters
} from '@/lib/db/content-pages';

/**
 * GET /api/admin/content
 * Get all content pages with pagination and filtering
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
    const pageId = searchParams.get('id');
    const slug = searchParams.get('slug');

    // If ID provided, get specific page
    if (pageId) {
      const contentPage = await getContentPageById(parseInt(pageId));
      if (!contentPage) {
        return NextResponse.json(
          { success: false, error: 'Content page not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: contentPage
      });
    }

    // If slug provided, get page by slug
    if (slug) {
      const contentPage = await getContentPageBySlug(slug);
      if (!contentPage) {
        return NextResponse.json(
          { success: false, error: 'Content page not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: contentPage
      });
    }

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const pagination: PaginationOptions = {
      offset: Math.max(0, offset),
      limit: Math.min(100, Math.max(1, limit))
    };

    // Parse filtering parameters
    const filters: ContentPageFilters = {};

    // Search term
    const search = searchParams.get('search');
    if (search && search.trim()) {
      filters.search = search.trim();
    }

    // Published filter
    const isPublished = searchParams.get('is_published');
    if (isPublished === 'true') filters.is_published = true;
    if (isPublished === 'false') filters.is_published = false;

    // Homepage filter
    const isHomepage = searchParams.get('is_homepage');
    if (isHomepage === 'true') filters.is_homepage = true;
    if (isHomepage === 'false') filters.is_homepage = false;

    // Get content pages with pagination and filtering
    const result = await getAllContentPages(pagination, filters);

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
      filters
    });

  } catch (error) {
    console.error('Error in admin content GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/content
 * Create a new content page
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
      description,
      components,
      meta,
      is_published,
      is_homepage
    } = body;

    // Validate required fields
    if (!title || !components) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, components' },
        { status: 400 }
      );
    }

    // Validate components structure
    const validation = validateComponents(components);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid components', errors: validation.errors },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = generateSlug(title);
    }

    // Check if slug already exists
    const slugExists = await contentPageSlugExists(finalSlug);
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

    const pageData: ContentPageData = {
      title,
      slug: finalSlug,
      description,
      components,
      meta,
      is_published: is_published === true,
      is_homepage: is_homepage === true,
      created_by: parseInt(userId)
    };

    const pageId = await createContentPage(pageData);

    // If setting as homepage, update other pages
    if (is_homepage) {
      await setAsHomepage(pageId);
    }

    // Get the created page to return full data
    const createdPage = await getContentPageById(pageId);

    return NextResponse.json({
      success: true,
      data: createdPage,
      message: 'Content page created successfully'
    });

  } catch (error) {
    console.error('Error in admin content POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/content
 * Update an existing content page
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

    // Validate page ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required' },
        { status: 400 }
      );
    }

    const pageId = parseInt(id);

    // Check if page exists
    const existingPage = await getContentPageById(pageId);
    if (!existingPage) {
      return NextResponse.json(
        { success: false, error: 'Content page not found' },
        { status: 404 }
      );
    }

    // If slug is being updated, check for uniqueness
    if (updateData.slug && updateData.slug !== (existingPage as any).slug) {
      const slugExists = await contentPageSlugExists(updateData.slug, pageId);
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 400 }
        );
      }
    }

    // Validate components if provided
    if (updateData.components) {
      const validation = validateComponents(updateData.components);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid components', errors: validation.errors },
          { status: 400 }
        );
      }
    }

    await updateContentPage(pageId, updateData);

    // If setting as homepage, update other pages
    if (updateData.is_homepage === true) {
      await setAsHomepage(pageId);
    }

    // Get the updated page to return full data
    const updatedPage = await getContentPageById(pageId);

    return NextResponse.json({
      success: true,
      data: updatedPage,
      message: 'Content page updated successfully'
    });

  } catch (error) {
    console.error('Error in admin content PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/content
 * Soft delete a content page
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
    const pageId = searchParams.get('id');

    // Validate page ID
    if (!pageId) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required' },
        { status: 400 }
      );
    }

    // Check if page exists
    const existingPage = await getContentPageById(parseInt(pageId));
    if (!existingPage) {
      return NextResponse.json(
        { success: false, error: 'Content page not found' },
        { status: 404 }
      );
    }

    // Don't allow deleting the homepage
    if ((existingPage as any).is_homepage) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete homepage. Set another page as homepage first.' },
        { status: 400 }
      );
    }

    await deleteContentPage(parseInt(pageId));

    return NextResponse.json({
      success: true,
      message: 'Content page deleted successfully'
    });

  } catch (error) {
    console.error('Error in admin content DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/content
 * Quick actions like publish/unpublish, duplicate, set homepage
 */
export async function PATCH(request: NextRequest) {
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
    const { id, action, value } = body;

    // Validate page ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required' },
        { status: 400 }
      );
    }

    const pageId = parseInt(id);

    // Check if page exists
    const existingPage = await getContentPageById(pageId);
    if (!existingPage) {
      return NextResponse.json(
        { success: false, error: 'Content page not found' },
        { status: 404 }
      );
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid user session' },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'publish':
        await setContentPagePublishStatus(pageId, true);
        return NextResponse.json({
          success: true,
          message: 'Page published successfully'
        });

      case 'unpublish':
        await setContentPagePublishStatus(pageId, false);
        return NextResponse.json({
          success: true,
          message: 'Page unpublished successfully'
        });

      case 'set_homepage':
        await setAsHomepage(pageId);
        return NextResponse.json({
          success: true,
          message: 'Page set as homepage successfully'
        });

      case 'duplicate':
        const newTitle = value || `${(existingPage as any).title} (Copy)`;
        const newPageId = await duplicateContentPage(pageId, newTitle, parseInt(userId));
        const newPage = await getContentPageById(newPageId);
        return NextResponse.json({
          success: true,
          data: newPage,
          message: 'Page duplicated successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in admin content PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}