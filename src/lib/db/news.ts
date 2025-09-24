/**
 * News database operations
 * Handles CRUD operations for news articles and categories
 */

import { db } from './client';
import { RowDataPacket } from 'mysql2';

// Pagination and filtering interfaces
export interface PaginationOptions {
  offset?: number;
  limit?: number;
}

export interface NewsFilters {
  search?: string;
  category_id?: number;
  is_featured?: boolean;
  is_breaking?: boolean;
  is_hot?: boolean;
  is_active?: boolean;
  created_by?: number;
  start_date?: string;
  end_date?: string;
}

export interface PaginatedNewsResult {
  data: any[];
  total: number;
  offset: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NewsData {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  featured_image?: string;
  category_id?: number;
  is_featured?: boolean;
  is_breaking?: boolean;
  is_hot?: boolean;
  is_active?: boolean;
  published_at?: string;
  created_by: number;
}

export interface NewsCategoryData {
  name: string;
  slug: string;
  is_system?: boolean;
  is_active?: boolean;
  created_by: number;
}

/**
 * Get all news for admin with pagination and filtering support
 */
export async function getAllNews(
  pagination: PaginationOptions = {},
  filters: NewsFilters = {}
): Promise<PaginatedNewsResult> {
  const { offset = 0, limit = 20 } = pagination;
  const {
    search,
    category_id,
    is_featured,
    is_breaking,
    is_hot,
    is_active,
    created_by,
    start_date,
    end_date
  } = filters;

  // Build WHERE conditions
  const conditions: string[] = ['n.deleted_at IS NULL'];
  const params: any[] = [];

  if (search) {
    conditions.push('(n.title LIKE ? OR n.summary LIKE ? OR n.content LIKE ?)');
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (category_id !== undefined) {
    conditions.push('n.category_id = ?');
    params.push(category_id);
  }

  if (is_featured !== undefined) {
    conditions.push('n.is_featured = ?');
    params.push(is_featured ? 1 : 0);
  }

  if (is_breaking !== undefined) {
    conditions.push('n.is_breaking = ?');
    params.push(is_breaking ? 1 : 0);
  }

  if (is_hot !== undefined) {
    conditions.push('n.is_hot = ?');
    params.push(is_hot ? 1 : 0);
  }

  if (is_active !== undefined) {
    conditions.push('n.is_active = ?');
    params.push(is_active ? 1 : 0);
  }

  if (created_by !== undefined) {
    conditions.push('n.created_by = ?');
    params.push(created_by);
  }

  if (start_date) {
    conditions.push('n.created_at >= ?');
    params.push(start_date);
  }

  if (end_date) {
    conditions.push('n.created_at <= ?');
    params.push(end_date);
  }

  const whereClause = conditions.join(' AND ');

  // Get total count for pagination
  const countResult = await db.query<RowDataPacket>(
    `SELECT COUNT(*) as total
     FROM news n
     LEFT JOIN users u ON n.created_by = u.id
     LEFT JOIN news_categories nc ON n.category_id = nc.id
     WHERE ${whereClause}`,
    params
  );
  const total = countResult.rows[0].total;

  // Get paginated data
  const dataParams = [...params, limit, offset];
  const result = await db.query<RowDataPacket>(
    `SELECT n.*,
            u.name as creator_name,
            nc.name as category_name
     FROM news n
     LEFT JOIN users u ON n.created_by = u.id
     LEFT JOIN news_categories nc ON n.category_id = nc.id
     WHERE ${whereClause}
     ORDER BY n.created_at DESC
     LIMIT ? OFFSET ?`,
    dataParams
  );

  return {
    data: result.rows,
    total,
    offset,
    limit,
    hasNext: offset + limit < total,
    hasPrev: offset > 0
  };
}

/**
 * Get all news (simple version for backward compatibility)
 * Returns just the data array without pagination metadata
 */
export async function getAllNewsSimple(
  pagination: PaginationOptions = {},
  filters: NewsFilters = {}
): Promise<any[]> {
  const result = await getAllNews(pagination, filters);
  return result.data;
}

/**
 * Search news with full-text search capabilities
 */
export async function searchNews(
  searchTerm: string,
  pagination: PaginationOptions = {},
  additionalFilters: Omit<NewsFilters, 'search'> = {}
): Promise<PaginatedNewsResult> {
  if (!searchTerm.trim()) {
    return getAllNews(pagination, additionalFilters);
  }

  const filters: NewsFilters = {
    ...additionalFilters,
    search: searchTerm.trim()
  };

  return getAllNews(pagination, filters);
}

/**
 * Get news by status (featured, breaking, hot)
 */
export async function getNewsByStatus(
  status: 'featured' | 'breaking' | 'hot',
  pagination: PaginationOptions = {}
): Promise<PaginatedNewsResult> {
  const filters: NewsFilters = {
    is_active: true
  };

  switch (status) {
    case 'featured':
      filters.is_featured = true;
      break;
    case 'breaking':
      filters.is_breaking = true;
      break;
    case 'hot':
      filters.is_hot = true;
      break;
  }

  return getAllNews(pagination, filters);
}

/**
 * Get news by category with pagination
 */
export async function getNewsByCategory(
  categoryId: number,
  pagination: PaginationOptions = {}
): Promise<PaginatedNewsResult> {
  const filters: NewsFilters = {
    category_id: categoryId,
    is_active: true
  };

  return getAllNews(pagination, filters);
}

/**
 * Get news statistics for dashboard
 */
export async function getNewsStats(): Promise<{
  total: number;
  active: number;
  featured: number;
  breaking: number;
  hot: number;
  drafts: number;
}> {
  const result = await db.query<RowDataPacket>(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured,
      SUM(CASE WHEN is_breaking = 1 THEN 1 ELSE 0 END) as breaking,
      SUM(CASE WHEN is_hot = 1 THEN 1 ELSE 0 END) as hot,
      SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as drafts
    FROM news
    WHERE deleted_at IS NULL
  `);

  return result.rows[0] as any;
}

/**
 * Get news by ID
 */
export async function getNewsById(newsId: number) {
  const result = await db.query<RowDataPacket>(
    `SELECT n.*,
            u.name as creator_name,
            nc.name as category_name
     FROM news n
     LEFT JOIN users u ON n.created_by = u.id
     LEFT JOIN news_categories nc ON n.category_id = nc.id
     WHERE n.id = ? AND n.deleted_at IS NULL`,
    [newsId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Create a new news article
 */
export async function createNews(data: NewsData) {
  const result = await db.insert(
    `INSERT INTO news (
      title, slug, summary, content, featured_image, category_id,
      is_featured, is_breaking, is_hot, is_active, published_at, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.slug,
      data.summary || null,
      data.content,
      data.featured_image || null,
      data.category_id || null,
      data.is_featured ? 1 : 0,
      data.is_breaking ? 1 : 0,
      data.is_hot ? 1 : 0,
      data.is_active !== false ? 1 : 0,
      data.published_at || null,
      data.created_by
    ]
  );
  return result.insertId;
}

/**
 * Update an existing news article
 */
export async function updateNews(newsId: number, data: Partial<NewsData>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.slug !== undefined) {
    fields.push('slug = ?');
    values.push(data.slug);
  }
  if (data.summary !== undefined) {
    fields.push('summary = ?');
    values.push(data.summary);
  }
  if (data.content !== undefined) {
    fields.push('content = ?');
    values.push(data.content);
  }
  if (data.featured_image !== undefined) {
    fields.push('featured_image = ?');
    values.push(data.featured_image);
  }
  if (data.category_id !== undefined) {
    fields.push('category_id = ?');
    values.push(data.category_id);
  }
  if (data.is_featured !== undefined) {
    fields.push('is_featured = ?');
    values.push(data.is_featured ? 1 : 0);
  }
  if (data.is_breaking !== undefined) {
    fields.push('is_breaking = ?');
    values.push(data.is_breaking ? 1 : 0);
  }
  if (data.is_hot !== undefined) {
    fields.push('is_hot = ?');
    values.push(data.is_hot ? 1 : 0);
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }
  if (data.published_at !== undefined) {
    fields.push('published_at = ?');
    values.push(data.published_at);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push('updated_at = NOW()');
  values.push(newsId);

  await db.update(
    `UPDATE news SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
}

/**
 * Soft delete a news article
 */
export async function deleteNews(newsId: number) {
  await db.update(
    `UPDATE news SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    [newsId]
  );
}

/**
 * Get all news categories for admin
 */
export async function getAllNewsCategories() {
  const result = await db.query<RowDataPacket>(
    `SELECT nc.*,
            u.name as creator_name,
            COUNT(n.id) as news_count
     FROM news_categories nc
     LEFT JOIN users u ON nc.created_by = u.id
     LEFT JOIN news n ON nc.id = n.category_id AND n.deleted_at IS NULL
     WHERE nc.deleted_at IS NULL
     GROUP BY nc.id
     ORDER BY nc.is_system DESC, nc.created_at ASC`
  );
  return result.rows;
}

/**
 * Get news category by ID
 */
export async function getNewsCategoryById(categoryId: number) {
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

  return result.rows[0];
}

/**
 * Create a new news category
 */
export async function createNewsCategory(data: NewsCategoryData) {
  const result = await db.insert(
    `INSERT INTO news_categories (name, slug, is_system, is_active, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.name,
      data.slug,
      data.is_system ? 1 : 0,
      data.is_active !== false ? 1 : 0,
      data.created_by
    ]
  );
  return result.insertId;
}

/**
 * Update an existing news category
 */
export async function updateNewsCategory(categoryId: number, data: Partial<NewsCategoryData>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.slug !== undefined) {
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

  fields.push('updated_at = NOW()');
  values.push(categoryId);

  await db.update(
    `UPDATE news_categories SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
}

/**
 * Soft delete a news category
 */
export async function deleteNewsCategory(categoryId: number) {
  await db.update(
    `UPDATE news_categories SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    [categoryId]
  );
}

/**
 * Check if news slug exists (for uniqueness validation)
 */
export async function newsSlugExists(slug: string, excludeId?: number): Promise<boolean> {
  const query = excludeId
    ? 'SELECT id FROM news WHERE slug = ? AND id != ? AND deleted_at IS NULL'
    : 'SELECT id FROM news WHERE slug = ? AND deleted_at IS NULL';

  const params = excludeId ? [slug, excludeId] : [slug];

  const result = await db.query<RowDataPacket>(query, params);
  return result.rows.length > 0;
}

/**
 * Check if news category slug exists (for uniqueness validation)
 */
export async function newsCategorySlugExists(slug: string, excludeId?: number): Promise<boolean> {
  const query = excludeId
    ? 'SELECT id FROM news_categories WHERE slug = ? AND id != ? AND deleted_at IS NULL'
    : 'SELECT id FROM news_categories WHERE slug = ? AND deleted_at IS NULL';

  const params = excludeId ? [slug, excludeId] : [slug];

  const result = await db.query<RowDataPacket>(query, params);
  return result.rows.length > 0;
}

/**
 * Generate a unique slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get news article by slug
 */
export async function getNewsBySlug(slug: string): Promise<any | null> {
  const query = `
    SELECT
      n.*,
      c.name AS category_name,
      u.name AS creator_name
    FROM news n
    LEFT JOIN categories c ON n.category_id = c.id
    LEFT JOIN users u ON n.created_by = u.id
    WHERE n.slug = ? AND n.deleted_at IS NULL
    LIMIT 1
  `;

  const result = await db.query<RowDataPacket>(query, [slug]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Increment news view count
 */
export async function incrementNewsViews(newsId: number): Promise<void> {
  const query = `
    UPDATE news
    SET views = COALESCE(views, 0) + 1
    WHERE id = ? AND deleted_at IS NULL
  `;

  await db.update(query, [newsId]);
}