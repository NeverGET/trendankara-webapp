'use client';

import React from 'react';
import Image from 'next/image';
import { NewsCardProps, NewsCategory } from '@/types/news';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const categoryColors: Record<string, string> = {
  MAGAZINE: 'bg-purple-600 text-white',
  ARTIST: 'bg-blue-600 text-white',
  ALBUM: 'bg-green-600 text-white',
  CONCERT: 'bg-orange-600 text-white',
};

export function NewsCard({
  id,
  title,
  summary,
  thumbnail,
  category,
  isHot = false,
  isBreaking = false,
  publishedAt,
  onClick
}: NewsCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const formattedDate = new Date(publishedAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Card
      className="cursor-pointer group hover:scale-[1.02] transition-transform duration-200"
      onClick={handleClick}
    >
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        {/* Using a div with background image as Next/Image requires width and height */}
        <div
          className="w-full h-full bg-cover bg-center bg-dark-surface-secondary"
          style={{ backgroundImage: `url(${thumbnail})` }}
        />

        {/* Hot/Breaking Badge */}
        {(isHot || isBreaking) && (
          <div className="absolute top-2 left-2 md:top-3 md:left-3 flex gap-1 md:gap-2">
            {isBreaking && (
              <span className="px-2 py-0.5 md:px-3 md:py-1 bg-red-600 text-white text-[10px] md:text-xs font-bold rounded-full animate-pulse">
                SON DAK0KA
              </span>
            )}
            {isHot && (
              <span className="px-2 py-0.5 md:px-3 md:py-1 bg-brand-red-600 text-white text-[10px] md:text-xs font-bold rounded-full">
                HOT
              </span>
            )}
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3">
          <span className={cn(
            'px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-medium rounded-full',
            categoryColors[category] || 'bg-dark-surface-tertiary text-dark-text-primary'
          )}>
            {category}
          </span>
        </div>
      </div>

      <div className="p-3 md:p-4">
        <h3 className="text-base md:text-lg font-semibold text-dark-text-primary mb-1.5 md:mb-2 line-clamp-2 group-hover:text-brand-red-600 transition-colors">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-dark-text-secondary line-clamp-3 mb-2 md:mb-3">
          {summary}
        </p>
        <p className="text-[10px] md:text-xs text-dark-text-tertiary">
          {formattedDate}
        </p>
      </div>
    </Card>
  );
}