'use client';

import { useState, useEffect, useCallback } from 'react';
import { MediaGalleryGrid } from '@/components/admin/MediaGalleryGrid';
import { ImageUploadZone } from '@/components/admin/ImageUploadZone';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Select } from '@/components/ui-adapters/SelectAdapter';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { useConfirmation } from '@/hooks/useConfirmation';
import {
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiGrid,
  FiList,
  FiFilter,
  FiDownload,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiImage,
  FiFilm,
  FiMusic,
  FiFile
} from 'react-icons/fi';

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  uploadedAt: Date;
  title?: string;
  alt_text?: string;
  category?: string;
  usageCount?: number;
}

interface MediaStats {
  totalFiles: number;
  totalSize: number;
  usedSpace: number;
  orphanedFiles: number;
  duplicates: number;
}

export default function AdminMediaPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [showOrphaned, setShowOrphaned] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Confirmation dialog
  const confirmation = useConfirmation();

  // Fetch media files from API
  const fetchMedia = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        limit: '24',
        search: searchQuery,
        type: filterType,
        sort: sortBy,
        orphaned: showOrphaned.toString()
      });

      const response = await fetch(`/api/admin/media?${params}`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setMediaFiles(data.data || []);
          setPage(1);
        } else {
          setMediaFiles(prev => [...prev, ...(data.data || [])]);
        }
        setHasMore(data.pagination?.hasNext || false);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      // Use mock data as fallback
      const mockData: MediaFile[] = [
        {
          id: '1',
          filename: 'banner-1.jpg',
          url: '/api/placeholder/400/400',
          thumbnailUrl: '/api/placeholder/150/150',
          size: 1024000,
          mimeType: 'image/jpeg',
          width: 1920,
          height: 1080,
          uploadedAt: new Date(),
          category: 'banners',
          usageCount: 3
        },
        {
          id: '2',
          filename: 'logo.png',
          url: '/api/placeholder/400/400',
          thumbnailUrl: '/api/placeholder/150/150',
          size: 512000,
          mimeType: 'image/png',
          width: 512,
          height: 512,
          uploadedAt: new Date(),
          category: 'logos',
          usageCount: 1
        }
      ];
      setMediaFiles(mockData);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filterType, sortBy, showOrphaned]);

  // Fetch media stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/media/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Mock stats
      setStats({
        totalFiles: 150,
        totalSize: 524288000,
        usedSpace: 400000000,
        orphanedFiles: 12,
        duplicates: 5
      });
    }
  }, []);

  useEffect(() => {
    fetchMedia(true);
    fetchStats();
  }, [searchQuery, filterType, sortBy, showOrphaned, fetchMedia, fetchStats]);

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    // Get details of selected files for preview
    const selectedFiles = mediaFiles.filter(f => selectedIds.includes(f.id));
    const filePreview = selectedFiles.slice(0, 3).map(f => f.filename).join(', ');
    const additionalCount = Math.max(0, selectedFiles.length - 3);
    const previewText = additionalCount > 0
      ? `${filePreview} ve ${additionalCount} dosya daha`
      : filePreview;

    const confirmed = await confirmation.confirm({
      title: 'Medya Dosyalarını Sil',
      message: `${selectedIds.length} dosyayı silmek istediğinizden emin misiniz?\n\nSilinecek dosyalar: ${previewText}\n\nBu işlem geri alınamaz ve dosyalar kalıcı olarak silinecektir.`,
      confirmText: `${selectedIds.length} Dosyayı Sil`,
      cancelText: 'İptal',
      variant: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      confirmation.setLoading(true);
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (response.ok) {
        setMediaFiles(prev => prev.filter(f => !selectedIds.includes(f.id)));
        setSelectedIds([]);
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      confirmation.setError('Dosyalar silinirken bir hata oluştu.');
    } finally {
      confirmation.setLoading(false);
    }
  };

  const handleCleanupOrphaned = async () => {
    if (!stats?.orphanedFiles) return;

    const confirmed = await confirmation.confirm({
      title: 'Kullanılmayan Dosyaları Temizle',
      message: `${stats.orphanedFiles} adet kullanılmayan dosya silinecek. Bu işlem geri alınamaz.\n\nEmin misiniz?`,
      confirmText: `${stats.orphanedFiles} Dosyayı Temizle`,
      cancelText: 'İptal',
      variant: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      confirmation.setLoading(true);
      const response = await fetch('/api/admin/media/cleanup', {
        method: 'POST'
      });

      if (response.ok) {
        fetchMedia(true);
        fetchStats();
      }
    } catch (error) {
      console.error('Error cleaning up orphaned media:', error);
      confirmation.setError('Kullanılmayan dosyalar temizlenirken bir hata oluştu.');
    } finally {
      confirmation.setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FiImage className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <FiFilm className="h-4 w-4" />;
    if (mimeType.startsWith('audio/')) return <FiMusic className="h-4 w-4" />;
    return <FiFile className="h-4 w-4" />;
  };

  const filteredFiles = mediaFiles.filter(file => {
    if (filterType !== 'all') {
      const typeMap = {
        image: 'image/',
        video: 'video/',
        audio: 'audio/',
        document: 'application/'
      };
      if (!file.mimeType.startsWith(typeMap[filterType])) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Medya Yönetimi</h1>
          <p className="text-gray-600 mt-2">Tüm medya dosyalarını yönetin</p>
        </div>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2"
        >
          <FiUploadCloud className="h-5 w-5" />
          Dosya Yükle
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Dosya</p>
                <SlidingNumber
                  from={0}
                  to={stats.totalFiles}
                  duration={1.5}
                  startOnView={true}
                  digitHeight={32}
                  className="text-2xl font-bold"
                />
              </div>
              <FiFile className="h-8 w-8 text-gray-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kullanılan Alan</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.usedSpace)}</p>
              </div>
              <FiDownload className="h-8 w-8 text-gray-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Boyut</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
              <FiInfo className="h-8 w-8 text-gray-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kullanılmayan</p>
                <p className="text-2xl font-bold text-orange-600">{stats.orphanedFiles}</p>
              </div>
              <FiAlertCircle className="h-8 w-8 text-orange-400" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tekrar Eden</p>
                <p className="text-2xl font-bold text-red-600">{stats.duplicates}</p>
              </div>
              <FiRefreshCw className="h-8 w-8 text-red-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Upload Zone */}
      {showUpload && (
        <Card className="p-6">
          <ImageUploadZone
            onUpload={async (files) => {
              const formData = new FormData();
              files.forEach(file => formData.append('files', file));

              try {
                const response = await fetch('/api/admin/media/upload', {
                  method: 'POST',
                  body: formData
                });

                if (response.ok) {
                  setShowUpload(false);
                  fetchMedia(true);
                  fetchStats();
                }
              } catch (error) {
                console.error('Upload error:', error);
              }
            }}
            multiple
            maxSize={50}
          />
        </Card>
      )}

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Dosya ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {/* Type Filter */}
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as any)}
              options={[
                { value: 'all', label: 'Tüm Tipler' },
                { value: 'image', label: 'Resimler' },
                { value: 'video', label: 'Videolar' },
                { value: 'audio', label: 'Ses Dosyaları' },
                { value: 'document', label: 'Belgeler' }
              ]}
            />

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
              options={[
                { value: 'newest', label: 'En Yeni' },
                { value: 'oldest', label: 'En Eski' },
                { value: 'name', label: 'İsme Göre' },
                { value: 'size', label: 'Boyuta Göre' }
              ]}
            />

            {/* View Mode */}
            <div className="flex gap-1 border rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
              >
                <FiGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
              >
                <FiList className="h-4 w-4" />
              </button>
            </div>

            {/* Orphaned Toggle */}
            <Button
              variant={showOrphaned ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setShowOrphaned(!showOrphaned)}
            >
              Kullanılmayanlar
            </Button>

            {/* Actions */}
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="flex items-center gap-2"
              >
                <FiTrash2 className="h-4 w-4" />
                Sil ({selectedIds.length})
              </Button>
            )}

            {stats && stats.orphanedFiles > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCleanupOrphaned}
                className="flex items-center gap-2"
              >
                <FiRefreshCw className="h-4 w-4" />
                Temizle
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Media Grid/List */}
      <Card className="p-6">
        {loading && mediaFiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Yükleniyor...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Medya dosyası bulunamadı
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <MediaGalleryGrid
              images={filteredFiles}
              selectable={true}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
            {hasMore && (
              <div className="text-center mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPage(prev => prev + 1);
                    fetchMedia();
                  }}
                  disabled={loading}
                >
                  Daha Fazla Yükle
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                  selectedIds.includes(file.id) ? 'bg-blue-50 border-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedIds(prev =>
                    prev.includes(file.id)
                      ? prev.filter(i => i !== file.id)
                      : [...prev, file.id]
                  );
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(file.id)}
                  onChange={() => {}}
                  className="h-4 w-4"
                />

                {/* Thumbnail */}
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                  {file.mimeType.startsWith('image/') && file.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={file.thumbnailUrl}
                      alt={file.filename}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    getFileIcon(file.mimeType)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-medium">{file.title || file.filename}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)} •
                    {file.width && file.height && ` ${file.width}×${file.height}px • `}
                    {new Date(file.uploadedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>

                {/* Usage Badge */}
                {file.usageCount !== undefined && (
                  <Badge variant={file.usageCount > 0 ? 'success' : 'warning'}>
                    {file.usageCount > 0 ? `${file.usageCount} kullanım` : 'Kullanılmıyor'}
                  </Badge>
                )}

                {/* Category */}
                {file.category && (
                  <Badge variant="default">{file.category}</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.close}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant as 'danger' | 'warning' | 'info'}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        loading={confirmation.isLoading}
      />
    </div>
  );
}