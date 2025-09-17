export interface PollOption {
  id: number;
  title: string;
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