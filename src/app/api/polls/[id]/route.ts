import { NextRequest, NextResponse } from 'next/server';
import { getPollById } from '@/lib/db/polls';

/**
 * GET /api/polls/[id]
 * Fetch a single poll by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const pollId = parseInt(params.id);

    if (isNaN(pollId) || pollId < 1) {
      return NextResponse.json(
        { error: 'Invalid poll ID' },
        { status: 400 }
      );
    }

    const poll = await getPollById(pollId);

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Check if poll should be visible
    const now = new Date();
    const startDate = new Date(poll.start_date);
    const endDate = new Date(poll.end_date);
    const isEnded = now > endDate;

    // Transform data for public consumption
    const publicPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      poll_type: poll.poll_type,
      start_date: poll.start_date,
      end_date: poll.end_date,
      show_results: poll.show_results || 'after_voting',
      is_active: poll.is_active,
      total_votes: poll.total_votes || 0,
      items: poll.items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        vote_count: (poll.show_results === 'always' || (poll.show_results === 'when_ended' && isEnded))
          ? item.vote_count
          : undefined,
        display_order: item.display_order
      })) || []
    };

    return NextResponse.json({
      success: true,
      poll: publicPoll
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    return NextResponse.json(
      { error: 'Failed to fetch poll' },
      { status: 500 }
    );
  }
}