import { NextRequest, NextResponse } from 'next/server';
import { getPollById, hasVoted } from '@/lib/db/polls';

/**
 * GET /api/polls/[id]/results
 * Fetch poll results
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

    // Check if results should be shown
    const now = new Date();
    const endDate = new Date(poll.end_date);
    const isEnded = now > endDate;

    // Determine if results should be visible
    let showResults = false;
    if (poll.show_results === 'always') {
      showResults = true;
    } else if (poll.show_results === 'when_ended' && isEnded) {
      showResults = true;
    } else if (poll.show_results === 'after_voting') {
      // Check if user has voted (would need device ID from request)
      const deviceId = request.headers.get('x-device-id');
      if (deviceId) {
        const ipAddress = request.headers.get('x-forwarded-for') ||
                         request.headers.get('x-real-ip') ||
                         'unknown';
        const voted = await hasVoted(pollId, deviceId, ipAddress);
        showResults = voted;
      }
    }

    // Calculate total votes
    const totalVotes = poll.items?.reduce((sum: number, item: any) => sum + (item.vote_count || 0), 0) || 0;

    // Transform data
    const publicPoll = {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      poll_type: poll.poll_type,
      start_date: poll.start_date,
      end_date: poll.end_date,
      show_results: poll.show_results,
      is_active: poll.is_active,
      total_votes: totalVotes,
      can_view_results: showResults,
      items: poll.items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        vote_count: showResults ? item.vote_count : undefined,
        percentage: showResults && totalVotes > 0
          ? ((item.vote_count || 0) / totalVotes * 100).toFixed(1)
          : undefined,
        display_order: item.display_order
      })) || []
    };

    return NextResponse.json({
      success: true,
      poll: publicPoll
    });
  } catch (error) {
    console.error('Error fetching poll results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch poll results' },
      { status: 500 }
    );
  }
}