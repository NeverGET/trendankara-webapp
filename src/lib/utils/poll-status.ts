/**
 * Poll status calculation utility
 * Determines poll status based on current date and poll start/end dates
 */

export type PollStatus = 'draft' | 'scheduled' | 'active' | 'ended';

export interface PollDates {
  start_date: string | Date;
  end_date: string | Date;
  is_active?: boolean;
}

/**
 * Calculate poll status based on dates and active state
 */
export function getPollStatus(poll: PollDates): PollStatus {
  const now = new Date();
  const startDate = new Date(poll.start_date);
  const endDate = new Date(poll.end_date);

  // If poll is not active, it's a draft
  if (poll.is_active === false) {
    return 'draft';
  }

  // If current time is before start date, it's scheduled
  if (now < startDate) {
    return 'scheduled';
  }

  // If current time is after end date, it's ended
  if (now > endDate) {
    return 'ended';
  }

  // If current time is between start and end, it's active
  return 'active';
}

/**
 * Calculate days remaining until poll ends
 */
export function getDaysRemaining(endDate: string | Date): number {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate days until poll starts
 */
export function getDaysUntilStart(startDate: string | Date): number {
  const now = new Date();
  const start = new Date(startDate);
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Get human-readable time remaining text
 */
export function getTimeRemainingText(endDate: string | Date): string {
  const daysRemaining = getDaysRemaining(endDate);

  if (daysRemaining === 0) {
    const now = new Date();
    const end = new Date(endDate);
    const diffHours = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours <= 0) {
      return 'Bitti';
    } else if (diffHours === 1) {
      return '1 saat kaldı';
    } else if (diffHours < 24) {
      return `${diffHours} saat kaldı`;
    }
  }

  if (daysRemaining === 1) {
    return '1 gün kaldı';
  } else if (daysRemaining > 1) {
    return `${daysRemaining} gün kaldı`;
  }

  return 'Bitti';
}

/**
 * Check if poll is ending soon (within 3 days)
 */
export function isPollEndingSoon(endDate: string | Date): boolean {
  return getDaysRemaining(endDate) <= 3;
}

/**
 * Check if poll can be voted on
 */
export function canVoteOnPoll(poll: PollDates): boolean {
  const status = getPollStatus(poll);
  return status === 'active';
}

/**
 * Check if poll results should be visible
 * Handles three visibility modes:
 * - 'always': Results always visible
 * - 'after_voting': Results shown after user votes
 * - 'never': Results never shown (even after poll ends)
 */
export function shouldShowResults(
  poll: PollDates & { show_results?: string },
  hasVoted: boolean = false
): boolean {
  const status = getPollStatus(poll);
  const showResults = poll.show_results || 'after_voting';

  switch (showResults) {
    case 'always':
      return true;
    case 'after_voting':
      return hasVoted || status === 'ended';
    case 'never':
      return false;
    default:
      return hasVoted || status === 'ended';
  }
}