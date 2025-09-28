/**
 * Mobile Card Form Component
 * Form for creating and editing mobile cards with advanced contact options
 * Requirements: 2.4, 2.5 - Card management interface with time limits and multiple redirect options
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button-reui';
import { Input } from '@/components/ui/input-reui';
import { Textarea } from '@/components/ui/textarea-reui';
import { Switch } from '@/components/ui/switch-reui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-reui';
import { cn } from '@/lib/utils';
import { MediaPickerDialog, MediaItem } from '../MediaPickerDialog';
import { MapPicker } from '../MapPicker';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import {
  Image,
  Save,
  X,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  ImageOff
} from 'lucide-react';
import {
  FaWhatsapp,
  FaInstagram,
  FaTiktok
} from 'react-icons/fa';
import type { MobileCard } from '@/types/mobile';

interface MobileCardFormProps {
  card?: MobileCard | null;
  onSubmit: (data: Partial<MobileCard>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function MobileCardForm({
  card,
  onSubmit,
  onCancel,
  isLoading = false
}: MobileCardFormProps) {
  const [formData, setFormData] = useState<Partial<MobileCard>>({
    title: '',
    description: '',
    imageUrl: '',
    redirectType: undefined,
    redirectUrl: '',
    contactEmail: '',
    contactPhone: '',
    contactWhatsapp: '',
    socialInstagram: '',
    socialTiktok: '',
    locationLatitude: undefined,
    locationLongitude: undefined,
    locationAddress: '',
    isTimeLimited: false,
    validFrom: '',
    validUntil: '',
    isFeatured: false,
    displayOrder: 0,
    isActive: true
  });

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof MobileCard, string>>>({});
  const [hasContactOptions, setHasContactOptions] = useState(false);

  useEffect(() => {
    if (card) {
      setFormData({
        ...card,
        validFrom: card.validFrom ? formatDateForInput(card.validFrom) : '',
        validUntil: card.validUntil ? formatDateForInput(card.validUntil) : ''
      });
      // Set hasContactOptions if card has any contact info
      setHasContactOptions(!!card.redirectType);
    }
  }, [card]);

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    if (Array.isArray(media) && media.length > 0) {
      setFormData(prev => ({ ...prev, imageUrl: media[0].url }));
    } else if (media && !Array.isArray(media)) {
      setFormData(prev => ({ ...prev, imageUrl: media.url }));
    }
    setMediaPickerOpen(false);
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    setFormData(prev => ({
      ...prev,
      locationLatitude: location.latitude,
      locationLongitude: location.longitude,
      locationAddress: location.address || ''
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MobileCard, string>> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Başlık zorunludur';
    }

    // Validate based on redirect type
    switch (formData.redirectType) {
      case 'email':
        if (!formData.contactEmail?.trim()) {
          newErrors.contactEmail = 'E-posta adresi zorunludur';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
          newErrors.contactEmail = 'Geçerli bir e-posta adresi girin';
        }
        break;
      case 'phone':
        if (!formData.contactPhone?.trim()) {
          newErrors.contactPhone = 'Telefon numarası zorunludur';
        }
        break;
      case 'whatsapp':
        if (!formData.contactWhatsapp?.trim()) {
          newErrors.contactWhatsapp = 'WhatsApp numarası zorunludur';
        }
        break;
      case 'instagram':
        if (!formData.socialInstagram?.trim()) {
          newErrors.socialInstagram = 'Instagram profil linki zorunludur';
        }
        break;
      case 'tiktok':
        if (!formData.socialTiktok?.trim()) {
          newErrors.socialTiktok = 'TikTok profil linki zorunludur';
        }
        break;
      case 'location':
        if (!formData.locationLatitude || !formData.locationLongitude) {
          newErrors.locationLatitude = 'Konum seçimi zorunludur';
        }
        break;
      case 'website':
        if (!formData.redirectUrl?.trim()) {
          newErrors.redirectUrl = 'Web sitesi adresi zorunludur';
        }
        break;
    }

    // Validate time limits
    if (formData.isTimeLimited) {
      if (!formData.validFrom) {
        newErrors.validFrom = 'Başlangıç tarihi zorunludur';
      }
      if (!formData.validUntil) {
        newErrors.validUntil = 'Bitiş tarihi zorunludur';
      }
      if (formData.validFrom && formData.validUntil) {
        const from = new Date(formData.validFrom);
        const until = new Date(formData.validUntil);
        if (from >= until) {
          newErrors.validUntil = 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const redirectTypeOptions = [
    { value: 'website', label: 'Web Sitesi', icon: Globe },
    { value: 'email', label: 'E-posta', icon: Mail },
    { value: 'phone', label: 'Telefon', icon: Phone },
    { value: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp },
    { value: 'instagram', label: 'Instagram', icon: FaInstagram },
    { value: 'tiktok', label: 'TikTok', icon: FaTiktok },
    { value: 'location', label: 'Konum', icon: MapPin }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Başlık *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Sponsor kartı başlığı"
              disabled={isLoading}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Açıklama
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Sponsor kartı açıklaması"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Görsel
            </label>
            <div className="flex gap-2">
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="Görsel URL'si"
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
            {formData.imageUrl && (
              <div className="mt-2 h-20 w-32 relative">
                <img
                  alt="Kart görseli önizleme"
                  src={formData.imageUrl}
                  className="h-full w-full object-cover rounded bg-dark-surface-primary"
                  onError={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="h-full w-full bg-dark-surface-primary rounded flex items-center justify-center">
                          <svg class="h-8 w-8 text-dark-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact/Redirect Options */}
      <Card>
        <CardHeader>
          <CardTitle>İletişim Seçenekleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={hasContactOptions}
              onCheckedChange={(checked) => {
                setHasContactOptions(checked);
                if (!checked) {
                  // Clear contact options when disabled
                  setFormData(prev => ({
                    ...prev,
                    redirectType: undefined,
                    redirectUrl: '',
                    contactEmail: '',
                    contactPhone: '',
                    contactWhatsapp: '',
                    socialInstagram: '',
                    socialTiktok: '',
                    locationLatitude: undefined,
                    locationLongitude: undefined,
                    locationAddress: ''
                  }));
                }
              }}
              disabled={isLoading}
            />
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              İletişim seçenekleri ekle
            </label>
          </div>

          {hasContactOptions && (
            <>
          <div>
            <label className="text-sm font-medium mb-2 block">
              İletişim Türü
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {redirectTypeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.redirectType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, redirectType: option.value as any }))}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <Icon className={cn("h-5 w-5", isSelected && "text-primary")} />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic fields based on redirect type */}
          {formData.redirectType === 'website' && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                Web Sitesi URL&apos;si
              </label>
              <Input
                value={formData.redirectUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                placeholder="https://example.com"
                disabled={isLoading}
                className={errors.redirectUrl ? 'border-red-500' : ''}
              />
              {errors.redirectUrl && (
                <p className="text-red-500 text-sm mt-1">{errors.redirectUrl}</p>
              )}
            </div>
          )}

          {formData.redirectType === 'email' && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                E-posta Adresi
              </label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="sponsor@example.com"
                disabled={isLoading}
                className={errors.contactEmail ? 'border-red-500' : ''}
              />
              {errors.contactEmail && (
                <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>
              )}
            </div>
          )}

          {formData.redirectType === 'phone' && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                Telefon Numarası
              </label>
              <Input
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="+90 555 123 4567"
                disabled={isLoading}
                className={errors.contactPhone ? 'border-red-500' : ''}
              />
              {errors.contactPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>
              )}
            </div>
          )}

          {formData.redirectType === 'whatsapp' && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                WhatsApp Numarası
              </label>
              <Input
                value={formData.contactWhatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, contactWhatsapp: e.target.value }))}
                placeholder="+90 555 123 4567"
                disabled={isLoading}
                className={errors.contactWhatsapp ? 'border-red-500' : ''}
              />
              {errors.contactWhatsapp && (
                <p className="text-red-500 text-sm mt-1">{errors.contactWhatsapp}</p>
              )}
              <p className="text-sm text-dark-text-tertiary mt-1">
                Ülke koduyla birlikte girin (örn: +90 için)
              </p>
            </div>
          )}

          {formData.redirectType === 'instagram' && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                Instagram Profil Linki
              </label>
              <Input
                value={formData.socialInstagram}
                onChange={(e) => setFormData(prev => ({ ...prev, socialInstagram: e.target.value }))}
                placeholder="https://instagram.com/username"
                disabled={isLoading}
                className={errors.socialInstagram ? 'border-red-500' : ''}
              />
              {errors.socialInstagram && (
                <p className="text-red-500 text-sm mt-1">{errors.socialInstagram}</p>
              )}
            </div>
          )}

          {formData.redirectType === 'tiktok' && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                TikTok Profil Linki
              </label>
              <Input
                value={formData.socialTiktok}
                onChange={(e) => setFormData(prev => ({ ...prev, socialTiktok: e.target.value }))}
                placeholder="https://tiktok.com/@username"
                disabled={isLoading}
                className={errors.socialTiktok ? 'border-red-500' : ''}
              />
              {errors.socialTiktok && (
                <p className="text-red-500 text-sm mt-1">{errors.socialTiktok}</p>
              )}
            </div>
          )}

          {formData.redirectType === 'location' && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                Konum
              </label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMapPickerOpen(true)}
                  className="w-full justify-start"
                  disabled={isLoading}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {formData.locationLatitude && formData.locationLongitude
                    ? `Konum seçildi: ${formData.locationLatitude.toFixed(6)}, ${formData.locationLongitude.toFixed(6)}`
                    : 'Haritadan konum seçin'
                  }
                </Button>
                {formData.locationAddress && (
                  <p className="text-sm text-dark-text-tertiary">
                    <strong>Adres:</strong> {formData.locationAddress}
                  </p>
                )}
                {errors.locationLatitude && (
                  <p className="text-red-500 text-sm">{errors.locationLatitude}</p>
                )}
              </div>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Time Limit Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Zaman Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isTimeLimited || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isTimeLimited: checked }))}
              disabled={isLoading}
            />
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Zaman sınırlı kart
            </label>
          </div>

          {formData.isTimeLimited && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <DateTimePicker
                  label="Başlangıç Tarihi ve Saati *"
                  value={formData.validFrom}
                  onChange={(datetime) => setFormData(prev => ({ ...prev, validFrom: datetime }))}
                  placeholder="Başlangıç tarihi ve saati seçin"
                  disabled={isLoading}
                  error={!!errors.validFrom}
                  minDate={new Date()}
                />
                {errors.validFrom && (
                  <p className="text-red-500 text-sm">{errors.validFrom}</p>
                )}
              </div>

              <div className="space-y-2">
                <DateTimePicker
                  label="Bitiş Tarihi ve Saati *"
                  value={formData.validUntil}
                  onChange={(datetime) => setFormData(prev => ({ ...prev, validUntil: datetime }))}
                  placeholder="Bitiş tarihi ve saati seçin"
                  disabled={isLoading}
                  error={!!errors.validUntil}
                  minDate={formData.validFrom ? new Date(formData.validFrom) : new Date()}
                />
                {errors.validUntil && (
                  <p className="text-red-500 text-sm">{errors.validUntil}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Görünüm Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isFeatured || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
              disabled={isLoading}
            />
            <label className="text-sm font-medium">
              Öne çıkan kart
            </label>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Sıralama
            </label>
            <Input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
              min="0"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Küçük sayılar önce gösterilir
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.isActive || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              disabled={isLoading}
            />
            <label className="text-sm font-medium">
              Aktif
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-1" />
          İptal
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-1" />
          {card ? 'Güncelle' : 'Oluştur'}
        </Button>
      </div>

      {/* Media Picker Dialog */}
      <MediaPickerDialog
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        accept="image/*"
      />

      {/* Map Picker Dialog */}
      <MapPicker
        isOpen={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onSelect={handleLocationSelect}
        initialLocation={
          formData.locationLatitude && formData.locationLongitude
            ? { latitude: formData.locationLatitude, longitude: formData.locationLongitude }
            : undefined
        }
      />
    </form>
  );
}