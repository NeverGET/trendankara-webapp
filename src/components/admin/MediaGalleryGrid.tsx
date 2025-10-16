'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FiImage, FiCheck } from 'react-icons/fi';

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  title?: string;
}

interface MediaGalleryGridProps {
  images: MediaFile[];
  onImageClick?: (image: MediaFile) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  loading?: boolean;
}

export function MediaGalleryGrid({
  images,
  onImageClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  loading = false
}: MediaGalleryGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  };

  const handleImageClick = (image: MediaFile, e: React.MouseEvent) => {
    if (selectable && e.shiftKey) {
      e.preventDefault();
      const isSelected = selectedIds.includes(image.id);
      const newSelection = isSelected
        ? selectedIds.filter((id) => id !== image.id)
        : [...selectedIds, image.id];
      onSelectionChange?.(newSelection);
    } else {
      onImageClick?.(image);
    }
  };

  const toggleSelection = (image: MediaFile, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSelected = selectedIds.includes(image.id);
    const newSelection = isSelected
      ? selectedIds.filter((id) => id !== image.id)
      : [...selectedIds, image.id];
    onSelectionChange?.(newSelection);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-dark-surface-secondary rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FiImage className="w-16 h-16 text-dark-text-tertiary mb-4" />
        <p className="text-dark-text-secondary">Henüz medya dosyası yok</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((image) => {
        const isSelected = selectedIds.includes(image.id);
        const isLoaded = loadedImages.has(image.id);

        return (
          <div
            key={image.id}
            onClick={(e) => handleImageClick(image, e)}
            className={cn(
              'relative aspect-square bg-dark-surface-secondary rounded-lg overflow-hidden cursor-pointer group',
              'transition-all duration-200 hover:shadow-lg hover:scale-105',
              isSelected && 'ring-2 ring-brand-red-600'
            )}
          >
            {/* Loading Placeholder */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-dark-surface-secondary animate-pulse" />
            )}

            {/* Image */}
            <Image
              src={image.thumbnailUrl || image.url}
              alt={image.filename}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              onLoad={() => handleImageLoad(image.id)}
              className={cn(
                'object-cover transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs truncate">
                  {image.title || image.filename}
                </p>
                <p className="text-white/70 text-xs">
                  {(image.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {/* Selection Checkbox */}
            {selectable && (
              <button
                onClick={(e) => toggleSelection(image, e)}
                className={cn(
                  'absolute top-2 right-2 w-6 h-6 rounded border-2 transition-all duration-200',
                  isSelected
                    ? 'bg-brand-red-600 border-brand-red-600'
                    : 'bg-black/40 border-white/40 hover:border-white'
                )}
              >
                {isSelected && <FiCheck className="w-full h-full text-white p-0.5" />}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}