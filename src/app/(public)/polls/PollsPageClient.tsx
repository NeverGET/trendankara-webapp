'use client';

import React, { useEffect, useState } from 'react';
import { PollCard } from '@/components/polls/PollCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getActivePolls, getPastPolls, submitVote } from '@/lib/api/polls';
import { Poll } from '@/types/polls';

export default function PollsPageClient() {
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [pastPolls, setPastPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadPolls();
    loadVotedPolls();
  }, []);

  const loadVotedPolls = () => {
    const voted = new Set<number>();
    // Check localStorage for voted polls
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('poll_') && key.endsWith('_vote')) {
        const pollId = parseInt(key.split('_')[1]);
        if (!isNaN(pollId)) {
          voted.add(pollId);
        }
      }
    }
    setVotedPolls(voted);
  };

  const loadPolls = async () => {
    setLoading(true);
    try {
      const [active, past] = await Promise.all([
        getActivePolls(),
        getPastPolls(1, 10)
      ]);
      setActivePolls(active || []);
      setPastPolls(past?.polls || []);
    } catch (error) {
      console.error('Error loading polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: number, optionId: number) => {
    try {
      await submitVote(pollId, optionId);
      setVotedPolls(prev => new Set([...prev, pollId]));
      // Reload polls to get updated results
      await loadPolls();
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto px-4 py-8" style={{ maxWidth: '1024px' }}>
        <LoadingSpinner text="Anketler yükleniyor..." />
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-8" style={{ maxWidth: '1024px' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-text-primary mb-4">Anketler</h1>
        <p className="text-dark-text-secondary">
          Favori sanatçınız ve şarkılarınız için oy verin!
        </p>
      </div>

      {/* Active Polls */}
      {activePolls.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-dark-text-primary mb-6">
            Aktif Anketler
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {activePolls.map((poll) => (
              <PollCard
                key={poll.id}
                id={poll.id}
                question={poll.question}
                options={poll.options}
                endDate={poll.endDate}
                totalVotes={poll.totalVotes}
                hasVoted={votedPolls.has(poll.id)}
                onVote={handleVote}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past Polls */}
      {pastPolls.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-dark-text-primary mb-6">
            Geçmiş Anketler
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {pastPolls.map((poll) => (
              <PollCard
                key={poll.id}
                id={poll.id}
                question={poll.question}
                options={poll.options}
                endDate={poll.endDate}
                totalVotes={poll.totalVotes}
                hasVoted={true} // Past polls always show results
                onVote={handleVote}
              />
            ))}
          </div>
        </section>
      )}

      {/* No Polls Message */}
      {activePolls.length === 0 && pastPolls.length === 0 && (
        <div className="text-center py-12">
          <p className="text-dark-text-secondary">
            Şu anda görüntülenecek anket bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );
}
