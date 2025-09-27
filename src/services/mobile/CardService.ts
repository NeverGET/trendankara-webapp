/**
 * Mobile Card Service
 * Manages simplified card-based content for mobile display
 * Requirements: 2.1, 2.2, 2.3, 2.5, 4.3 - Card-based content management
 */

import type { MobileCard, CardInput } from '@/types/mobile';
import { db } from '@/lib/db/client';
import { fixMediaUrlsInObject } from '@/lib/utils/url-fixer';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CardRow extends RowDataPacket, MobileCard {
  image_url: string;
  redirect_url: string;
  is_featured: number;
  display_order: number;
  is_active: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class CardService {
  /**
   * Get all active cards optionally filtered by type
   * Returns cards sorted by featured status and display order
   *
   * @param type Optional filter for featured/normal cards
   * @returns Array of mobile cards
   */
  async getCards(type?: 'featured' | 'normal'): Promise<MobileCard[]> {

    try {
      let query = `
        SELECT
          id,
          title,
          description,
          image_url,
          redirect_url,
          is_featured,
          display_order,
          is_active,
          created_at,
          updated_at
        FROM mobile_cards
        WHERE is_active = 1
          AND deleted_at IS NULL
      `;

      const params: any[] = [];

      // Add type filter if specified
      if (type === 'featured') {
        query += ' AND is_featured = 1';
      } else if (type === 'normal') {
        query += ' AND is_featured = 0';
      }

      // Sort by featured status (featured first) and display order
      query += ' ORDER BY is_featured DESC, display_order ASC, created_at DESC';

      const [rows] = await db.execute<CardRow[]>(query, params);

      // Transform to mobile card format
      return rows.map(row => this.transformToMobileCard(row));
    } catch (error) {
      console.error('Error fetching cards:', error);
      throw new Error('Failed to retrieve cards');
    }
  }

  /**
   * Get a single card by ID
   *
   * @param id Card ID
   * @returns Mobile card or null
   */
  async getCardById(id: number): Promise<MobileCard | null> {

    try {
      const query = `
        SELECT
          id,
          title,
          description,
          image_url,
          redirect_url,
          is_featured,
          display_order,
          is_active,
          created_at,
          updated_at
        FROM mobile_cards
        WHERE id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `;

      const [rows] = await db.execute<CardRow[]>(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return this.transformToMobileCard(rows[0]);
    } catch (error) {
      console.error('Error fetching card by ID:', error);
      throw new Error('Failed to retrieve card');
    }
  }

  /**
   * Create a new card
   *
   * @param data Card input data
   * @param userId User ID of creator
   * @returns Created card
   */
  async createCard(data: CardInput, userId?: number): Promise<MobileCard> {

    try {
      // Validate required fields
      if (!data.title) {
        throw new Error('Başlık zorunludur');
      }

      // Get next display order
      const [orderResult] = await db.execute<RowDataPacket[]>(
        'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM mobile_cards WHERE is_featured = ?',
        [data.isFeatured ? 1 : 0]
      );
      const nextOrder = orderResult[0].next_order;

      const query = `
        INSERT INTO mobile_cards (
          title,
          description,
          image_url,
          redirect_url,
          is_featured,
          display_order,
          is_active,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        data.title,
        data.description || null,
        data.imageUrl || null,
        data.redirectUrl || null,
        data.isFeatured ? 1 : 0,
        data.displayOrder !== undefined ? data.displayOrder : nextOrder,
        data.isActive !== false ? 1 : 0,
        userId || null
      ];

      const [result] = await db.execute<ResultSetHeader>(query, params);

      // Return the created card
      const created = await this.getCardById(result.insertId);
      if (!created) {
        throw new Error('Failed to retrieve created card');
      }

      return created;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error instanceof Error ? error : new Error('Failed to create card');
    }
  }

  /**
   * Update an existing card
   *
   * @param id Card ID
   * @param data Card update data
   * @param userId User ID of updater
   * @returns Updated card
   */
  async updateCard(
    id: number,
    data: Partial<CardInput>,
    userId?: number
  ): Promise<MobileCard> {

    try {
      // Build dynamic update query
      const updates: string[] = [];
      const params: any[] = [];

      if (data.title !== undefined) {
        updates.push('title = ?');
        params.push(data.title);
      }

      if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description || null);
      }

      if (data.imageUrl !== undefined) {
        updates.push('image_url = ?');
        params.push(data.imageUrl || null);
      }

      if (data.redirectUrl !== undefined) {
        updates.push('redirect_url = ?');
        params.push(data.redirectUrl || null);
      }

      if (data.isFeatured !== undefined) {
        updates.push('is_featured = ?');
        params.push(data.isFeatured ? 1 : 0);
      }

      if (data.displayOrder !== undefined) {
        updates.push('display_order = ?');
        params.push(data.displayOrder);
      }

      if (data.isActive !== undefined) {
        updates.push('is_active = ?');
        params.push(data.isActive ? 1 : 0);
      }

      if (updates.length === 0) {
        // No updates provided
        const existing = await this.getCardById(id);
        if (!existing) {
          throw new Error('Kart bulunamadı');
        }
        return existing;
      }

      // Add updated_at
      updates.push('updated_at = NOW()');

      // Add ID for WHERE clause
      params.push(id);

      const query = `
        UPDATE mobile_cards
        SET ${updates.join(', ')}
        WHERE id = ?
          AND deleted_at IS NULL
      `;

      const [result] = await db.execute<ResultSetHeader>(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Kart bulunamadı veya güncellenemedi');
      }

      // Return the updated card
      const updated = await this.getCardById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated card');
      }

      return updated;
    } catch (error) {
      console.error('Error updating card:', error);
      throw error instanceof Error ? error : new Error('Failed to update card');
    }
  }

  /**
   * Delete a card (soft delete)
   *
   * @param id Card ID
   * @returns Success status
   */
  async deleteCard(id: number): Promise<boolean> {

    try {
      const query = `
        UPDATE mobile_cards
        SET deleted_at = NOW()
        WHERE id = ?
          AND deleted_at IS NULL
      `;

      const [result] = await db.execute<ResultSetHeader>(query, [id]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting card:', error);
      throw new Error('Failed to delete card');
    }
  }

  /**
   * Reorder cards by updating display_order
   *
   * @param cardIds Array of card IDs in new order
   * @returns Success status
   */
  async reorderCards(cardIds: number[]): Promise<void> {

    try {
      // Start transaction
      await db.beginTransaction();

      try {
        // Update each card's display_order
        for (let i = 0; i < cardIds.length; i++) {
          await db.execute(
            'UPDATE mobile_cards SET display_order = ? WHERE id = ?',
            [i + 1, cardIds[i]]
          );
        }

        // Commit transaction
        await db.commit();
      } catch (error) {
        // Rollback on error
        await db.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error reordering cards:', error);
      throw new Error('Failed to reorder cards');
    }
  }

  /**
   * Get featured cards
   * Returns only featured, active cards
   *
   * @param limit Maximum number of cards
   * @returns Array of featured cards
   */
  async getFeaturedCards(limit?: number): Promise<MobileCard[]> {

    try {
      let query = `
        SELECT
          id,
          title,
          description,
          image_url,
          redirect_url,
          is_featured,
          display_order,
          is_active,
          created_at,
          updated_at
        FROM mobile_cards
        WHERE is_active = 1
          AND is_featured = 1
          AND deleted_at IS NULL
        ORDER BY display_order ASC, created_at DESC
      `;

      const params: any[] = [];

      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
      }

      const [rows] = await db.execute<CardRow[]>(query, params);

      return rows.map(row => this.transformToMobileCard(row));
    } catch (error) {
      console.error('Error fetching featured cards:', error);
      throw new Error('Failed to retrieve featured cards');
    }
  }

  /**
   * Bulk update card active status
   *
   * @param cardIds Array of card IDs
   * @param isActive New active status
   * @returns Number of affected cards
   */
  async bulkUpdateActive(cardIds: number[], isActive: boolean): Promise<number> {

    if (cardIds.length === 0) {
      return 0;
    }

    try {
      const placeholders = cardIds.map(() => '?').join(',');
      const query = `
        UPDATE mobile_cards
        SET is_active = ?, updated_at = NOW()
        WHERE id IN (${placeholders})
          AND deleted_at IS NULL
      `;

      const params = [isActive ? 1 : 0, ...cardIds];
      const [result] = await db.execute<ResultSetHeader>(query, params);

      return result.affectedRows;
    } catch (error) {
      console.error('Error bulk updating card status:', error);
      throw new Error('Failed to update card status');
    }
  }

  /**
   * Bulk delete cards (soft delete)
   *
   * @param cardIds Array of card IDs
   * @returns Number of deleted cards
   */
  async bulkDeleteCards(cardIds: number[]): Promise<number> {

    if (cardIds.length === 0) {
      return 0;
    }

    try {
      const placeholders = cardIds.map(() => '?').join(',');
      const query = `
        UPDATE mobile_cards
        SET deleted_at = NOW()
        WHERE id IN (${placeholders})
          AND deleted_at IS NULL
      `;

      const [result] = await db.execute<ResultSetHeader>(query, cardIds);

      return result.affectedRows;
    } catch (error) {
      console.error('Error bulk deleting cards:', error);
      throw new Error('Failed to delete cards');
    }
  }

  /**
   * Transform database row to mobile card format
   * Applies URL fixing and field mapping
   *
   * @param row Database row
   * @returns Mobile card
   */
  private transformToMobileCard(row: CardRow): MobileCard {
    return fixMediaUrlsInObject({
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      imageUrl: row.image_url || undefined,
      redirectUrl: row.redirect_url || undefined,
      isFeatured: Boolean(row.is_featured),
      displayOrder: row.display_order,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString()
    });
  }
}

// Export singleton instance
const cardService = new CardService();
export default cardService;