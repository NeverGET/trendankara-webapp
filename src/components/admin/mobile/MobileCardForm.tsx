/**
 * Mobile Card Form Component
 * Form for creating and editing mobile cards
 * Requirements: 2.4, 2.5 - Card management interface
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button-reui';
import { Input } from '@/components/ui/input-reui';
import { Textarea } from '@/components/ui/textarea-reui';
import { Switch } from '@/components/ui/switch-reui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-reui';
import { MediaPickerDialog, MediaItem } from '../MediaPickerDialog';
import { Image, Link, Save, X } from 'lucide-react';
import type { MobileCard, CardInput } from '@/types/mobile';

interface MobileCardFormProps {
  card?: MobileCard | null;
  onSubmit: (data: CardInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MobileCardForm({
  card,
  onSubmit,
  onCancel,
  isLoading = false
}: MobileCardFormProps) {
  const [formData, setFormData] = useState<CardInput>({
    title: '',
    description: '',
    imageUrl: '',
    redirectUrl: '',
    isFeatured: false,
    displayOrder: 0,
    isActive: true
  });

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CardInput, string>>>({});

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title,
        description: card.description || '',
        imageUrl: card.imageUrl || '',
        redirectUrl: card.redirectUrl || '',
        isFeatured: card.isFeatured,
        displayOrder: card.displayOrder,
        isActive: card.isActive
      });
    }
  }, [card]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CardInput, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Başlık gerekli';
    }

    if (formData.title.length > 255) {
      newErrors.title = 'Başlık 255 karakterden uzun olamaz';
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Geçerli bir URL girin';
    }

    if (formData.redirectUrl && !isValidUrl(formData.redirectUrl)) {
      newErrors.redirectUrl = 'Geçerli bir URL girin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      // Try relative URL
      return string.startsWith('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    if (Array.isArray(media)) {
      // If multiple items selected, use the first one
      if (media.length > 0) {
        setFormData(prev => ({ ...prev, imageUrl: media[0].url }));
      }
    } else {
      // Single item selected
      setFormData(prev => ({ ...prev, imageUrl: media.url }));
    }
    setMediaPickerOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{card ? 'Kartı Düzenle' : 'Yeni Kart Oluştur'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Başlık *</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Kart başlığını girin"
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Açıklama</label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kart açıklaması (isteğe bağlı)"
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label htmlFor="imageUrl" className="text-sm font-medium">Görsel URL</label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaPickerOpen(true)}
                  disabled={isLoading}
                >
                  <Image className="h-4 w-4" />
                </Button>
              </div>
              {errors.imageUrl && (
                <p className="text-sm text-red-500">{errors.imageUrl}</p>
              )}
              {formData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={formData.imageUrl}
                    alt="Önizleme"
                    className="max-w-xs rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Redirect URL */}
            <div className="space-y-2">
              <label htmlFor="redirectUrl" className="text-sm font-medium">Yönlendirme URL</label>
              <div className="flex gap-2">
                <Input
                  id="redirectUrl"
                  value={formData.redirectUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                  placeholder="https://example.com veya /sayfa"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Link className="h-4 w-4 mt-3" />
              </div>
              {errors.redirectUrl && (
                <p className="text-sm text-red-500">{errors.redirectUrl}</p>
              )}
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <label htmlFor="displayOrder" className="text-sm font-medium">Sıralama</label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                min="0"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">
                Düşük değerler önce gösterilir
              </p>
            </div>

            {/* Featured Switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                disabled={isLoading}
              />
              <label htmlFor="isFeatured" className="text-sm font-medium">Öne Çıkan Kart</label>
            </div>

            {/* Active Switch */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                disabled={isLoading}
              />
              <label htmlFor="isActive" className="text-sm font-medium">Aktif</label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {card ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <MediaPickerDialog
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </>
  );
}