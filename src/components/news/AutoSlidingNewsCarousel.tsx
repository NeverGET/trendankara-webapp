'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NewsArticle } from '@/types/news';
import { NewsCard } from './NewsCard';
import { cn } from '@/lib/utils';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface AutoSlidingNewsCarouselProps {
  items: NewsArticle[];
  autoSlide?: boolean;
  slideInterval?: number;
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  className?: string;
  onItemClick?: (id: number) => void;
}

export function AutoSlidingNewsCarousel({
  items,
  autoSlide = true,
  slideInterval = 5000,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 3 },
  className,
  onItemClick
}: AutoSlidingNewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(3);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  // Calculate items to show based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newItemsToShow: number;

      if (width < 640) {
        newItemsToShow = itemsPerView.mobile;
      } else if (width < 1024) {
        newItemsToShow = itemsPerView.tablet;
      } else {
        newItemsToShow = itemsPerView.desktop;
      }

      setItemsToShow(newItemsToShow);

      // Reset to valid index if current index is out of bounds
      const newMaxIndex = Math.max(0, Math.ceil(items.length / newItemsToShow) - 1);
      setCurrentIndex(prevIndex => Math.min(prevIndex, newMaxIndex));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerView, items.length]);

  // Calculate max index based on items to show
  const maxIndex = Math.max(0, Math.ceil(items.length / itemsToShow) - 1);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      return next > maxIndex ? 0 : next;
    });
  }, [maxIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => {
      const previous = prev - 1;
      return previous < 0 ? maxIndex : previous;
    });
  }, [maxIndex]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(Math.min(index, maxIndex));
  }, [maxIndex]);

  // Auto-slide functionality
  useEffect(() => {
    // Only auto-slide if we have more groups than 1
    if (autoSlide && !isPaused && maxIndex > 0) {
      intervalRef.current = setInterval(goToNext, slideInterval);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [autoSlide, isPaused, goToNext, slideInterval, maxIndex]);

  // Pause on hover
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Touch handlers for mobile
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 bg-dark-surface-primary rounded-lg">
        <p className="text-dark-text-secondary">Henüz haber bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      {/* Main Carousel Container */}
      <div className="relative overflow-hidden rounded-xl mx-8 md:mx-0">
        <div
          className="relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsToShow) * itemsToShow}%)`
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex-shrink-0 px-2',
                  itemsToShow === 1 ? 'w-full' : itemsToShow === 2 ? 'w-1/2' : 'w-1/3'
                )}
              >
                <NewsCard
                  id={item.id}
                  title={item.title}
                  slug={item.slug}
                  summary={item.summary}
                  thumbnail={typeof item.thumbnail === 'string' ? item.thumbnail : item.thumbnail?.url}
                  category={item.category}
                  isHot={item.isHot}
                  isBreaking={item.isBreaking}
                  publishedAt={item.publishedAt}
                  onClick={onItemClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {maxIndex > 0 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 p-3 md:p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-rose-600/80 hover:border-rose-500/50 transition-all shadow-lg flex items-center justify-center"
            aria-label="Önceki"
          >
            <FaChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 p-3 md:p-4 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-rose-600/80 hover:border-rose-500/50 transition-all shadow-lg flex items-center justify-center"
            aria-label="Sonraki"
          >
            <FaChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'transition-all duration-300',
                currentIndex === index
                  ? 'w-8 h-2 bg-primary-500 rounded-full'
                  : 'w-2 h-2 bg-dark-surface-tertiary hover:bg-dark-surface-secondary rounded-full'
              )}
              aria-label={`Grup ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Auto-play indicator */}
      {autoSlide && maxIndex > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-opacity',
            isPaused
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-green-500/20 text-green-400'
          )}>
            {isPaused ? (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                <span>Durduruldu</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Otomatik</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}