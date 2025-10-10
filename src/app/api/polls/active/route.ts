import { NextRequest, NextResponse } from 'next/server';
import { getActivePolls } from '@/lib/db/polls';
import { fixMediaUrlsInObject } from '@/lib/utils/url-fixer';

/**
 * GET /api/polls/active
 * Fetch all active polls for public viewing
 */
export async function GET(request: NextRequest) {
  try {
    const polls = await getActivePolls();

    // Transform data for public consumption
    // Note: Always include vote_count in API response - frontend will decide when to display based on show_results setting
    const publicPolls = polls.map((poll: any) => fixMediaUrlsInObject({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      poll_type: poll.poll_type,
      start_date: poll.start_date,
      end_date: poll.end_date,
      show_results: poll.show_results || 'after_voting',
      total_votes: parseInt(poll.total_votes) || 0,
      items: poll.items?.map((item: any) => fixMediaUrlsInObject({
        id: item.id,
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        vote_count: parseInt(item.vote_count) || 0,
        display_order: item.display_order
      })) || []
    }));

    return NextResponse.json({
      success: true,
      polls: publicPolls
    });
  } catch (error) {
    console.error('Error fetching active polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active polls' },
      { status: 500 }
    );
  }
}