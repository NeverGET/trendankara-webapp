'use client';

import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Image as ImageIcon, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load MediaPickerDialog
const MediaPickerDialog = React.lazy(() =>
  import('@/components/admin/MediaPickerDialog').then(module => ({
    default: module.MediaPickerDialog
  }))
);

interface SimplifiedImagePickerProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
  imageClassName?: string;
}

export function SimplifiedImagePicker({
  value,
  onChange,
  disabled = false,
  className = '',
  imageClassName = ''
}: SimplifiedImagePickerProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageMetadata, setImageMetadata] = useState<{ width?: number; height?: number; size?: string }>({});

  // Load image metadata when value changes
  React.useEffect(() => {
    if (value) {
      const img = new Image();
      img.onload = () => {
        setImageError(false);
        setImageMetadata({
          width: img.width,
          height: img.height,
          size: `${img.width}x${img.height}`
        });
      };
      img.onerror = () => {
        setImageError(true);
        setImageMetadata({});
      };
      img.src = value;
    } else {
      setImageMetadata({});
      setImageError(false);
    }
  }, [value]);

  const handleImageSelect = (media: any) => {
    // Handle both MediaItem and MediaItem[] formats
    let selectedUrl = '';

    if (Array.isArray(media)) {
      if (media.length > 0) {
        // Try different possible URL properties
        selectedUrl = media[0].url || media[0].src || media[0].image_url || '';
      }
    } else if (media) {
      // Try different possible URL properties
      selectedUrl = media.url || media.src || media.image_url || '';
    }

    if (selectedUrl) {
      onChange(selectedUrl);
      // Force state update
      setImageError(false);
      setImageMetadata({});
    }
    setIsPickerOpen(false);
  };

  const handleRemove = () => {
    onChange('');
    setImageMetadata({});
    setImageError(false);
  };

  const handleChange = () => {
    setIsPickerOpen(true);
  };

  if (!value) {
    // No image selected - show select button
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIsPickerOpen(true)}
          disabled={disabled}
          className="w-full"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          <span>Resim Seç</span>
        </Button>
        <span className="text-xs text-dark-text-tertiary text-center">(Opsiyonel)</span>

        <Suspense fallback={<LoadingSpinner />}>
          {isPickerOpen && (
            <MediaPickerDialog
              isOpen={isPickerOpen}
              onClose={() => setIsPickerOpen(false)}
              onSelect={handleImageSelect}
              multiple={false}
            />
          )}
        </Suspense>
      </div>
    );
  }

  // Image selected - show preview with hover controls
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'relative rounded-lg overflow-hidden bg-dark-surface-secondary border border-dark-border-secondary',
          'transition-all duration-200',
          isHovered && !disabled && 'border-dark-border-primary shadow-lg',
          imageClassName
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Preview */}
        {!imageError ? (
          <img
            src={value}
            alt="Seçenek resmi"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-dark-surface-tertiary">
            <div className="text-center p-4">
              <ImageIcon className="w-8 h-8 text-dark-text-tertiary mx-auto mb-2" />
              <p className="text-xs text-dark-text-tertiary">Resim yüklenemedi</p>
            </div>
          </div>
        )}

        {/* Hover Overlay with Actions */}
        {isHovered && !disabled && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 animate-fade-in">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleChange}
              className="bg-white/90 hover:bg-white text-black border-0"
              title="Değiştir"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Değiştir
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRemove}
              className="bg-red-600/90 hover:bg-red-600 text-white border-0"
              title="Kaldır"
            >
              <X className="w-4 h-4 mr-1" />
              Kaldır
            </Button>
          </div>
        )}

        {/* Image Metadata (shown when not hovering) */}
        {!isHovered && imageMetadata.size && !imageError && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <div className="text-xs text-white/90">
              {imageMetadata.size}
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        {isPickerOpen && (
          <MediaPickerDialog
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            onSelect={handleImageSelect}
            multiple={false}
          />
        )}
      </Suspense>
    </div>
  );
}

export default SimplifiedImagePicker;