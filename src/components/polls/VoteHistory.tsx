'use client';

import React, { useState, useEffect } from 'react';
import { getAllVotes, clearVoteHistory, VoteRecord } from '@/lib/utils/vote-history';
import { Button } from '@/components/ui/button';

// Format date helper function
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function VoteHistory() {
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (showHistory) {
      setVotes(getAllVotes());
    }
  }, [showHistory]);

  const handleClearHistory = () => {
    if (confirm('Tüm oy geçmişinizi silmek istediğinize emin misiniz?')) {
      clearVoteHistory();
      setVotes([]);
    }
  };

  if (!showHistory) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowHistory(true)}
        className="text-sm text-dark-text-secondary"
      >
        Oy Geçmişim ({getAllVotes().length})
      </Button>
    );
  }

  return (
    <div className="bg-dark-surface-secondary rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-dark-text-primary">
          Oy Geçmişim
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(false)}
          >
            Gizle
          </Button>
          {votes.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearHistory}
            >
              Temizle
            </Button>
          )}
        </div>
      </div>

      {votes.length === 0 ? (
        <p className="text-dark-text-secondary text-sm">
          Henüz hiçbir ankette oy kullanmadınız.
        </p>
      ) : (
        <div className="space-y-2">
          {votes.map((vote, index) => (
            <div
              key={`${vote.pollId}-${index}`}
              className="border-l-4 border-brand-red-600 pl-3 py-2"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-dark-text-primary font-medium">
                    Anket #{vote.pollId}
                  </p>
                  <p className="text-dark-text-secondary text-sm flex items-center gap-2">
                    <span className="font-semibold">Seçiminiz:</span>
                    {vote.optionImageUrl && (
                      <img
                        src={vote.optionImageUrl}
                        alt={vote.optionTitle}
                        className="w-6 h-6 rounded object-cover"
                      />
                    )}
                    <span>{vote.optionTitle}</span>
                  </p>
                </div>
                <time className="text-xs text-dark-text-tertiary">
                  {formatDate(new Date(vote.timestamp))}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-dark-border-subtle">
        <p className="text-xs text-dark-text-tertiary">
          Toplam {votes.length} ankette oy kullandınız
        </p>
      </div>
    </div>
  );
}