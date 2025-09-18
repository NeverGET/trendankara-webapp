'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PollCardProps, PollOption } from '@/types/polls';
import { PollResults } from './PollResults';
import { cn } from '@/lib/utils';

export function PollCard({
  id,
  question,
  options,
  endDate,
  totalVotes,
  hasVoted: initialHasVoted,
  onVote
}: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isVoting, setIsVoting] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<number | null>(null);

  // Check if poll has ended
  const hasEnded = new Date(endDate) < new Date();

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Sona erdi';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} gün ${hours} saat kaldı`;
    return `${hours} saat kaldı`;
  }, [endDate]);

  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [calculateTimeRemaining]);

  // Load vote from localStorage
  useEffect(() => {
    const savedVote = localStorage.getItem(`poll_${id}_vote`);
    if (savedVote) {
      const { optionId } = JSON.parse(savedVote);
      setVotedOptionId(optionId);
      setHasVoted(true);
    }
  }, [id]);

  const handleVote = async () => {
    if (!selectedOption || !onVote || hasVoted || hasEnded) return;

    setIsVoting(true);
    try {
      await onVote(id, selectedOption);

      // Save vote to localStorage
      localStorage.setItem(`poll_${id}_vote`, JSON.stringify({
        optionId: selectedOption,
        timestamp: Date.now()
      }));

      setVotedOptionId(selectedOption);
      setHasVoted(true);
    } catch (error) {
      console.error('Vote failed:', error);
      // Could show an error message here
    } finally {
      setIsVoting(false);
    }
  };

  const showResults = hasVoted || hasEnded;

  return (
    <Card className="p-6 space-y-4">
      {/* Poll Header */}
      <div>
        <h3 className="text-xl font-semibold text-dark-text-primary mb-2">
          {question}
        </h3>
        <div className="flex items-center justify-between text-sm text-dark-text-secondary">
          <span>{totalVotes} oy</span>
          <span className={cn(
            'font-medium',
            hasEnded ? 'text-red-600' : 'text-brand-red-600'
          )}>
            {timeRemaining}
          </span>
        </div>
      </div>

      {/* Poll Options or Results */}
      {showResults ? (
        <PollResults
          options={options}
          totalVotes={totalVotes}
          hasVoted={hasVoted}
          selectedOptionId={votedOptionId || undefined}
        />
      ) : (
        <div className="space-y-3">
          {options.map((option) => (
            <label
              key={option.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                selectedOption === option.id
                  ? 'border-brand-red-600 bg-brand-red-600/10'
                  : 'border-dark-border-primary hover:border-dark-border-secondary hover:bg-dark-surface-secondary'
              )}
            >
              <input
                type="radio"
                name={`poll-${id}`}
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => setSelectedOption(option.id)}
                className="w-4 h-4 text-brand-red-600 bg-dark-surface-primary border-dark-border-secondary focus:ring-brand-red-600"
              />

              {option.imageUrl && (
                <div
                  className="w-[60px] h-[60px] rounded-lg bg-cover bg-center bg-dark-surface-secondary flex-shrink-0"
                  style={{ backgroundImage: `url(${option.imageUrl})` }}
                />
              )}

              <span className="text-dark-text-primary flex-1">
                {option.title}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Vote Button */}
      {!showResults && (
        <Button
          onClick={handleVote}
          disabled={!selectedOption || isVoting}
          loading={isVoting}
          fullWidth
          variant="primary"
        >
          Oy Ver
        </Button>
      )}

      {/* Voted Message */}
      {hasVoted && !hasEnded && (
        <p className="text-center text-sm text-dark-text-secondary">
          Oyunuz kaydedildi. Sonuçları görebilirsiniz.
        </p>
      )}

      {/* Ended Message */}
      {hasEnded && (
        <p className="text-center text-sm text-red-600 font-medium">
          Bu anket sona ermiştir.
        </p>
      )}
    </Card>
  );
}