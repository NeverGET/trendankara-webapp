'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { NewsArticle } from '@/types/news';
import { cn } from '@/lib/utils';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: NewsArticle | null;
}

export function NewsModal({ isOpen, onClose, article }: NewsModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!article) return null;

  const formattedDate = new Date(article.publishedAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const allImages = [
    typeof article.thumbnail === 'string'
      ? { url: article.thumbnail, id: 0 }
      : article.thumbnail,
    ...(article.images || [])
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={article.title}
      size="large"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center justify-between text-sm text-dark-text-secondary">
          <div className="flex items-center gap-4">
            <span className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              article.category === 'MAGAZINE' ? 'bg-purple-600 text-white' :
              article.category === 'ARTIST' ? 'bg-blue-600 text-white' :
              article.category === 'ALBUM' ? 'bg-green-600 text-white' :
              article.category === 'CONCERT' ? 'bg-orange-600 text-white' :
              'bg-dark-surface-tertiary text-dark-text-primary'
            )}>
              {article.category}
            </span>
            {article.author && (
              <span>Yazar: {article.author.name}</span>
            )}
          </div>
          <span>{formattedDate}</span>
        </div>

        {/* Main Image */}
        {allImages.length > 0 && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-dark-surface-secondary rounded-lg overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${
                    typeof allImages[selectedImageIndex] === 'string'
                      ? allImages[selectedImageIndex]
                      : allImages[selectedImageIndex].url
                  })`
                }}
              />
            </div>

            {/* Image Gallery Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                      selectedImageIndex === index
                        ? 'border-brand-red-600'
                        : 'border-transparent hover:border-dark-border-secondary'
                    )}
                  >
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${
                          typeof img === 'string' ? img : img.url
                        })`
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Article Summary */}
        <div className="p-4 bg-dark-surface-secondary rounded-lg">
          <p className="text-lg text-dark-text-primary font-medium">
            {article.summary}
          </p>
        </div>

        {/* Article Content */}
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-dark-border-primary">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-dark-surface-secondary text-dark-text-secondary text-sm rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* View Count */}
        <div className="text-sm text-dark-text-tertiary text-center">
          {article.viewCount} görüntülenme
        </div>
      </div>
    </Modal>
  );
}