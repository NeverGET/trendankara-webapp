'use client';

import React, { useEffect, useState } from 'react';

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { FaPlay } from 'react-icons/fa';
import Image from 'next/image';
import { AutoSlidingNewsCarousel } from '@/components/news/AutoSlidingNewsCarousel';
import { NewsGrid } from '@/components/news/NewsGrid';
import { NewsModal } from '@/components/news/NewsModal';
import { PollCard } from '@/components/polls/PollCard';
import { VoteModal } from '@/components/polls/VoteModal';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getFeaturedNews, getNews, getNewsArticle } from '@/lib/api/news';
import { getActivePolls, submitVote } from '@/lib/api/polls';
import { NewsArticle } from '@/types/news';
import { Poll } from '@/types/polls';
import Link from 'next/link';

export default function HomePage() {
  const { play, isPlaying } = useRadioPlayer();

  // News state
  const [allNews, setAllNews] = useState<NewsArticle[]>([]);
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [newsLoading, setNewsLoading] = useState(true);

  // Polls state
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Load news for carousel and grid
  useEffect(() => {
    const loadNews = async () => {
      setNewsLoading(true);
      try {
        // Load more news for the carousel
        const response = await getNews(1, 12);
        setAllNews(response.articles || []);
        setRecentNews(response.articles?.slice(6) || []);
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
      <div className="mx-auto px-4 py-4 space-y-8" style={{ maxWidth: '1024px' }}>
        {/* Hero Section */}
        <section className="relative py-4 md:py-6 text-center bg-gradient-to-br from-rose-950 via-red-950 to-rose-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
          <div className="relative space-y-2">
            {/* Logo Image - 16:9 aspect ratio with controlled height */}
            <div className="flex justify-center px-4">
              <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80" style={{ aspectRatio: '16/9' }}>
                <Image
                  src="/TrendAnkara-Logo.png"
                  alt="Trend Ankara Radio"
                  fill
                  className="object-cover object-center drop-shadow-2xl"
                  style={{
                    objectPosition: '50% 50%',
                    transform: 'scale(1.2)'
                  }}
                  priority
                />
              </div>
            </div>
            <p className="text-lg md:text-xl lg:text-2xl text-red-100 max-w-3xl mx-auto px-4">
              {"Türkiye'nin en iyi radyo istasyonu. 24/7 kesintisiz müzik yayını."}
            </p>

            <div className="mt-3 pb-2 flex justify-center">
              {!isPlaying ? (
                <Button
                  size="lg"
                  variant="default"
                  onClick={handlePlayClick}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-red-900 hover:bg-red-600 transition-colors duration-200 border-red-800"
                >
                  <FaPlay className="w-10 h-10" />
                  <span className="text-xl font-semibold">Şimdi dinle</span>
                </Button>
              ) : (
                <div className="inline-flex items-center space-x-3 bg-primary-500/10 px-6 py-3 rounded-full">
                  <div className="flex space-x-1 items-end">
                    <span className="w-1 h-6 bg-primary-400 animate-pulse rounded-full"></span>
                    <span className="w-1 h-10 bg-primary-400 animate-pulse rounded-full animation-delay-200"></span>
                    <span className="w-1 h-8 bg-primary-400 animate-pulse rounded-full animation-delay-400"></span>
                    <span className="w-1 h-12 bg-primary-400 animate-pulse rounded-full animation-delay-600"></span>
                  </div>
                  <span className="text-lg font-medium text-primary-400">Şu an yayında</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Auto-Sliding News Carousel */}
        {newsLoading ? (
          <section>
            <h2 className="text-3xl font-bold text-dark-text-primary mb-8">Son Haberler</h2>
            <LoadingSpinner text="Haberler yükleniyor..." />
          </section>
        ) : allNews && allNews.length > 0 ? (
          <section>
            <h2 className="text-3xl font-bold text-dark-text-primary mb-8">Son Haberler</h2>
            <AutoSlidingNewsCarousel
              items={allNews.slice(0, 6)}
              onItemClick={handleNewsClick}
              autoSlide={true}
              slideInterval={5000}
              itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
            />
          </section>
        ) : (
          <section>
            <h2 className="text-3xl font-bold text-dark-text-primary mb-8">Son Haberler</h2>
            <div className="text-center py-12 bg-dark-surface-primary rounded-lg">
              <p className="text-dark-text-secondary">Henüz haber bulunmuyor.</p>
            </div>
          </section>
        )}

        {/* Active Poll */}
        {activePoll && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark-text-primary">Günün Anketi</h2>
              <Link href="/polls">
                <Button variant="ghost" size="sm">
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
                <Button variant="ghost" size="sm">
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