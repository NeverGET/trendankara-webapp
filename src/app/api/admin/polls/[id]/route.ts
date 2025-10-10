import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { invalidateEntityCache } from '@/lib/cache/invalidation';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * GET /api/admin/polls/[id]
 * Fetch a single poll by ID
 */
export async function GET(
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

    const connection = await db.getConnection();

    try {
      // Fetch poll with items
      const [polls] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM polls WHERE id = ? AND deleted_at IS NULL`,
        [pollId]
      );

      if (polls.length === 0) {
        return NextResponse.json(
          { error: 'Anket bulunamadı' },
          { status: 404 }
        );
      }

      // Fetch poll items
      const [items] = await connection.execute<RowDataPacket[]>(
        `SELECT * FROM poll_items WHERE poll_id = ? ORDER BY display_order ASC`,
        [pollId]
      );

      return NextResponse.json({
        success: true,
        data: {
          ...polls[0],
          items
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error fetching poll:', error);
    return NextResponse.json(
      { error: 'Anket yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/polls/[id]
 * Delete a poll and cascade to poll_items and poll_votes
 */
export async function DELETE(
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

    const connection = await db.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Check if poll exists
      const [pollCheck] = await connection.execute<RowDataPacket[]>(
        `SELECT id, title FROM polls WHERE id = ? AND deleted_at IS NULL`,
        [pollId]
      );

      if (pollCheck.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Anket bulunamadı' },
          { status: 404 }
        );
      }

      const pollTitle = pollCheck[0].title;

      // Delete poll votes (cascade)
      await connection.execute<ResultSetHeader>(
        `DELETE FROM poll_votes WHERE poll_id = ?`,
        [pollId]
      );

      // Delete poll items (cascade)
      await connection.execute<ResultSetHeader>(
        `DELETE FROM poll_items WHERE poll_id = ?`,
        [pollId]
      );

      // Delete the poll (soft delete)
      await connection.execute<ResultSetHeader>(
        `UPDATE polls SET deleted_at = NOW() WHERE id = ?`,
        [pollId]
      );

      // Commit transaction
      await connection.commit();

      // Invalidate polls cache
      await invalidateEntityCache('polls', pollId.toString());

      return NextResponse.json({
        success: true,
        data: {
          id: pollId,
          title: pollTitle,
          message: 'Anket başarıyla silindi'
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
    console.error('Error deleting poll:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Anket silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
