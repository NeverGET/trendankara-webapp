import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getAllPolls, PaginationOptions, PollFilters } from '@/lib/db/polls';

/**
 * GET /api/admin/polls
 * Fetch polls with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const poll_type = searchParams.get('poll_type') || '';
    const is_active = searchParams.get('is_active');
    const show_on_homepage = searchParams.get('show_on_homepage');
    const show_results = searchParams.get('show_results') || '';

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Prepare pagination and filters
    const paginationOptions: PaginationOptions = {
      offset: (page - 1) * limit,
      limit
    };

    const filters: PollFilters = {};

    if (search.trim()) {
      filters.search = search.trim();
    }

    if (poll_type && poll_type !== 'all') {
      filters.poll_type = poll_type as 'weekly' | 'monthly' | 'custom';
    }

    if (is_active !== null) {
      filters.is_active = is_active === 'true';
    }

    if (show_on_homepage !== null) {
      filters.show_on_homepage = show_on_homepage === 'true';
    }

    if (show_results && show_results !== 'all') {
      filters.show_results = show_results as 'never' | 'after_voting' | 'always';
    }

    // Fetch polls
    const result = await getAllPolls(paginationOptions, filters);

    // Transform data for frontend
    const transformedData = result.data.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      poll_type: poll.poll_type,
      start_date: poll.start_date,
      end_date: poll.end_date,
      is_active: Boolean(poll.is_active),
      show_on_homepage: Boolean(poll.show_on_homepage),
      show_results: poll.show_results,
      created_by: poll.created_by,
      creator_name: poll.creator_name,
      created_at: poll.created_at,
      updated_at: poll.updated_at,
      total_votes: poll.total_votes || 0,
      item_count: poll.item_count || 0,
      // Determine status based on dates and is_active
      status: getStatusFromPoll(poll)
    }));

    return NextResponse.json({
      success: true,
      data: {
        data: transformedData,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNext: result.hasNext,
          hasPrev: result.hasPrev
        }
      }
    });

  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json(
      { error: 'Anketler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * Determine poll status based on dates and active state
 */
function getStatusFromPoll(poll: any): string {
  const now = new Date();
  const startDate = new Date(poll.start_date);
  const endDate = new Date(poll.end_date);

  if (!poll.is_active) {
    return 'draft';
  }

  if (now < startDate) {
    return 'scheduled';
  }

  if (now > endDate) {
    return 'ended';
  }

  return 'active';
}