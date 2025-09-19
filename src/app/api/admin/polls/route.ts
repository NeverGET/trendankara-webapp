import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, checkRole, getUserId } from '@/lib/auth/utils';
import {
  getAllPolls,
  createPoll,
  updatePoll,
  deletePoll,
  getPollById,
  type PollData,
  type PaginationOptions,
  type PollFilters
} from '@/lib/db/polls';
import {
  getVoteStatistics,
  resetPollVotes
} from '@/lib/db/poll-votes';
import { invalidateEntityCache } from '@/lib/cache/invalidation';

/**
 * GET /api/admin/polls
 * Get all polls for admin dashboard with pagination and filtering
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
    const pollId = searchParams.get('id');

    // If ID provided, get specific poll with stats
    if (pollId) {
      const poll = await getPollById(parseInt(pollId));
      if (!poll) {
        return NextResponse.json(
          { success: false, error: 'Poll not found' },
          { status: 404 }
        );
      }

      // Include vote statistics if requested
      const includeStats = searchParams.get('include_stats') === 'true';
      if (includeStats) {
        const stats = await getVoteStatistics(parseInt(pollId));
        poll.statistics = stats;
      }

      return NextResponse.json({
        success: true,
        data: poll
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
    const filters: PollFilters = {};

    // Search term
    const search = searchParams.get('search');
    if (search && search.trim()) {
      filters.search = search.trim();
    }

    // Poll type filter
    const pollType = searchParams.get('poll_type');
    if (pollType && ['weekly', 'monthly', 'custom'].includes(pollType)) {
      filters.poll_type = pollType as 'weekly' | 'monthly' | 'custom';
    }

    // Boolean filters
    const isActive = searchParams.get('is_active');
    if (isActive === 'true') filters.is_active = true;
    if (isActive === 'false') filters.is_active = false;

    const showOnHomepage = searchParams.get('show_on_homepage');
    if (showOnHomepage === 'true') filters.show_on_homepage = true;
    if (showOnHomepage === 'false') filters.show_on_homepage = false;

    // Date range filters
    const startDate = searchParams.get('start_date');
    if (startDate) {
      filters.start_date = startDate;
    }

    const endDate = searchParams.get('end_date');
    if (endDate) {
      filters.end_date = endDate;
    }

    // Get polls with pagination and filtering
    const result = await getAllPolls(pagination, filters);

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
    console.error('Error in admin polls GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/polls
 * Create a new poll
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
      description,
      poll_type,
      start_date,
      end_date,
      is_active,
      show_on_homepage
    } = body;

    // Validate required fields
    if (!title || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, start_date, end_date' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate >= endDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid user session' },
        { status: 400 }
      );
    }

    const pollData: PollData = {
      title,
      description,
      poll_type: poll_type || 'custom',
      start_date,
      end_date,
      is_active: is_active !== false,
      show_on_homepage: show_on_homepage !== false,
      created_by: parseInt(userId)
    };

    const pollId = await createPoll(pollData);

    // Invalidate polls cache after creation
    await invalidateEntityCache('polls');

    return NextResponse.json({
      success: true,
      data: { id: pollId },
      message: 'Poll created successfully'
    });

  } catch (error) {
    console.error('Error in admin polls POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/polls
 * Update an existing poll
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

    // Validate poll ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    // Check if poll exists
    const existingPoll = await getPollById(parseInt(id));
    if (!existingPoll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Validate dates if provided
    if (updateData.start_date && updateData.end_date) {
      const startDate = new Date(updateData.start_date);
      const endDate = new Date(updateData.end_date);
      if (startDate >= endDate) {
        return NextResponse.json(
          { success: false, error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    await updatePoll(parseInt(id), updateData);

    // Invalidate polls cache after update
    await invalidateEntityCache('polls', id.toString());

    return NextResponse.json({
      success: true,
      message: 'Poll updated successfully'
    });

  } catch (error) {
    console.error('Error in admin polls PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/polls
 * Soft delete a poll
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
    const pollId = searchParams.get('id');
    const action = searchParams.get('action');

    // Validate poll ID
    if (!pollId) {
      return NextResponse.json(
        { success: false, error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    // Check if poll exists
    const existingPoll = await getPollById(parseInt(pollId));
    if (!existingPoll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Handle special actions
    if (action === 'reset_votes') {
      await resetPollVotes(parseInt(pollId));
      // Invalidate polls cache when votes are reset
      await invalidateEntityCache('polls', pollId);
      return NextResponse.json({
        success: true,
        message: 'Poll votes reset successfully'
      });
    }

    await deletePoll(parseInt(pollId));

    // Invalidate polls cache after deletion
    await invalidateEntityCache('polls', pollId);

    return NextResponse.json({
      success: true,
      message: 'Poll deleted successfully'
    });

  } catch (error) {
    console.error('Error in admin polls DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/polls
 * Quick actions like activate/deactivate poll
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

    // Validate poll ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    // Check if poll exists
    const existingPoll = await getPollById(parseInt(id));
    if (!existingPoll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'activate':
        await updatePoll(parseInt(id), { is_active: true });
        // Invalidate cache for poll activation - affects featured polls
        await invalidateEntityCache('polls', id.toString());
        return NextResponse.json({
          success: true,
          message: 'Poll activated successfully'
        });

      case 'deactivate':
        await updatePoll(parseInt(id), { is_active: false });
        // Invalidate cache for poll deactivation
        await invalidateEntityCache('polls', id.toString());
        return NextResponse.json({
          success: true,
          message: 'Poll deactivated successfully'
        });

      case 'toggle_homepage':
        await updatePoll(parseInt(id), { show_on_homepage: value !== false });
        // Invalidate cache for featured poll changes
        await invalidateEntityCache('polls', id.toString());
        return NextResponse.json({
          success: true,
          message: `Poll ${value ? 'shown' : 'hidden'} on homepage`
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in admin polls PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}