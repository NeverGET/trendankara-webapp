import { NextRequest, NextResponse } from 'next/server';
import { getPastPolls } from '@/lib/db/polls';

/**
 * GET /api/polls/past
 * Fetch past/ended polls for public viewing with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;
    const result = await getPastPolls(offset, limit);

    // Transform data for public consumption
    const publicPolls = result.polls.map((poll: any) => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      poll_type: poll.poll_type,
      start_date: poll.start_date,
      end_date: poll.end_date,
      show_results: poll.show_results || 'when_ended',
      total_votes: poll.total_votes || 0,
      items: poll.items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        vote_count: item.vote_count, // Show results for ended polls
        display_order: item.display_order
      })) || []
    }));

    return NextResponse.json({
      success: true,
      polls: publicPolls,
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
    console.error('Error fetching past polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past polls' },
      { status: 500 }
    );
  }
}