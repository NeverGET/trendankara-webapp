import { Poll, PollOption } from './polls';

/**
 * Form data interface for poll option creation/editing
 */
export interface PollItemFormData {
  id?: number;
  title: string;
  imageUrl?: string;
  tempId?: string; // For tracking options before saving
}

/**
 * Form data interface for poll creation/editing
 */
export interface PollFormData {
  title: string;
  question: string;
  description?: string;
  startDate: string; // ISO string format for form inputs
  endDate: string; // ISO string format for form inputs
  allowMultiple: boolean;
  showResults: boolean;
  options: PollItemFormData[];
}

/**
 * Extended poll interface with additional admin properties
 */
export interface ExtendedPoll extends Poll {
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: string;
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  participantCount?: number;
  engagementRate?: number;
}

/**
 * Poll statistics interface for admin dashboard
 */
export interface PollStats {
  totalPolls: number;
  activePolls: number;
  completedPolls: number;
  totalVotes: number;
  averageParticipation: number;
}

/**
 * Poll filter options for admin listing
 */
export interface PollFilters {
  status?: 'all' | 'draft' | 'active' | 'completed' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/**
 * Poll sorting options for admin listing
 */
export interface PollSortOptions {
  field: 'title' | 'startDate' | 'endDate' | 'totalVotes' | 'createdAt';
  direction: 'asc' | 'desc';
}