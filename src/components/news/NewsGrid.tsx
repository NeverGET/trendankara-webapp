'use client';

import React, { useEffect, useRef, useState } from 'react';
import { NewsArticle } from '@/types/news';
import { NewsCard } from './NewsCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

interface NewsGridProps {
  articles: NewsArticle[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onArticleClick?: (id: number) => void;
  className?: string;
}

// Skeleton loader component
function NewsCardSkeleton() {
  return (
    <div className="bg-dark-surface-primary rounded-lg animate-pulse">
      <div className="aspect-video bg-dark-surface-secondary rounded-t-lg" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-dark-surface-secondary rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-3 bg-dark-surface-secondary rounded" />
          <div className="h-3 bg-dark-surface-secondary rounded w-5/6" />
        </div>
        <div className="h-3 bg-dark-surface-tertiary rounded w-1/4" />
      </div>
    </div>
  );
}

export function NewsGrid({
  articles,
  loading = false,
  onLoadMore,
  hasMore = false,
  onArticleClick,
  className
}: NewsGridProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll implementation
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMore) {
        setIsLoadingMore(true);
        onLoadMore();
      }
    }, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  useEffect(() => {
    if (!loading) {
      setIsLoadingMore(false);
    }
  }, [loading]);

  if (loading && articles.length === 0) {
    // Initial loading state
    return (
      <div className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        className
      )}>
        {[...Array(6)].map((_, index) => (
          <NewsCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!loading && articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-text-secondary">Henüz haber bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <NewsCard
            key={article.id}
            id={article.id}
            title={article.title}
            summary={article.summary}
            thumbnail={typeof article.thumbnail === 'string' ? article.thumbnail : article.thumbnail.url}
            category={article.category}
            isHot={article.isHot}
            isBreaking={article.isBreaking}
            publishedAt={article.publishedAt}
            onClick={onArticleClick}
          />
        ))}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex justify-center py-8"
        >
          {isLoadingMore && (
            <LoadingSpinner text="Daha fazla haber yükleniyor..." />
          )}
        </div>
      )}
    </div>
  );
}