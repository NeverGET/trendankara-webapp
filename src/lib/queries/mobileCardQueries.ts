/**
 * Mobile Card Database Queries
 * Centralized query functions for mobile cards
 * Requirements: 2.1, 2.2, 2.3 - Card management queries
 */

import { db } from '@/lib/db/client';
import type { MobileCard, CardInput } from '@/types/mobile';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class MobileCardQueries {
  /**
   * Get all active cards ordered by featured and display order
   */
  static async getAllActive(): Promise<MobileCard[]> {
    const query = `
      SELECT 
        id,
        title,
        description,
        image_url as imageUrl,
        redirect_url as redirectUrl,
        is_featured as isFeatured,
        display_order as displayOrder,
        is_active as isActive
      FROM mobile_cards
      WHERE is_active = TRUE AND deleted_at IS NULL
      ORDER BY is_featured DESC, display_order ASC
    `;

    const { rows } = await db.query<RowDataPacket>(query);
    return rows as MobileCard[];
  }

  /**
   * Get cards by type (featured or normal)
   */
  static async getByType(isFeatured: boolean): Promise<MobileCard[]> {
    const query = `
      SELECT 
        id,
        title,
        description,
        image_url as imageUrl,
        redirect_url as redirectUrl,
        is_featured as isFeatured,
        display_order as displayOrder,
        is_active as isActive
      FROM mobile_cards
      WHERE is_active = TRUE 
        AND deleted_at IS NULL
        AND is_featured = ?
      ORDER BY display_order ASC
    `;

    const { rows } = await db.query<RowDataPacket>(query, [isFeatured]);
    return rows as MobileCard[];
  }

  /**
   * Get card by ID
   */
  static async getById(id: number): Promise<MobileCard | null> {
    const query = `
      SELECT 
        id,
        title,
        description,
        image_url as imageUrl,
        redirect_url as redirectUrl,
        is_featured as isFeatured,
        display_order as displayOrder,
        is_active as isActive
      FROM mobile_cards
      WHERE id = ? AND deleted_at IS NULL
    `;

    const { rows } = await db.query<RowDataPacket>(query, [id]);
    return rows[0] as MobileCard || null;
  }

  /**
   * Create new card
   */
  static async create(card: CardInput, userId: number): Promise<number> {
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

    const result = await db.insert(query, [
      card.title,
      card.description || null,
      card.imageUrl || null,
      card.redirectUrl || null,
      card.isFeatured || false,
      card.displayOrder || 0,
      card.isActive !== false,
      userId
    ]);

    return result.insertId;
  }

  /**
   * Update existing card
   */
  static async update(id: number, card: Partial<CardInput>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (card.title !== undefined) {
      fields.push('title = ?');
      values.push(card.title);
    }
    if (card.description !== undefined) {
      fields.push('description = ?');
      values.push(card.description);
    }
    if (card.imageUrl !== undefined) {
      fields.push('image_url = ?');
      values.push(card.imageUrl);
    }
    if (card.redirectUrl !== undefined) {
      fields.push('redirect_url = ?');
      values.push(card.redirectUrl);
    }
    if (card.isFeatured !== undefined) {
      fields.push('is_featured = ?');
      values.push(card.isFeatured);
    }
    if (card.displayOrder !== undefined) {
      fields.push('display_order = ?');
      values.push(card.displayOrder);
    }
    if (card.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(card.isActive);
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(id);
    const query = `
      UPDATE mobile_cards
      SET ${fields.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
    `;

    const result = await db.update(query, values);
    return result.affectedRows > 0;
  }

  /**
   * Soft delete card
   */
  static async softDelete(id: number): Promise<boolean> {
    const query = `
      UPDATE mobile_cards
      SET deleted_at = CURRENT_TIMESTAMP, is_active = FALSE
      WHERE id = ? AND deleted_at IS NULL
    `;

    const result = await db.update(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Reorder cards
   */
  static async reorder(orders: { id: number; order: number }[]): Promise<boolean> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      for (const item of orders) {
        await connection.execute(
          'UPDATE mobile_cards SET display_order = ? WHERE id = ? AND deleted_at IS NULL',
          [item.order, item.id]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get max display order for type
   */
  static async getMaxDisplayOrder(isFeatured: boolean): Promise<number> {
    const query = `
      SELECT MAX(display_order) as maxOrder
      FROM mobile_cards
      WHERE is_featured = ? AND deleted_at IS NULL
    `;

    const { rows } = await db.query<RowDataPacket>(query, [isFeatured]);
    return rows[0]?.maxOrder || 0;
  }

  /**
   * Count active cards by type
   */
  static async countByType(isFeatured?: boolean): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM mobile_cards
      WHERE is_active = TRUE AND deleted_at IS NULL
    `;
    const params: any[] = [];

    if (isFeatured !== undefined) {
      query += ' AND is_featured = ?';
      params.push(isFeatured);
    }

    const { rows } = await db.query<RowDataPacket>(query, params);
    return rows[0]?.count || 0;
  }
}