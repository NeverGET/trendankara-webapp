import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { createPoll, createPollItem, PollData, PollItemData } from '@/lib/db/polls';
import { invalidateEntityCache } from '@/lib/cache/invalidation';
import { ResultSetHeader } from 'mysql2';

interface PollWithItemsRequest {
  title: string;
  description?: string;
  poll_type?: 'weekly' | 'monthly' | 'custom';
  start_date: string;
  end_date: string;
  is_active?: boolean;
  show_on_homepage?: boolean;
  show_results?: 'never' | 'after_voting' | 'always';
  items: Array<{
    title: string;
    description?: string;
    image_url?: string;
    display_order?: number;
    is_active?: boolean;
  }>;
}

/**
 * POST /api/admin/polls/items
 * Create a new poll with items atomically
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: PollWithItemsRequest = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Anket başlığı gereklidir' },
        { status: 400 }
      );
    }

    if (!body.start_date || !body.end_date) {
      return NextResponse.json(
        { error: 'Başlangıç ve bitiş tarihleri gereklidir' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length < 2) {
      return NextResponse.json(
        { error: 'En az 2 seçenek eklemelisiniz' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of body.items) {
      if (!item.title?.trim()) {
        return NextResponse.json(
          { error: 'Tüm seçenekler için başlık gereklidir' },
          { status: 400 }
        );
      }
    }

    // Validate dates
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);
    const now = new Date();

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır' },
        { status: 400 }
      );
    }

    if (endDate <= now) {
      return NextResponse.json(
        { error: 'Bitiş tarihi gelecekte olmalıdır' },
        { status: 400 }
      );
    }

    // Get database connection for transaction
    const connection = await db.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Prepare poll data
      const pollData: PollData = {
        title: body.title.trim(),
        description: body.description?.trim() || undefined,
        poll_type: body.poll_type || 'custom',
        start_date: body.start_date,
        end_date: body.end_date,
        is_active: body.is_active !== false,
        show_on_homepage: body.show_on_homepage !== false,
        show_results: body.show_results || 'after_voting',
        created_by: parseInt(session.user.id)
      };

      // Create poll
      const pollResult = await connection.execute<ResultSetHeader>(
        `INSERT INTO polls (title, description, poll_type, start_date, end_date, is_active, show_on_homepage, show_results, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pollData.title,
          pollData.description,
          pollData.poll_type,
          pollData.start_date,
          pollData.end_date,
          pollData.is_active ? 1 : 0,
          pollData.show_on_homepage ? 1 : 0,
          pollData.show_results,
          pollData.created_by
        ]
      );

      const pollId = pollResult[0].insertId;

      // Create poll items
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        await connection.execute<ResultSetHeader>(
          `INSERT INTO poll_items (poll_id, title, description, image_url, display_order, is_active)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            pollId,
            item.title.trim(),
            item.description?.trim() || null,
            item.image_url || null,
            item.display_order ?? i,
            item.is_active !== false ? 1 : 0
          ]
        );
      }

      // Commit transaction
      await connection.commit();

      // Invalidate polls cache
      await invalidateEntityCache('polls');

      return NextResponse.json({
        success: true,
        data: {
          id: pollId,
          message: 'Anket başarıyla oluşturuldu'
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error creating poll with items:', error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Duplicate entry')) {
        return NextResponse.json(
          { error: 'Bu isimde bir anket zaten mevcut' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Anket oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}