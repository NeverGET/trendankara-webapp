'use client';

import React, { useEffect, useState } from 'react';
import { PollResultsProps } from '@/types/polls';
import { cn } from '@/lib/utils';

export function PollResults({
  options,
  totalVotes,
  hasVoted,
  selectedOptionId
}: PollResultsProps) {
  const [animatedPercentages, setAnimatedPercentages] = useState<number[]>(
    options.map(() => 0)
  );

  // Calculate percentages
  const percentages = options.map(option =>
    totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0
  );

  // Find winning option
  const maxVotes = Math.max(...options.map(o => o.voteCount));
  const isWinner = (voteCount: number) => voteCount === maxVotes && voteCount > 0;

  // Animate percentages on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentages(percentages);
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const percentage = percentages[index];
        const animatedPercentage = animatedPercentages[index];
        const isSelected = selectedOptionId === option.id;
        const isWinning = isWinner(option.voteCount);

        return (
          <div
            key={option.id}
            className={cn(
              'relative rounded-lg overflow-hidden',
              isSelected && 'ring-2 ring-brand-red-600'
            )}
          >
            {/* Background progress bar */}
            <div className="absolute inset-0 bg-dark-surface-secondary">
              <div
                className={cn(
                  'h-full transition-all duration-1000 ease-out',
                  isWinning ? 'bg-brand-red-600/20' : 'bg-dark-surface-tertiary'
                )}
                style={{ width: `${animatedPercentage}%` }}
              />
            </div>

            {/* Content */}
            <div className="relative flex items-center gap-3 p-3">
              {option.imageUrl && (
                <div
                  className="w-12 h-12 rounded-lg bg-cover bg-center bg-dark-surface-secondary flex-shrink-0"
                  style={{ backgroundImage: `url(${option.imageUrl})` }}
                />
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    isWinning ? 'text-brand-red-600' : 'text-dark-text-primary'
                  )}>
                    {option.title}
                  </span>
                  {isSelected && (
                    <span className="px-2 py-0.5 bg-brand-red-600 text-white text-xs rounded-full">
                      Oyunuz
                    </span>
                  )}
                  {isWinning && (
                    <svg
                      className="w-4 h-4 text-brand-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </div>
                <div className="text-xs text-dark-text-secondary mt-1">
                  {option.voteCount} oy
                </div>
              </div>

              <div className="text-right">
                <span className={cn(
                  'text-lg font-bold',
                  isWinning ? 'text-brand-red-600' : 'text-dark-text-primary'
                )}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Total votes summary */}
      <div className="text-center text-sm text-dark-text-secondary pt-2 border-t border-dark-border-primary">
        Toplam {totalVotes} oy kullan1ld1
      </div>
    </div>
  );
}