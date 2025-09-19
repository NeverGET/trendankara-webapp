'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Search,
  Upload,
  Grid,
  List,
  Check,
  X,
  Image as ImageIcon,
  Film,
  Music,
  File,
  Loader2,
  Filter,
  Calendar,
  FolderOpen
} from 'lucide-react';

interface MediaItem {
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
  category?: string;
  maxSelection?: number;
}

export function MediaPickerDialog({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  accept,
  category,
  maxSelection = 10
}: MediaPickerDialogProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');
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

      if (category) {
        params.append('category', category);
      }

      const response = await fetch(`/api/admin/media?${params}`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setMediaItems(data.data);
          setPage(1);
        } else {
          setMediaItems(prev => [...prev, ...data.data]);
        }
        setHasMore(data.pagination?.hasNext || false);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, filterType, sortBy, category]);

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

    if (category) {
      formData.append('category', category);
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

  const getFileIcon = (mimeType: string) => {
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

  const getThumbnailUrl = (item: MediaItem) => {
    if (item.thumbnails?.medium) return item.thumbnails.medium;
    if (item.thumbnails?.small) return item.thumbnails.small;
    if (item.mime_type.startsWith('image/')) return item.url;
    return null;
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
        <div className="flex flex-col sm:flex-row gap-4 p-4 border-b">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Medya ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {/* Filter Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">Tümü</option>
              <option value="image">Resimler</option>
              <option value="video">Videolar</option>
              <option value="audio">Ses Dosyaları</option>
              <option value="document">Belgeler</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="name">İsme Göre</option>
              <option value="size">Boyuta Göre</option>
            </select>

            {/* View Mode */}
            <div className="flex gap-1 border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Upload Button */}
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
          </div>
        </div>

        {/* Media Grid/List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && mediaItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FolderOpen className="h-12 w-12 mb-2" />
              <p>Medya bulunamadı</p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {mediaItems.map((item) => {
                    const isSelected = selectedItems.some(i => i.id === item.id);
                    const thumbnailUrl = getThumbnailUrl(item);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="aspect-square bg-gray-100">
                          {thumbnailUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={thumbnailUrl}
                              alt={item.alt_text || item.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {getFileIcon(item.mime_type)}
                            </div>
                          )}
                        </div>

                        {/* Info Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs truncate">{item.filename}</p>
                            <p className="text-xs">{formatFileSize(item.size)}</p>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {mediaItems.map((item) => {
                    const isSelected = selectedItems.some(i => i.id === item.id);
                    const thumbnailUrl = getThumbnailUrl(item);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                          {thumbnailUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={thumbnailUrl}
                              alt={item.alt_text || item.filename}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {getFileIcon(item.mime_type)}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title || item.filename}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(item.size)} • {item.width && item.height && `${item.width}×${item.height}px • `}
                            {new Date(item.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <Check className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-4">
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
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-gray-500">
              {selectedItems.length} / {maxSelection} seçili
            </p>
            <div className="flex gap-2">
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