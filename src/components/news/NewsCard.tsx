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
          <div className="absolute top-3 left-3 flex gap-2">
            {isBreaking && (
              <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                SON DAK0KA
              </span>
            )}
            {isHot && (
              <span className="px-3 py-1 bg-brand-red-600 text-white text-xs font-bold rounded-full">
                HOT
              </span>
            )}
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-3 right-3">
          <span className={cn(
            'px-3 py-1 text-xs font-medium rounded-full',
            categoryColors[category] || 'bg-dark-surface-tertiary text-dark-text-primary'
          )}>
            {category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-dark-text-primary mb-2 line-clamp-2 group-hover:text-brand-red-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-dark-text-secondary line-clamp-3 mb-3">
          {summary}
        </p>
        <p className="text-xs text-dark-text-tertiary">
          {formattedDate}
        </p>
      </div>
    </Card>
  );
}