/**
 * News Categories Database Operations
 * Handles CRUD operations for news categories with slug generation
 */

import { db } from './client';
import { RowDataPacket } from 'mysql2';
import { InsertResult, UpdateResult } from '@/types/database';

/**
 * News category entity interface
 */
export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  is_system: boolean;
  is_active: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * Create news category data interface
 */
export interface CreateNewsCategoryData {
  name: string;
  slug?: string; // Optional - will be generated if not provided
  is_system?: boolean;
  is_active?: boolean;
  created_by: number;
}

/**
 * Update news category data interface
 */
export interface UpdateNewsCategoryData {
  name?: string;
  slug?: string;
  is_active?: boolean;
}

/**
 * News category with additional computed fields
 */
export interface NewsCategoryWithStats extends NewsCategory {
  creator_name?: string;
  news_count?: number;
}

/**
 * Generate a URL-friendly slug from a string
 * Handles Turkish characters and special cases
 */
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // Replace Turkish characters
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    // Remove special characters except spaces and hyphens
    .replace(/[^\w\s-]/g, '')
    // Replace multiple spaces/hyphens with single hyphen
    .replace(/[\s-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate if a slug is unique for a category (excluding a specific ID if provided)
 */
async function isSlugUnique(slug: string, excludeId?: number): Promise<boolean> {
  const query = excludeId
    ? 'SELECT id FROM news_categories WHERE slug = ? AND id != ? AND deleted_at IS NULL'
    : 'SELECT id FROM news_categories WHERE slug = ? AND deleted_at IS NULL';

  const params = excludeId ? [slug, excludeId] : [slug];
  const result = await db.query<RowDataPacket>(query, params);

  return result.rows.length === 0;
}

/**
 * Generate a unique slug by appending numbers if necessary
 */
async function generateUniqueSlug(name: string, excludeId?: number): Promise<string> {
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugUnique(slug, excludeId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Get all news categories with optional statistics
 * Returns categories ordered by system categories first, then by creation date
 */
export async function getAllCategories(includeStats: boolean = false): Promise<NewsCategoryWithStats[]> {
  let query = `
    SELECT nc.*,
           u.name as creator_name
  `;

  if (includeStats) {
    query += `,
           COUNT(n.id) as news_count
    `;
  }

  query += `
    FROM news_categories nc
    LEFT JOIN users u ON nc.created_by = u.id
  `;

  if (includeStats) {
    query += `
    LEFT JOIN news n ON nc.id = n.category_id AND n.deleted_at IS NULL
    `;
  }

  query += `
    WHERE nc.deleted_at IS NULL
  `;

  if (includeStats) {
    query += `
    GROUP BY nc.id, u.name
    `;
  }

  query += `
    ORDER BY nc.is_system DESC, nc.created_at ASC
  `;

  const result = await db.query<RowDataPacket>(query);
  return result.rows as NewsCategoryWithStats[];
}

/**
 * Get active news categories only
 * Useful for frontend category selection
 */
export async function getActiveCategories(): Promise<NewsCategory[]> {
  const result = await db.query<RowDataPacket>(
    `SELECT nc.*
     FROM news_categories nc
     WHERE nc.deleted_at IS NULL AND nc.is_active = 1
     ORDER BY nc.is_system DESC, nc.name ASC`
  );

  return result.rows as NewsCategory[];
}

/**
 * Get news category by ID
 * Returns null if category doesn't exist or is deleted
 */
export async function getCategoryById(categoryId: number): Promise<NewsCategoryWithStats | null> {
  const result = await db.query<RowDataPacket>(
    `SELECT nc.*,
            u.name as creator_name
     FROM news_categories nc
     LEFT JOIN users u ON nc.created_by = u.id
     WHERE nc.id = ? AND nc.deleted_at IS NULL`,
    [categoryId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as NewsCategoryWithStats;
}

/**
 * Get news category by slug
 * Returns null if category doesn't exist or is deleted
 */
export async function getCategoryBySlug(slug: string): Promise<NewsCategory | null> {
  const result = await db.query<RowDataPacket>(
    `SELECT nc.*
     FROM news_categories nc
     WHERE nc.slug = ? AND nc.deleted_at IS NULL`,
    [slug]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as NewsCategory;
}

/**
 * Create a new news category
 * Automatically generates unique slug if not provided
 */
export async function createCategory(data: CreateNewsCategoryData): Promise<number> {
  // Generate slug if not provided
  const slug = data.slug || await generateUniqueSlug(data.name);

  // Validate slug uniqueness if provided
  if (data.slug && !(await isSlugUnique(data.slug))) {
    throw new Error(`Category slug '${data.slug}' already exists`);
  }

  const result: InsertResult = await db.insert(
    `INSERT INTO news_categories (name, slug, is_system, is_active, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.name,
      slug,
      data.is_system ? 1 : 0,
      data.is_active !== false ? 1 : 0, // Default to active if not specified
      data.created_by
    ]
  );

  return result.insertId;
}

/**
 * Update an existing news category
 * Automatically generates new slug if name is updated and slug is not provided
 */
export async function updateCategory(categoryId: number, data: UpdateNewsCategoryData): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  // If name is being updated and no slug provided, generate new slug
  if (data.name !== undefined && data.slug === undefined) {
    data.slug = await generateUniqueSlug(data.name, categoryId);
  }

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }

  if (data.slug !== undefined) {
    // Validate slug uniqueness
    if (!(await isSlugUnique(data.slug, categoryId))) {
      throw new Error(`Category slug '${data.slug}' already exists`);
    }
    fields.push('slug = ?');
    values.push(data.slug);
  }

  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  // Add updated timestamp
  fields.push('updated_at = NOW()');
  values.push(categoryId);

  const result: UpdateResult = await db.update(
    `UPDATE news_categories SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );

  if (result.affectedRows === 0) {
    throw new Error(`Category with ID ${categoryId} not found or already deleted`);
  }
}

/**
 * Soft delete a news category
 * Sets deleted_at timestamp instead of physically removing the record
 */
export async function deleteCategory(categoryId: number): Promise<void> {
  // Check if category exists and is not system category
  const category = await getCategoryById(categoryId);
  if (!category) {
    throw new Error(`Category with ID ${categoryId} not found`);
  }

  if (category.is_system) {
    throw new Error('System categories cannot be deleted');
  }

  // Check if category has associated news articles
  const newsCountResult = await db.query<RowDataPacket>(
    'SELECT COUNT(*) as count FROM news WHERE category_id = ? AND deleted_at IS NULL',
    [categoryId]
  );

  if (newsCountResult.rows[0].count > 0) {
    throw new Error('Cannot delete category that has associated news articles');
  }

  const result: UpdateResult = await db.update(
    `UPDATE news_categories SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    [categoryId]
  );

  if (result.affectedRows === 0) {
    throw new Error(`Category with ID ${categoryId} not found or already deleted`);
  }
}

/**
 * Check if a category slug exists (for validation)
 */
export async function categorySlugExists(slug: string, excludeId?: number): Promise<boolean> {
  return !(await isSlugUnique(slug, excludeId));
}

/**
 * Get category statistics
 * Returns count of total, active, and system categories
 */
export async function getCategoryStats(): Promise<{
  total: number;
  active: number;
  system: number;
  custom: number;
}> {
  const result = await db.query<RowDataPacket>(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN is_system = 1 THEN 1 ELSE 0 END) as system,
      SUM(CASE WHEN is_system = 0 THEN 1 ELSE 0 END) as custom
    FROM news_categories
    WHERE deleted_at IS NULL
  `);

  return result.rows[0] as any;
}

/**
 * Search categories by name
 * Returns categories that match the search term in their name
 */
export async function searchCategories(searchTerm: string, activeOnly: boolean = false): Promise<NewsCategory[]> {
  const conditions = ['nc.deleted_at IS NULL', 'nc.name LIKE ?'];
  const params = [`%${searchTerm}%`];

  if (activeOnly) {
    conditions.push('nc.is_active = 1');
  }

  const result = await db.query<RowDataPacket>(
    `SELECT nc.*
     FROM news_categories nc
     WHERE ${conditions.join(' AND ')}
     ORDER BY nc.is_system DESC, nc.name ASC`,
    params
  );

  return result.rows as NewsCategory[];
}