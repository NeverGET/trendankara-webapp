'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui-adapters/ButtonAdapter';
import { PollCardProps, PollOption } from '@/types/polls';
import { PollResults } from './PollResults';
import { shouldShowResults } from '@/lib/utils/poll-status';
import { cn } from '@/lib/utils';

export function PollCard({
  id,
  question,
  options,
  endDate,
  totalVotes,
  hasVoted: initialHasVoted,
  show_results = 'after_voting',
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

      // Find the selected option details
      const selectedOptionDetails = options.find(opt => opt.id === selectedOption);

      // Save vote to localStorage with option details
      localStorage.setItem(`poll_${id}_vote`, JSON.stringify({
        optionId: selectedOption,
        optionTitle: selectedOptionDetails?.title || '',
        optionImageUrl: selectedOptionDetails?.imageUrl || null,
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

  // Determine if results should be shown based on visibility rules
  const showResults = shouldShowResults(
    {
      start_date: new Date(), // Not used in shouldShowResults for this case
      end_date: endDate,
      show_results
    },
    hasVoted
  );

  // Special case: never show results if show_results is 'never'
  const displayResults = show_results !== 'never' && showResults;

  return (
    <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
      {/* Poll Header */}
      <div>
        <h3 className="text-lg md:text-xl font-semibold text-dark-text-primary mb-2">
          {question}
        </h3>
        <div className="flex items-center justify-between text-xs md:text-sm text-dark-text-secondary">
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
      {displayResults ? (
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
                'flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg border cursor-pointer transition-all min-h-[44px]',
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
                className="w-4 h-4 text-brand-red-600 bg-dark-surface-primary border-dark-border-secondary focus:ring-brand-red-600 flex-shrink-0"
              />

              {option.imageUrl && (
                <div
                  className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] rounded-lg bg-cover bg-center bg-dark-surface-secondary flex-shrink-0"
                  style={{ backgroundImage: `url(${option.imageUrl})` }}
                />
              )}

              <div className="flex-1 flex flex-col gap-1">
                <span className="text-sm md:text-base text-dark-text-primary">
                  {option.title}
                </span>
                {option.description && (
                  <span className="text-xs md:text-sm text-dark-text-secondary">
                    {option.description}
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Vote Button */}
      {!displayResults && !hasEnded && (
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
        <p className="text-center text-xs md:text-sm text-dark-text-secondary">
          {displayResults
            ? 'Oyunuz kaydedildi. Sonuçları görebilirsiniz.'
            : show_results === 'never'
            ? 'Oyunuz kaydedildi. Bu ankette sonuçlar gizlidir.'
            : 'Oyunuz kaydedildi. Sonuçlar anket bitince gösterilecektir.'
          }
        </p>
      )}

      {/* Results Hidden Message - Only for 'never' mode */}
      {hasVoted && !displayResults && show_results === 'never' && !hasEnded && (
        <p className="text-center text-xs md:text-sm text-yellow-600">
          Bu ankette sonuçlar hiçbir zaman gösterilmez.
        </p>
      )}

      {/* Ended Message */}
      {hasEnded && (
        <p className="text-center text-xs md:text-sm text-red-600 font-medium">
          Bu anket sona ermiştir.
        </p>
      )}
    </Card>
  );
}