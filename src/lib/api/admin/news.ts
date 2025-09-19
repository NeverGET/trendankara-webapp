import { NewsArticle } from '@/types/news';

const API_BASE = '/api/admin/news';

export interface AdminNewsListResponse {
  success: boolean;
  data: NewsArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: any;
  stats?: {
    total_count: number;
    published_count: number;
    draft_count: number;
    archived_count: number;
    views_today: number;
  };
}

export interface AdminNewsResponse {
  success: boolean;
  data: NewsArticle;
  message?: string;
}

export interface NewsFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  featured_image?: File | string;
  featured: boolean;
  breaking: boolean;
  hot: boolean;
  active: boolean;
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

export async function getAdminNews(
  page: number = 1,
  limit: number = 20,
  filters?: NewsFilters,
  includeStats: boolean = false
): Promise<AdminNewsListResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      include_stats: includeStats.toString()
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin news: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching admin news:', error);
    return {
      success: false,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }
}

export async function getAdminNewsById(id: number): Promise<AdminNewsResponse | null> {
  try {
    const response = await fetch(`${API_BASE}?id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch news article ${id}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching news article ${id}:`, error);
    return null;
  }
}

export async function createAdminNews(data: NewsFormData): Promise<AdminNewsResponse> {
  try {
    const formData = new FormData();

    // Map form data to API format
    formData.append('title', data.title);
    formData.append('slug', data.slug);
    formData.append('summary', data.summary);
    formData.append('content', data.content);
    formData.append('is_featured', data.featured.toString());
    formData.append('is_breaking', data.breaking.toString());
    formData.append('is_hot', data.hot.toString());
    formData.append('is_active', data.active.toString());

    // Handle image upload
    if (data.featured_image instanceof File) {
      formData.append('featured_image', data.featured_image);
    } else if (typeof data.featured_image === 'string') {
      formData.append('featured_image', data.featured_image);
    }

    const response = await fetch(API_BASE, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create news: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating news:', error);
    throw error;
  }
}

export async function updateAdminNews(id: number, data: Partial<NewsFormData>): Promise<AdminNewsResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    // Map form data to API format
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'featured_image' && value instanceof File) {
          formData.append('featured_image', value);
        } else if (key === 'featured') {
          formData.append('is_featured', value.toString());
        } else if (key === 'breaking') {
          formData.append('is_breaking', value.toString());
        } else if (key === 'hot') {
          formData.append('is_hot', value.toString());
        } else if (key === 'active') {
          formData.append('is_active', value.toString());
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    const response = await fetch(API_BASE, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update news: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating news:', error);
    throw error;
  }
}

export async function deleteAdminNews(id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE}?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete news: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting news:', error);
    throw error;
  }
}

export async function searchAdminNews(query: string): Promise<NewsArticle[]> {
  try {
    const response = await getAdminNews(1, 50, { search: query });
    return response.data || [];
  } catch (error) {
    console.error('Error searching admin news:', error);
    return [];
  }
}