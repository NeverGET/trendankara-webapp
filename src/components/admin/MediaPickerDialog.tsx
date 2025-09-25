'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui-adapters/ButtonAdapter';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui-adapters/SelectAdapter';
import {
  Search,
  Upload,
  Check,
  Image as ImageIcon,
  Film,
  Music,
  File,
  Loader2,
  FolderOpen
} from 'lucide-react';

export interface MediaItem {
  id: number;
  url: string;
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  filename: string;
  title?: string;
  alt_text?: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  created_at: string;
  category?: string;
}

interface MediaPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem | MediaItem[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSelection?: number;
  hideUpload?: boolean;
}

export function MediaPickerDialog({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  accept,
  maxSelection = 10,
  hideUpload = false
}: MediaPickerDialogProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('image');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch media items
  const fetchMedia = useCallback(async (reset = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        limit: '20',
        search: searchTerm,
        type: filterType,
        sort: sortBy
      });

      const response = await fetch(`/api/admin/media?${params}`);
      const data = await response.json();

      if (data.success) {
        // Transform API response to match MediaItem interface
        const transformedItems = data.data.map((item: any) => ({
          id: item.id,
          filename: item.filename,
          url: item.url,
          thumbnails: item.thumbnailUrl ? {
            small: item.thumbnailUrl,
            medium: item.thumbnailUrl,
            large: item.thumbnailUrl
          } : undefined,
          size: item.size,
          mime_type: item.mimeType || item.mime_type,
          width: item.width,
          height: item.height,
          created_at: item.uploadedAt || item.created_at,
          title: item.title,
          alt_text: item.alt_text,
          category: item.category
        }));

        if (reset) {
          setMediaItems(transformedItems);
          setPage(1);
        } else {
          setMediaItems(prev => [...prev, ...transformedItems]);
        }
        setHasMore(data.pagination?.hasNext || false);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, filterType, sortBy]);

  useEffect(() => {
    if (isOpen) {
      fetchMedia(true);
    }
  }, [isOpen, searchTerm, filterType, sortBy, fetchMedia]);

  const handleSelect = (item: MediaItem) => {
    if (multiple) {
      const isSelected = selectedItems.some(i => i.id === item.id);
      if (isSelected) {
        setSelectedItems(prev => prev.filter(i => i.id !== item.id));
      } else if (selectedItems.length < maxSelection) {
        setSelectedItems(prev => [...prev, item]);
      }
    } else {
      onSelect(item);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (selectedItems.length > 0) {
      onSelect(multiple ? selectedItems : selectedItems[0]);
      onClose();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        fetchMedia(true);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-4 w-4" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Film className="h-4 w-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Medya Seçici"
      size="large"
    >
      <div className="flex flex-col h-[600px]">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-3 p-3 border-b">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Medya ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <div className="flex gap-1.5">

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
              options={[
                { value: 'newest', label: 'En Yeni' },
                { value: 'oldest', label: 'En Eski' }
              ]}
              className="text-xs md:text-sm min-h-[40px]"
            />


            {/* Upload Button */}
            {!hideUpload && (
              <label className="cursor-pointer">
                <Button
                  variant="primary"
                  size="small"
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Yükle
                </Button>
                <input
                  type="file"
                  multiple
                  accept={accept}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Media Grid/List */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading && mediaItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-dark-text-tertiary" />
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-dark-text-secondary">
              <FolderOpen className="h-8 w-8 md:h-12 md:w-12 mb-2" />
              <p>Medya bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 md:gap-3">
                  {mediaItems.map((item) => {
                    const isSelected = selectedItems.some(i => i.id === item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                          isSelected ? 'border-brand-red-600 ring-2 ring-brand-red-600/20' : 'border-dark-border-secondary hover:border-dark-border-primary'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="aspect-square bg-dark-surface-secondary relative overflow-hidden">
                          {item.mime_type?.startsWith('image/') ? (
                            <>
                              <img
                                src={item.url}
                                alt={item.alt_text || item.filename}
                                className="absolute inset-0 w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling;
                                  if (fallback) {
                                    (fallback as HTMLElement).style.display = 'flex';
                                  }
                                }}
                              />
                              <div className="absolute inset-0 w-full h-full flex items-center justify-center text-dark-text-tertiary bg-dark-surface-secondary" style={{ display: 'none' }}>
                                {getFileIcon(item.mime_type)}
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center text-dark-text-tertiary bg-dark-surface-secondary">
                              {getFileIcon(item.mime_type)}
                            </div>
                          )}

                          {/* Info Overlay - Inside the thumbnail div */}
                          <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <p className="text-xs text-white truncate">{item.filename}</p>
                            <p className="text-xs text-gray-300">{formatFileSize(item.size)}</p>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setPage(prev => prev + 1);
                      fetchMedia();
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Daha Fazla Yükle'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {multiple && (
          <div className="flex items-center justify-between p-3 border-t">
            <p className="text-sm text-gray-500">
              {selectedItems.length} / {maxSelection} seçili
            </p>
            <div className="flex gap-1.5">
              <Button variant="secondary" onClick={onClose}>
                İptal
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSelection}
                disabled={selectedItems.length === 0}
              >
                Seç ({selectedItems.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}