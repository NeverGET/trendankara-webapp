import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, checkRole, getUserId } from '@/lib/auth/utils';
import {
  getAllPolls,
  createPoll,
  updatePoll,
  deletePoll,
  getPollById,
  type PollData
} from '@/lib/db/polls';

/**
 * GET /api/admin/polls
 * Get all polls for admin dashboard
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

    const polls = await getAllPolls();

    return NextResponse.json({
      success: true,
      data: polls
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

    await deletePoll(parseInt(pollId));

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