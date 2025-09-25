/**
 * Content page database functions
 * CRUD operations for mobile content pages
 */

import { db } from './client';
import { RowDataPacket } from 'mysql2';

// Component types for mobile content
export type ComponentType =
  | 'hero'
  | 'carousel'
  | 'text'
  | 'image'
  | 'video'
  | 'audio_player'
  | 'poll'
  | 'news_list'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'social_links'
  | 'contact_form';

export interface ComponentData {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  order: number;
}

export interface ContentPageData {
  title: string;
  slug: string;
  description?: string;
  page_type?: 'sponsorship' | 'promotion' | 'info' | 'custom';
  components?: ComponentData[] | any;
  content_json?: ComponentData[] | any;
  meta?: any;
  is_active?: boolean;
  is_published?: boolean;
  is_homepage?: boolean;
  mobile_only?: boolean;
  start_date?: Date | string;
  end_date?: Date | string;
  created_by: number;
}

export interface PaginationOptions {
  offset?: number;
  limit?: number;
}

export interface ContentPageFilters {
  search?: string;
  is_published?: boolean;
  is_active?: boolean;
  is_homepage?: boolean;
  mobile_only?: boolean;
  page_type?: string;
  created_by?: number;
}

export interface PaginatedContentPageResult {
  data: any[];
  total: number;
  offset: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Get all content pages with pagination and filtering
 */
export async function getAllContentPages(
  pagination: PaginationOptions = {},
  filters: ContentPageFilters = {}
): Promise<PaginatedContentPageResult> {
  const { offset = 0, limit = 20 } = pagination;
  const {
    search,
    is_published,
    is_active,
    is_homepage,
    mobile_only,
    page_type,
    created_by
  } = filters;

  // Build WHERE conditions
  const conditions: string[] = ['cp.deleted_at IS NULL'];
  const params: any[] = [];

  if (search) {
    conditions.push('(cp.title LIKE ? OR cp.slug LIKE ?)');
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  if (is_published !== undefined) {
    conditions.push('cp.is_published = ?');
    params.push(is_published ? 1 : 0);
  }

  if (is_active !== undefined) {
    conditions.push('cp.is_active = ?');
    params.push(is_active ? 1 : 0);
  }

  if (is_homepage !== undefined) {
    conditions.push('cp.is_homepage = ?');
    params.push(is_homepage ? 1 : 0);
  }

  if (mobile_only !== undefined) {
    conditions.push('cp.mobile_only = ?');
    params.push(mobile_only ? 1 : 0);
  }

  if (page_type !== undefined) {
    conditions.push('cp.page_type = ?');
    params.push(page_type);
  }

  if (created_by !== undefined) {
    conditions.push('cp.created_by = ?');
    params.push(created_by);
  }

  const whereClause = conditions.join(' AND ');

  // Get total count for pagination
  const countResult = await db.query<RowDataPacket>(
    `SELECT COUNT(*) as total
     FROM content_pages cp
     WHERE ${whereClause}`,
    params
  );
  const total = countResult.rows[0].total;

  // Get paginated data
  const dataParams = [...params, limit, offset];
  const result = await db.query<RowDataPacket>(
    `SELECT cp.*,
            u.name as creator_name
     FROM content_pages cp
     LEFT JOIN users u ON cp.created_by = u.id
     WHERE ${whereClause}
     ORDER BY cp.created_at DESC
     LIMIT ? OFFSET ?`,
    dataParams
  );

  // Parse JSON content for each page
  const pages = result.rows.map(row => ({
    ...row,
    content_json: typeof row.content_json === 'string' ? JSON.parse(row.content_json) : row.content_json
  }));

  return {
    data: pages,
    total,
    offset,
    limit,
    hasNext: offset + limit < total,
    hasPrev: offset > 0
  };
}

/**
 * Get content page by ID
 */
export async function getContentPageById(pageId: number) {
  const result = await db.query<RowDataPacket>(
    `SELECT cp.*,
            u.name as creator_name
     FROM content_pages cp
     LEFT JOIN users u ON cp.created_by = u.id
     WHERE cp.id = ? AND cp.deleted_at IS NULL`,
    [pageId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const page = result.rows[0];
  return {
    ...page,
    content_json: typeof page.content_json === 'string' ? JSON.parse(page.content_json) : page.content_json
  };
}

/**
 * Get content page by slug
 */
export async function getContentPageBySlug(slug: string) {
  const result = await db.query<RowDataPacket>(
    `SELECT cp.*,
            u.name as creator_name
     FROM content_pages cp
     LEFT JOIN users u ON cp.created_by = u.id
     WHERE cp.slug = ? AND cp.deleted_at IS NULL`,
    [slug]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const page = result.rows[0];
  return {
    ...page,
    content_json: typeof page.content_json === 'string' ? JSON.parse(page.content_json) : page.content_json
  };
}

/**
 * Create a new content page
 */
export async function createContentPage(data: ContentPageData) {
  // Use components or content_json based on what's provided
  const contentJson = data.components || data.content_json;

  const result = await db.insert(
    `INSERT INTO content_pages (
      title, slug, page_type, content_json, is_active,
      is_published, is_homepage, mobile_only, start_date, end_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.slug,
      data.page_type || 'custom',
      JSON.stringify(contentJson),
      data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
      data.is_published ? 1 : 0,
      data.is_homepage ? 1 : 0,
      data.mobile_only !== undefined ? (data.mobile_only ? 1 : 0) : 1,
      data.start_date || null,
      data.end_date || null,
      data.created_by
    ]
  );
  return result.insertId;
}

/**
 * Update an existing content page
 */
export async function updateContentPage(pageId: number, data: Partial<ContentPageData>) {
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
  if (data.page_type !== undefined) {
    fields.push('page_type = ?');
    values.push(data.page_type);
  }
  if (data.content_json !== undefined) {
    fields.push('content_json = ?');
    values.push(JSON.stringify(data.content_json));
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }
  if (data.is_published !== undefined) {
    fields.push('is_published = ?');
    values.push(data.is_published ? 1 : 0);
  }
  if (data.mobile_only !== undefined) {
    fields.push('mobile_only = ?');
    values.push(data.mobile_only ? 1 : 0);
  }
  if (data.start_date !== undefined) {
    fields.push('start_date = ?');
    values.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    fields.push('end_date = ?');
    values.push(data.end_date);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push('updated_at = NOW()');
  values.push(pageId);

  await db.update(
    `UPDATE content_pages SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values
  );
}

/**
 * Soft delete a content page
 */
export async function deleteContentPage(pageId: number) {
  await db.update(
    `UPDATE content_pages SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    [pageId]
  );
}

/**
 * Duplicate a content page
 */
export async function duplicateContentPage(pageId: number, newTitle: string, userId: number) {
  const original = await getContentPageById(pageId);
  if (!original) {
    throw new Error('Original page not found');
  }

  const newSlug = generateSlug(newTitle);
  const newData: ContentPageData = {
    title: newTitle,
    slug: newSlug,
    page_type: (original as any).page_type || 'custom',
    content_json: (original as any).content_json,
    is_active: true,
    is_published: false, // Start as unpublished
    mobile_only: (original as any).mobile_only,
    created_by: userId
  };

  return createContentPage(newData);
}

/**
 * Publish/unpublish a content page
 */
export async function setContentPagePublishStatus(pageId: number, isPublished: boolean) {
  await db.update(
    `UPDATE content_pages SET is_published = ?, updated_at = NOW()
     WHERE id = ? AND deleted_at IS NULL`,
    [isPublished ? 1 : 0, pageId]
  );
}

/**
 * Set a content page as the homepage
 * This will unset any existing homepage and set the new one
 */
export async function setAsHomepage(pageId: number) {
  // First, unset any existing homepage
  await db.update(
    `UPDATE content_pages SET is_homepage = 0, updated_at = NOW()
     WHERE is_homepage = 1 AND deleted_at IS NULL`
  );

  // Then set the new homepage
  await db.update(
    `UPDATE content_pages SET is_homepage = 1, updated_at = NOW()
     WHERE id = ? AND deleted_at IS NULL`,
    [pageId]
  );
}

/**
 * Set a page as active/inactive
 */
export async function setContentPageActiveStatus(pageId: number, isActive: boolean) {
  await db.update(
    `UPDATE content_pages SET is_active = ?, updated_at = NOW()
     WHERE id = ? AND deleted_at IS NULL`,
    [isActive ? 1 : 0, pageId]
  );
}

/**
 * Get published pages for mobile API
 */
export async function getPublishedPages() {
  const result = await db.query<RowDataPacket>(
    `SELECT id, title, slug, page_type, content_json, mobile_only, updated_at
     FROM content_pages
     WHERE is_published = 1 AND deleted_at IS NULL
     ORDER BY created_at DESC`
  );

  return result.rows.map(row => ({
    ...row,
    content_json: typeof row.content_json === 'string' ? JSON.parse(row.content_json) : row.content_json
  }));
}

/**
 * Get homepage
 */
export async function getHomepage() {
  const result = await db.query<RowDataPacket>(
    `SELECT cp.*
     FROM content_pages cp
     WHERE cp.is_published = 1 AND cp.is_active = 1 AND cp.deleted_at IS NULL
     LIMIT 1`
  );

  if (result.rows.length === 0) {
    return null;
  }

  const page = result.rows[0];
  return {
    ...page,
    content_json: typeof page.content_json === 'string' ? JSON.parse(page.content_json) : page.content_json
  };
}

/**
 * Track page view
 */
export async function trackPageView(pageId: number, viewData: {
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
}) {
  await db.insert(
    `INSERT INTO content_page_views (page_id, ip_address, user_agent, referrer)
     VALUES (?, ?, ?, ?)`,
    [
      pageId,
      viewData.ip_address || null,
      viewData.user_agent || null,
      viewData.referrer || null
    ]
  );
}

/**
 * Get page view statistics
 */
export async function getPageViewStats(pageId: number) {
  const result = await db.query<RowDataPacket>(
    `SELECT
      COUNT(*) as total_views,
      COUNT(DISTINCT ip_address) as unique_views,
      DATE(created_at) as date,
      COUNT(*) as daily_views
     FROM content_page_views
     WHERE page_id = ?
     GROUP BY DATE(created_at)
     ORDER BY date DESC
     LIMIT 30`,
    [pageId]
  );

  return result.rows;
}

/**
 * Check if slug exists
 */
export async function contentPageSlugExists(slug: string, excludeId?: number): Promise<boolean> {
  const query = excludeId
    ? 'SELECT id FROM content_pages WHERE slug = ? AND id != ? AND deleted_at IS NULL'
    : 'SELECT id FROM content_pages WHERE slug = ? AND deleted_at IS NULL';

  const params = excludeId ? [slug, excludeId] : [slug];

  const result = await db.query<RowDataPacket>(query, params);
  return result.rows.length > 0;
}

/**
 * Generate a unique slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate component structure
 */
export function validateComponents(components: ComponentData[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(components)) {
    errors.push('Components must be an array');
    return { valid: false, errors };
  }

  const validTypes = [
    'hero', 'carousel', 'text', 'image', 'video',
    'audio_player', 'poll', 'news_list', 'button',
    'divider', 'spacer', 'social_links', 'contact_form'
  ];

  components.forEach((component, index) => {
    if (!component.id) {
      errors.push(`Component at index ${index} is missing an ID`);
    }
    if (!component.type) {
      errors.push(`Component at index ${index} is missing a type`);
    } else if (!validTypes.includes(component.type)) {
      errors.push(`Component at index ${index} has invalid type: ${component.type}`);
    }
    if (component.order === undefined) {
      errors.push(`Component at index ${index} is missing an order`);
    }
    if (!component.props || typeof component.props !== 'object') {
      errors.push(`Component at index ${index} has invalid props`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}