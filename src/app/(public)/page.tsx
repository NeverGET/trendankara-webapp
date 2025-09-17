'use client';

import React, { useEffect, useState } from 'react';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { NewsCarousel } from '@/components/news/NewsCarousel';
import { NewsGrid } from '@/components/news/NewsGrid';
import { NewsModal } from '@/components/news/NewsModal';
import { PollCard } from '@/components/polls/PollCard';
import { VoteModal } from '@/components/polls/VoteModal';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getFeaturedNews, getNews, getNewsArticle } from '@/lib/api/news';
import { getActivePolls, submitVote } from '@/lib/api/polls';
import { NewsArticle } from '@/types/news';
import { Poll } from '@/types/polls';
import Link from 'next/link';

export default function HomePage() {
  const { play, isPlaying } = useRadioPlayer();

  // News state
  const [featuredNews, setFeaturedNews] = useState<NewsArticle[]>([]);
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [newsLoading, setNewsLoading] = useState(true);

  // Polls state
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Load featured news
  useEffect(() => {
    const loadNews = async () => {
      setNewsLoading(true);
      try {
        const [featured, recent] = await Promise.all([
          getFeaturedNews(),
          getNews(1, 6)
        ]);
        setFeaturedNews(featured);
        setRecentNews(recent.articles);
      } catch (error) {
        console.error('Error loading news:', error);
      } finally {
        setNewsLoading(false);
      }
    };
    loadNews();
  }, []);

  // Load active poll
  useEffect(() => {
    const loadPolls = async () => {
      try {
        const polls = await getActivePolls();
        if (polls.length > 0) {
          setActivePoll(polls[0]);

          // Check if user has voted
          const voteData = localStorage.getItem(`poll_${polls[0].id}_vote`);
          if (voteData) {
            setHasVoted(true);
          } else {
            // Show poll modal after a delay on first visit
            const hasSeenPoll = sessionStorage.getItem(`poll_${polls[0].id}_seen`);
            if (!hasSeenPoll) {
              setTimeout(() => {
                setPollModalOpen(true);
                sessionStorage.setItem(`poll_${polls[0].id}_seen`, 'true');
              }, 3000);
            }
          }
        }
      } catch (error) {
        console.error('Error loading polls:', error);
      }
    };
    loadPolls();
  }, []);

  const handleNewsClick = async (id: number) => {
    const article = await getNewsArticle(id);
    if (article) {
      setSelectedArticle(article);
      setNewsModalOpen(true);
    }
  };

  const handlePollVote = async (pollId: number, optionId: number) => {
    await submitVote(pollId, optionId);
    setHasVoted(true);
    // Reload poll data to get updated results
    const polls = await getActivePolls();
    if (polls.length > 0) {
      setActivePoll(polls[0]);
    }
  };

  const handlePlayClick = async () => {
    if (!isPlaying) {
      await play();
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="relative py-12 md:py-20 text-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-dark-text-primary">
              Trend Ankara Radio
            </h1>
            <p className="text-xl text-dark-text-secondary max-w-2xl mx-auto">
              {"Türkiye'nin en iyi radyo istasyonu. 24/7 kesintisiz müzik yayını."}
            </p>

            {!isPlaying && (
              <Button
                size="giant"
                variant="primary"
                onClick={handlePlayClick}
                className="mt-8"
              >
                <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Radyoyu Başlat
              </Button>
            )}
          </div>
        </section>

        {/* Featured News Carousel */}
        {newsLoading ? (
          <section>
            <h2 className="text-2xl font-bold text-dark-text-primary mb-6">Öne Çıkan Haberler</h2>
            <LoadingSpinner text="Haberler yükleniyor..." />
          </section>
        ) : featuredNews && featuredNews.length > 0 ? (
          <section>
            <h2 className="text-2xl font-bold text-dark-text-primary mb-6">Öne Çıkan Haberler</h2>
            <NewsCarousel
              items={featuredNews}
              onItemClick={handleNewsClick}
            />
          </section>
        ) : null}

        {/* Active Poll */}
        {activePoll && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark-text-primary">Günün Anketi</h2>
              <Link href="/polls">
                <Button variant="ghost" size="small">
                  Tüm Anketler →
                </Button>
              </Link>
            </div>
            <div className="max-w-2xl mx-auto">
              <PollCard
                id={activePoll.id}
                question={activePoll.question}
                options={activePoll.options}
                endDate={activePoll.endDate}
                totalVotes={activePoll.totalVotes}
                hasVoted={hasVoted}
                onVote={handlePollVote}
              />
            </div>
          </section>
        )}

        {/* Recent News Grid */}
        {recentNews && recentNews.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark-text-primary">Son Haberler</h2>
              <Link href="/news">
                <Button variant="ghost" size="small">
                  Tüm Haberler →
                </Button>
              </Link>
            </div>
            <NewsGrid
              articles={recentNews}
              onArticleClick={handleNewsClick}
            />
          </section>
        )}
      </div>

      {/* News Modal */}
      <NewsModal
        isOpen={newsModalOpen}
        onClose={() => setNewsModalOpen(false)}
        article={selectedArticle}
      />

      {/* Poll Modal (Homepage Popup) */}
      <VoteModal
        poll={activePoll}
        isOpen={pollModalOpen}
        onClose={() => setPollModalOpen(false)}
        onVote={handlePollVote}
        hasVoted={hasVoted}
      />
    </>
  );
}