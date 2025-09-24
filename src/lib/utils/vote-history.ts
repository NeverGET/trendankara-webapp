/**
 * Utility functions for managing vote history in localStorage
 */

export interface VoteRecord {
  pollId: number;
  optionId: number;
  optionTitle: string;
  optionImageUrl?: string | null;
  timestamp: number;
}

/**
 * Get all vote records from localStorage
 */
export function getAllVotes(): VoteRecord[] {
  const votes: VoteRecord[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('poll_') && key.endsWith('_vote')) {
      try {
        const pollId = parseInt(key.split('_')[1]);
        const voteData = JSON.parse(localStorage.getItem(key) || '{}');

        votes.push({
          pollId,
          optionId: voteData.optionId,
          optionTitle: voteData.optionTitle || 'Unknown Option',
          optionImageUrl: voteData.optionImageUrl,
          timestamp: voteData.timestamp || Date.now()
        });
      } catch (error) {
        console.error(`Error parsing vote data for ${key}:`, error);
      }
    }
  }

  // Sort by timestamp, newest first
  return votes.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get vote record for a specific poll
 */
export function getPollVote(pollId: number): VoteRecord | null {
  const key = `poll_${pollId}_vote`;
  const voteData = localStorage.getItem(key);

  if (!voteData) return null;

  try {
    const parsed = JSON.parse(voteData);
    return {
      pollId,
      optionId: parsed.optionId,
      optionTitle: parsed.optionTitle || 'Unknown Option',
      optionImageUrl: parsed.optionImageUrl,
      timestamp: parsed.timestamp || Date.now()
    };
  } catch (error) {
    console.error(`Error parsing vote data for poll ${pollId}:`, error);
    return null;
  }
}

/**
 * Check if user has voted in a poll
 */
export function hasVotedInPoll(pollId: number): boolean {
  return localStorage.getItem(`poll_${pollId}_vote`) !== null;
}

/**
 * Clear all vote history
 */
export function clearVoteHistory(): void {
  const keys: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('poll_') && key.endsWith('_vote')) {
      keys.push(key);
    }
  }

  keys.forEach(key => localStorage.removeItem(key));
}

/**
 * Get vote statistics
 */
export function getVoteStatistics() {
  const votes = getAllVotes();

  return {
    totalVotes: votes.length,
    votedPolls: new Set(votes.map(v => v.pollId)).size,
    recentVotes: votes.slice(0, 5),
    oldestVote: votes.length > 0 ? new Date(votes[votes.length - 1].timestamp) : null,
    newestVote: votes.length > 0 ? new Date(votes[0].timestamp) : null
  };
}