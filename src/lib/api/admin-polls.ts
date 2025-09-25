/**
 * Admin Polls API Service
 * Client-side API functions for poll CRUD operations
 */

interface PollItem {
  id?: number;
  title: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
}

interface PollFormData {
  title: string;
  description?: string;
  poll_type?: 'weekly' | 'monthly' | 'custom';
  start_date: string;
  end_date: string;
  is_active?: boolean;
  show_on_homepage?: boolean;
  show_results?: 'never' | 'after_voting' | 'always';
  items: PollItem[];
}

interface PollResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

interface PollStatistics {
  totalPolls: number;
  activePolls: number;
  scheduledPolls: number;
  endedPolls: number;
  draftPolls: number;
  totalVotes: number;
  uniqueVoters: number;
  avgParticipation: number;
  totalResponses: number;
  growthRate: number;
  popularPoll?: {
    id: number;
    title: string;
    votes: number;
  };
}

/**
 * Create a new poll with items atomically
 */
export async function createPollWithItems(pollData: PollFormData): Promise<PollResponse> {
  try {
    // Validate required fields
    if (!pollData.title?.trim()) {
      throw new Error('Anket başlığı gereklidir');
    }

    if (!pollData.start_date || !pollData.end_date) {
      throw new Error('Başlangıç ve bitiş tarihleri gereklidir');
    }

    if (!pollData.items || pollData.items.length < 2) {
      throw new Error('En az 2 seçenek eklemelisiniz');
    }

    // Validate items
    for (const item of pollData.items) {
      if (!item.title?.trim()) {
        throw new Error('Tüm seçenekler için başlık gereklidir');
      }
    }

    const response = await fetch('/api/admin/polls/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pollData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Anket oluşturulurken bir hata oluştu');
    }

    return result;
  } catch (error) {
    console.error('Error creating poll:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Anket oluşturulurken bir hata oluştu'
    };
  }
}

/**
 * Update an existing poll with items
 */
export async function updatePollWithItems(pollId: number, pollData: PollFormData): Promise<PollResponse> {
  try {
    // Validate required fields
    if (!pollData.title?.trim()) {
      throw new Error('Anket başlığı gereklidir');
    }

    if (!pollData.start_date || !pollData.end_date) {
      throw new Error('Başlangıç ve bitiş tarihleri gereklidir');
    }

    if (!pollData.items || pollData.items.length < 2) {
      throw new Error('En az 2 seçenek eklemelisiniz');
    }

    // Validate items
    for (const item of pollData.items) {
      if (!item.title?.trim()) {
        throw new Error('Tüm seçenekler için başlık gereklidir');
      }
    }

    const response = await fetch(`/api/admin/polls/${pollId}/items`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pollData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Anket güncellenirken bir hata oluştu');
    }

    return result;
  } catch (error) {
    console.error('Error updating poll:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Anket güncellenirken bir hata oluştu'
    };
  }
}

/**
 * Delete a poll with confirmation
 */
export async function deletePoll(pollId: number): Promise<PollResponse> {
  try {
    if (!pollId || pollId <= 0) {
      throw new Error('Geçersiz anket ID');
    }

    const response = await fetch(`/api/admin/polls/${pollId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Anket silinirken bir hata oluştu');
    }

    return result;
  } catch (error) {
    console.error('Error deleting poll:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Anket silinirken bir hata oluştu'
    };
  }
}

/**
 * Fetch polls with pagination and filtering
 */
export async function fetchPolls(params: {
  page?: number;
  limit?: number;
  search?: string;
  poll_type?: string;
  is_active?: boolean;
  show_on_homepage?: boolean;
  show_results?: string;
} = {}): Promise<PollResponse> {
  try {
    const searchParams = new URLSearchParams();

    // Add parameters to search params
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.poll_type) searchParams.set('poll_type', params.poll_type);
    if (params.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());
    if (params.show_on_homepage !== undefined) searchParams.set('show_on_homepage', params.show_on_homepage.toString());
    if (params.show_results) searchParams.set('show_results', params.show_results);

    const url = `/api/admin/polls${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Anketler yüklenirken bir hata oluştu');
    }

    return result;
  } catch (error) {
    console.error('Error fetching polls:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Anketler yüklenirken bir hata oluştu'
    };
  }
}

/**
 * Fetch single poll by ID
 */
export async function fetchPollById(pollId: number): Promise<PollResponse> {
  try {
    if (!pollId || pollId <= 0) {
      throw new Error('Geçersiz anket ID');
    }

    const response = await fetch(`/api/admin/polls/${pollId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Anket yüklenirken bir hata oluştu');
    }

    return result;
  } catch (error) {
    console.error('Error fetching poll:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Anket yüklenirken bir hata oluştu'
    };
  }
}

/**
 * Fetch poll statistics for dashboard
 */
export async function getPollStatistics(): Promise<PollResponse & { data?: PollStatistics }> {
  try {
    const response = await fetch('/api/admin/polls/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'İstatistikler yüklenirken bir hata oluştu');
    }

    return result;
  } catch (error) {
    console.error('Error fetching poll statistics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'İstatistikler yüklenirken bir hata oluştu'
    };
  }
}

// Export types for use in components
export type { PollFormData, PollItem, PollResponse, PollStatistics };