import { Poll, PollVote } from '@/types/polls';

const API_BASE = '/api/polls';

export async function getActivePolls(): Promise<Poll[]> {
  try {
    const response = await fetch(`${API_BASE}/active`);
    if (!response.ok) {
      throw new Error(`Failed to fetch active polls: ${response.statusText}`);
    }
    const data = await response.json();
    return data.polls || [];
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
    const response = await fetch(`${API_BASE}/past?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch past polls: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
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