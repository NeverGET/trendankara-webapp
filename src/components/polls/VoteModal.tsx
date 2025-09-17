'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { PollCard } from './PollCard';
import { VoteModalProps } from '@/types/polls';

export function VoteModal({
  poll,
  isOpen,
  onClose,
  onVote,
  hasVoted = false
}: VoteModalProps) {
  if (!poll) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Anket"
      size="medium"
    >
      <PollCard
        id={poll.id}
        question={poll.question}
        options={poll.options}
        endDate={poll.endDate}
        totalVotes={poll.totalVotes}
        hasVoted={hasVoted}
        onVote={onVote}
      />

      {poll.description && (
        <div className="mt-4 p-4 bg-dark-surface-secondary rounded-lg">
          <p className="text-sm text-dark-text-secondary">
            {poll.description}
          </p>
        </div>
      )}
    </Modal>
  );
}