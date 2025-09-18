import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, checkRole, getUserId } from '@/lib/auth/utils';
import {
  getAllNewsCategories,
  createNewsCategory,
  updateNewsCategory,
  deleteNewsCategory,
  getNewsCategoryById,
  newsCategorySlugExists,
  generateSlug,
  type NewsCategoryData
} from '@/lib/db/news';

/**
 * GET /api/admin/news/categories
 * Get all news categories for admin dashboard
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
    const categoryId = searchParams.get('id');

    // If ID provided, get specific news category
    if (categoryId) {
      const category = await getNewsCategoryById(parseInt(categoryId));
      if (!category) {
        return NextResponse.json(
          { success: false, error: 'News category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: category
      });
    }

    // Get all news categories
    const categories = await getAllNewsCategories();

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error in admin news categories GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/news/categories
 * Create a new news category
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
    const { name, slug, is_active } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = generateSlug(name);
    }

    // Check if slug already exists
    const slugExists = await newsCategorySlugExists(finalSlug);
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

    const categoryData: NewsCategoryData = {
      name,
      slug: finalSlug,
      is_system: false, // Only system can create system categories
      is_active: is_active !== false,
      created_by: parseInt(userId)
    };

    const categoryId = await createNewsCategory(categoryData);

    return NextResponse.json({
      success: true,
      data: { id: categoryId },
      message: 'News category created successfully'
    });

  } catch (error) {
    console.error('Error in admin news categories POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/news/categories
 * Update an existing news category
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

    // Validate category ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await getNewsCategoryById(parseInt(id));
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'News category not found' },
        { status: 404 }
      );
    }

    // Prevent modification of system categories
    if (existingCategory.is_system && updateData.name) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify system category name' },
        { status: 400 }
      );
    }

    // If slug is being updated, check for uniqueness
    if (updateData.slug && updateData.slug !== existingCategory.slug) {
      const slugExists = await newsCategorySlugExists(updateData.slug, parseInt(id));
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 400 }
        );
      }
    }

    await updateNewsCategory(parseInt(id), updateData);

    return NextResponse.json({
      success: true,
      message: 'News category updated successfully'
    });

  } catch (error) {
    console.error('Error in admin news categories PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/news/categories
 * Soft delete a news category
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
    const categoryId = searchParams.get('id');

    // Validate category ID
    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await getNewsCategoryById(parseInt(categoryId));
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'News category not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of system categories
    if (existingCategory.is_system) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete system category' },
        { status: 400 }
      );
    }

    await deleteNewsCategory(parseInt(categoryId));

    return NextResponse.json({
      success: true,
      message: 'News category deleted successfully'
    });

  } catch (error) {
    console.error('Error in admin news categories DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}