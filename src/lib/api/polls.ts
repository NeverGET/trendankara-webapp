import { Poll, PollVote } from '@/types/polls';

const API_BASE = '/api/polls';

export async function getActivePolls(): Promise<Poll[]> {
  try {
    // Get current date to filter active polls
    const now = new Date();
    const currentDateTime = now.toISOString();

    const response = await fetch(`${API_BASE}/active?current_time=${encodeURIComponent(currentDateTime)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch active polls: ${response.statusText}`);
    }
    const data = await response.json();

    // Transform API response to match Poll interface
    const activePolls = (data.polls || []).map((poll: any) => ({
      id: poll.id,
      title: poll.title,
      question: poll.title, // Using title as question since API doesn't have separate question field
      description: poll.description,
      options: (poll.items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        voteCount: item.vote_count || 0,
        percentage: 0 // Will be calculated on display
      })),
      startDate: poll.start_date,
      endDate: poll.end_date,
      isActive: true,
      totalVotes: typeof poll.total_votes === 'string' ? parseInt(poll.total_votes) || 0 : poll.total_votes || 0,
      allowMultiple: false,
      showResults: poll.show_results === 'always',
      show_results: poll.show_results || 'after_voting'
    }));

    // Filter polls where current date is between start_date and end_date
    const filteredPolls = activePolls.filter((poll: Poll) => {
      const startDate = new Date(poll.startDate);
      const endDate = new Date(poll.endDate);
      return now >= startDate && now <= endDate;
    });

    // Sort by start_date descending
    return filteredPolls.sort((a: Poll, b: Poll) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  } catch (error) {
    console.error('Error fetching active polls:', error);
    return [];
  }
}

export async function getPoll(pollId: number): Promise<Poll | null> {
  try {
    const response = await fetch(`${API_BASE}/${pollId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch poll ${pollId}: ${response.statusText}`);
    }
    const data = await response.json();

    if (!data.poll) return null;

    const poll = data.poll;

    // Transform API response to match Poll interface
    return {
      id: poll.id,
      title: poll.title,
      question: poll.title,
      description: poll.description,
      options: (poll.items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        voteCount: item.vote_count || 0,
        percentage: item.vote_count && poll.total_votes > 0
          ? (item.vote_count / poll.total_votes * 100)
          : 0
      })),
      startDate: poll.start_date,
      endDate: poll.end_date,
      isActive: poll.is_active,
      totalVotes: typeof poll.total_votes === 'string' ? parseInt(poll.total_votes) || 0 : poll.total_votes || 0,
      allowMultiple: false,
      showResults: poll.show_results === 'always',
      show_results: poll.show_results || 'after_voting'
    };
  } catch (error) {
    console.error(`Error fetching poll ${pollId}:`, error);
    return null;
  }
}

export async function submitVote(pollId: number, optionId: number): Promise<boolean> {
  try {
    // Generate or get device ID
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('deviceId', deviceId);
    }

    const voteData = {
      pollId,
      pollItemId: optionId,  // API expects pollItemId, not optionId
      deviceId,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform
      }
    };

    const response = await fetch(`${API_BASE}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(voteData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit vote');
    }

    return true;
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw error;
  }
}

export async function getPollResults(pollId: number): Promise<Poll | null> {
  try {
    const response = await fetch(`${API_BASE}/${pollId}/results`);
    if (!response.ok) {
      throw new Error(`Failed to fetch poll results: ${response.statusText}`);
    }
    const data = await response.json();

    if (!data.poll) return null;

    const poll = data.poll;

    // Transform API response to match Poll interface
    return {
      id: poll.id,
      title: poll.title,
      question: poll.title,
      description: poll.description,
      options: (poll.items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        voteCount: item.vote_count || 0,
        percentage: item.percentage ? parseFloat(item.percentage) : 0
      })),
      startDate: poll.start_date,
      endDate: poll.end_date,
      isActive: poll.is_active,
      totalVotes: typeof poll.total_votes === 'string' ? parseInt(poll.total_votes) || 0 : poll.total_votes || 0,
      allowMultiple: false,
      showResults: poll.can_view_results || false,
      show_results: poll.show_results || 'after_voting'
    };
  } catch (error) {
    console.error('Error fetching poll results:', error);
    return null;
  }
}

export async function getPastPolls(page: number = 1, limit: number = 10): Promise<{
  polls: Poll[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}> {
  try {
    // Get current date to filter past polls
    const now = new Date();
    const currentDateTime = now.toISOString();

    const response = await fetch(`${API_BASE}/past?page=${page}&limit=${limit}&current_time=${encodeURIComponent(currentDateTime)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch past polls: ${response.statusText}`);
    }
    const data = await response.json();

    // Transform API response to match Poll interface
    const pastPolls = (data.polls || []).map((poll: any) => ({
      id: poll.id,
      title: poll.title,
      question: poll.title, // Using title as question
      description: poll.description,
      options: (poll.items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.image_url,
        voteCount: item.vote_count || 0,
        percentage: item.vote_count && poll.total_votes > 0
          ? (item.vote_count / poll.total_votes * 100)
          : 0
      })),
      startDate: poll.start_date,
      endDate: poll.end_date,
      isActive: false, // Past polls are not active
      totalVotes: typeof poll.total_votes === 'string' ? parseInt(poll.total_votes) || 0 : poll.total_votes || 0,
      allowMultiple: false,
      showResults: true, // Past polls always show results
      show_results: poll.show_results || 'when_ended'
    }));

    return {
      polls: pastPolls,
      pagination: data.pagination || {
        page,
        limit,
        total: pastPolls.length,
        hasNext: false
      }
    };
  } catch (error) {
    console.error('Error fetching past polls:', error);
    return {
      polls: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        hasNext: false
      }
    };
  }
}