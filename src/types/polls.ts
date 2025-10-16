export interface PollOption {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  voteCount: number;
  percentage?: number;
}

export interface Poll {
  id: number;
  title: string;
  question: string;
  description?: string;
  options: PollOption[];
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  totalVotes: number;
  allowMultiple: boolean;
  showResults: boolean;
  show_results?: 'never' | 'after_voting' | 'always' | 'when_ended';
}

export interface PollVote {
  pollId: number;
  optionId: number;
  deviceId?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
  };
}

export interface PollCardProps {
  id: number;
  question: string;
  options: PollOption[];
  endDate: Date | string;
  totalVotes: number;
  hasVoted: boolean;
  show_results?: 'never' | 'after_voting' | 'always' | 'when_ended';
  onVote?: (pollId: number, optionId: number) => Promise<void>;
}

export interface VoteModalProps {
  poll: Poll | null;
  isOpen: boolean;
  onClose: () => void;
  onVote?: (pollId: number, optionId: number) => Promise<void>;
  hasVoted?: boolean;
}

export interface PollResultsProps {
  options: PollOption[];
  totalVotes: number;
  hasVoted?: boolean;
  selectedOptionId?: number;
}