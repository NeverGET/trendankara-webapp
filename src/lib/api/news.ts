import { NewsArticle, NewsListResponse, NewsCategory } from '@/types/news';

const API_BASE = '/api/news';

export async function getFeaturedNews(): Promise<NewsArticle[]> {
  try {
    const response = await fetch(`${API_BASE}?featured=true&limit=5`);
    if (!response.ok) {
      throw new Error(`Failed to fetch featured news: ${response.statusText}`);
    }
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching featured news:', error);
    return [];
  }
}

export async function getNews(
  page: number = 1,
  limit: number = 9,
  category?: NewsCategory
): Promise<NewsListResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (category) {
      params.append('category', category);
    }

    const response = await fetch(`${API_BASE}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching news:', error);
    return {
      articles: [],
      pagination: {
        page: 1,
        limit: 9,
        total: 0,
        hasNext: false
      }
    };
  }
}

export async function getNewsArticle(id: number): Promise<NewsArticle | null> {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch article ${id}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.article;
  } catch (error) {
    console.error(`Error fetching article ${id}:`, error);
    return null;
  }
}

export async function getNewsByCategory(
  category: NewsCategory,
  page: number = 1,
  limit: number = 9
): Promise<NewsListResponse> {
  return getNews(page, limit, category);
}

export async function searchNews(query: string): Promise<NewsArticle[]> {
  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Failed to search news: ${response.statusText}`);
    }
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error searching news:', error);
    return [];
  }
}

export async function incrementViewCount(id: number): Promise<void> {
  try {
    await fetch(`${API_BASE}/${id}/view`, {
      method: 'POST'
    });
  } catch (error) {
    console.error(`Error incrementing view count for article ${id}:`, error);
  }
}