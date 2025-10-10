import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { updatePoll, PollData } from '@/lib/db/polls';
import { invalidateEntityCache } from '@/lib/cache/invalidation';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface PollWithItemsUpdateRequest {
  title: string;
  description?: string;
  poll_type?: 'weekly' | 'monthly' | 'custom';
  start_date: string;
  end_date: string;
  is_active?: boolean;
  show_on_homepage?: boolean;
  show_results?: 'never' | 'after_voting' | 'always';
  items: Array<{
    id?: number;
    title: string;
    description?: string;
    image_url?: string;
    display_order?: number;
    is_active?: boolean;
  }>;
}

/**
 * PUT /api/admin/polls/[id]/items
 * Update an existing poll with items atomically
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve params
    const resolvedParams = await params;
    const pollId = parseInt(resolvedParams.id);

    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate poll ID
    if (isNaN(pollId) || pollId <= 0) {
      return NextResponse.json(
        { error: 'Geçersiz anket ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: PollWithItemsUpdateRequest = await request.json();

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

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır' },
        { status: 400 }
      );
    }

    // Get database connection for transaction
    const connection = await db.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Check if poll exists and user has permission
      const [pollCheck] = await connection.execute<RowDataPacket[]>(
        `SELECT id, created_by FROM polls WHERE id = ? AND deleted_at IS NULL`,
        [pollId]
      );

      if (pollCheck.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Anket bulunamadı' },
          { status: 404 }
        );
      }

      // Prepare poll data
      const pollData: Partial<PollData> = {
        title: body.title.trim(),
        description: body.description?.trim() || null, // Fix: use null instead of undefined
        poll_type: body.poll_type || 'custom',
        start_date: body.start_date,
        end_date: body.end_date,
        is_active: body.is_active !== false,
        show_on_homepage: body.show_on_homepage !== false,
        show_results: body.show_results || 'after_voting'
      };

      // Update poll
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      Object.entries(pollData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(key === 'is_active' || key === 'show_on_homepage' ? (value ? 1 : 0) : value);
        }
      });

      updateFields.push('updated_at = NOW()');
      updateValues.push(pollId);

      await connection.execute<ResultSetHeader>(
        `UPDATE polls SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Get existing poll items
      const [existingItems] = await connection.execute<RowDataPacket[]>(
        `SELECT id FROM poll_items WHERE poll_id = ?`,
        [pollId]
      );

      const existingItemIds = existingItems.map(item => item.id);
      const incomingItemIds = body.items.filter(item => item.id).map(item => item.id);

      // Delete items that are no longer in the update
      const itemsToDelete = existingItemIds.filter(id => !incomingItemIds.includes(id));
      if (itemsToDelete.length > 0) {
        const deletePlaceholders = itemsToDelete.map(() => '?').join(',');
        await connection.execute<ResultSetHeader>(
          `DELETE FROM poll_items WHERE id IN (${deletePlaceholders})`,
          itemsToDelete
        );
      }

      // Update or create poll items
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];

        if (item.id) {
          // Update existing item
          await connection.execute<ResultSetHeader>(
            `UPDATE poll_items
             SET title = ?, description = ?, image_url = ?, display_order = ?, is_active = ?, updated_at = NOW()
             WHERE id = ? AND poll_id = ?`,
            [
              item.title.trim(),
              item.description?.trim() || null,
              item.image_url?.trim() || null, // Fix: properly sanitize empty strings to null
              item.display_order ?? i,
              item.is_active !== false ? 1 : 0,
              item.id,
              pollId
            ]
          );
        } else {
          // Create new item
          await connection.execute<ResultSetHeader>(
            `INSERT INTO poll_items (poll_id, title, description, image_url, display_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              pollId,
              item.title.trim(),
              item.description?.trim() || null,
              item.image_url?.trim() || null, // Fix: properly sanitize empty strings to null
              item.display_order ?? i,
              item.is_active !== false ? 1 : 0
            ]
          );
        }
      }

      // Commit transaction
      await connection.commit();

      // Invalidate polls cache
      await invalidateEntityCache('polls', pollId.toString());

      return NextResponse.json({
        success: true,
        data: {
          id: pollId,
          message: 'Anket başarıyla güncellendi'
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
    console.error('Error updating poll with items:', error);

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
      { error: 'Anket güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}