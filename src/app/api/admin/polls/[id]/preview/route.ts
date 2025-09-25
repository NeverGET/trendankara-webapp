import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPollById } from '@/lib/db/polls';

/**
 * GET /api/admin/polls/[id]/preview
 * Get poll preview as it would appear publicly
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const resolvedParams = await params;

    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse poll ID
    const pollId = parseInt(resolvedParams.id);
    if (isNaN(pollId) || pollId <= 0) {
      return NextResponse.json(
        { error: 'Geçersiz anket ID' },
        { status: 400 }
      );
    }

    // Get poll with items
    const poll = await getPollById(pollId);
    if (!poll) {
      return NextResponse.json(
        { error: 'Anket bulunamadı' },
        { status: 404 }
      );
    }

    // Calculate total votes
    const totalVotes = poll.items?.reduce((sum: number, item: any) => sum + (item.vote_count || 0), 0) || 0;

    // Transform poll data for public view
    const publicPoll = {
      id: poll.id,
      question: poll.title,
      description: poll.description,
      startDate: poll.start_date,
      endDate: poll.end_date,
      totalVotes,
      show_results: poll.show_results,
      options: poll.items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        votes: item.vote_count || 0
      })) || [],
      preview_mode: true
    };

    return NextResponse.json({
      success: true,
      data: publicPoll
    });

  } catch (error) {
    console.error('Error fetching poll preview:', error);
    return NextResponse.json(
      { error: 'Anket önizlemesi alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}