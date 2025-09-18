'use client';

import { useState, useEffect } from 'react';
import { MediaGalleryGrid } from '@/components/admin/MediaGalleryGrid';
import { ImageUploadZone } from '@/components/admin/ImageUploadZone';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FiSearch, FiTrash2, FiUploadCloud } from 'react-icons/fi';

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export default function AdminMediaPage() {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Fetch images from API
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      // Simulated data for now
      const mockImages: MediaFile[] = [
        {
          id: '1',
          filename: 'banner-1.jpg',
          url: '/api/placeholder/400/400',
          size: 1024000,
          mimeType: 'image/jpeg',
          uploadedAt: new Date()
        },
        {
          id: '2',
          filename: 'logo.png',
          url: '/api/placeholder/400/400',
          size: 512000,
          mimeType: 'image/png',
          uploadedAt: new Date()
        }
      ];
      setImages(mockImages);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    console.log('Uploading files:', files);
    // TODO: Implement actual upload logic
    setShowUpload(false);
    fetchImages();
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    if (confirm(`${selectedIds.length} dosyayı silmek istediğinizden emin misiniz?`)) {
      console.log('Deleting:', selectedIds);
      // TODO: Implement delete logic
      setSelectedIds([]);
      fetchImages();
    }
  };

  const filteredImages = images.filter((image) =>
    image.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-text-primary">
            Medya Yönetimi
          </h1>
          <p className="text-dark-text-secondary mt-1">
            Resim ve medya dosyalarını yönetin
          </p>
        </div>
        <Button
          variant="primary"
          size="medium"
          onClick={() => setShowUpload(!showUpload)}
        >
          <FiUploadCloud className="w-4 h-4 mr-2" />
          Yeni Yükle
        </Button>
      </div>

      {/* Upload Zone */}
      {showUpload && (
        <Card title="Medya Yükle">
          <ImageUploadZone onUpload={handleUpload} />
        </Card>
      )}

      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary" />
            <Input
              type="text"
              placeholder="Dosya ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-text-secondary">
              {selectedIds.length} seçili
            </span>
            <Button
              variant="danger"
              size="small"
              onClick={handleDeleteSelected}
            >
              <FiTrash2 className="w-4 h-4 mr-1" />
              Sil
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={() => setSelectedIds([])}
            >
              Temizle
            </Button>
          </div>
        )}
      </div>

      {/* Media Gallery */}
      <Card>
        <MediaGalleryGrid
          images={filteredImages}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onImageClick={(image) => {
            console.log('Image clicked:', image);
            // TODO: Show preview modal
          }}
        />
      </Card>

      {/* Stats Footer */}
      <div className="flex justify-between items-center text-sm text-dark-text-secondary">
        <span>
          Toplam: {images.length} dosya
        </span>
        <span>
          Kullanılan Alan: {(images.reduce((acc, img) => acc + img.size, 0) / 1024 / 1024).toFixed(2)} MB
        </span>
      </div>
    </div>
  );
}
