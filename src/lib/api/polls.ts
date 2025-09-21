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

    // Filter polls where current date is between start_date and end_date
    const activePolls = (data.polls || []).filter((poll: any) => {
      const startDate = new Date(poll.start_date);
      const endDate = new Date(poll.end_date);
      return now >= startDate && now <= endDate && poll.is_active;
    });

    // Sort by start_date descending
    return activePolls.sort((a: any, b: any) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
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
    return data.poll;
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

    const voteData: PollVote = {
      pollId,
      optionId,
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
    return data.poll;
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

    // Filter polls where end_date < current date
    const pastPolls = (data.polls || []).filter((poll: any) => {
      const endDate = new Date(poll.end_date);
      return now > endDate;
    });

    // Always include show_results field and results for ended polls
    const pollsWithResults = pastPolls.map((poll: any) => ({
      ...poll,
      show_results: poll.show_results || 'when_ended', // Default to show results when ended
    }));

    return {
      polls: pollsWithResults,
      pagination: data.pagination || {
        page,
        limit,
        total: pollsWithResults.length,
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