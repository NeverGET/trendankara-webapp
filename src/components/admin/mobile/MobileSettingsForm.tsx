/**
 * Mobile Settings Form Component
 * Configuration form for mobile app settings
 * Requirements: 1.8, 1.9, 3.1 - Settings management interface
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card-reui';
import { Button } from '@/components/ui/button-reui';
import { Input } from '@/components/ui/input-reui';
import { Textarea } from '@/components/ui/textarea-reui';
import { Switch } from '@/components/ui/switch-reui';
import { Alert, AlertDescription } from '@/components/ui/alert-reui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-reui';
import { MediaPickerDialog, MediaItem } from '../MediaPickerDialog';
import {
  Save,
  Settings,
  Newspaper,
  Vote,
  Play,
  Smartphone,
  CreditCard,
  AlertCircle,
  Image,
  Radio,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Facebook,
  Instagram,
  MessageCircle,
  Phone
} from 'lucide-react';
import type { MobileSettings } from '@/types/mobile';

interface MobileSettingsFormProps {
  settings: MobileSettings;
  onSave: (settings: MobileSettings) => Promise<void>;
  isLoading?: boolean;
}

export function MobileSettingsForm({
  settings: initialSettings,
  onSave,
  isLoading = false
}: MobileSettingsFormProps) {
  const [settings, setSettings] = useState<MobileSettings>(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [isTestingStream, setIsTestingStream] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setSettings(initialSettings);
    // Fetch the actual stream URL from radio settings
    fetchStreamUrl();
  }, [initialSettings]);

  const fetchStreamUrl = async () => {
    try {
      const response = await fetch('/api/admin/settings/radio');
      if (response.ok) {
        const data = await response.json();
        // The API returns the settings directly, not wrapped in a 'settings' property
        if (data.stream_url) {
          setStreamUrl(data.stream_url);
        }
      } else if (response.status === 404) {
        // No radio settings found, show a default message
        setStreamUrl('Radyo ayarları henüz yapılandırılmamış');
      } else {
        setStreamUrl('Radyo ayarları yüklenemedi');
      }
    } catch (error) {
      console.error('Error fetching stream URL:', error);
      setStreamUrl('Radyo ayarları yüklenemedi');
    }
  };

  const testStreamConnection = async () => {
    if (!streamUrl || !streamUrl.startsWith('http')) return;

    setIsTestingStream(true);
    setTestResult(null);
    try {
      // Test the stream connection
      const response = await fetch('/api/admin/settings/radio/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamUrl: streamUrl })  // API expects camelCase
      });

      const data = await response.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Bağlantı başarılı! ${data.metadata?.name || 'Yayın'} aktif.`
        });
      } else {
        setTestResult({
          success: false,
          message: 'Bağlantı başarısız! Yayın URL\'sini kontrol edin.'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test sırasında bir hata oluştu.'
      });
    } finally {
      setIsTestingStream(false);
    }
  };

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(initialSettings));
  }, [settings, initialSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof MobileSettings>(
    key: K,
    value: MobileSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleMediaSelect = (media: MediaItem | MediaItem[]) => {
    if (Array.isArray(media)) {
      // If multiple items selected, use the first one
      if (media.length > 0) {
        updateSetting('playerLogoUrl', media[0].url);
      }
    } else {
      // Single item selected
      updateSetting('playerLogoUrl', media.url);
    }
    setMediaPickerOpen(false);
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <Alert className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <AlertDescription className="flex-1">
            Kaydedilmemiş değişiklikler var. Değişiklikleri kaydetmeyi unutmayın.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="polls" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="polls" className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Anketler
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Haberler
          </TabsTrigger>
          <TabsTrigger value="player" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Oynatıcı
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Kartlar
          </TabsTrigger>
        </TabsList>

        {/* Poll Settings */}
        <TabsContent value="polls">
          <Card>
            <CardHeader>
              <CardTitle>Anket Ayarları</CardTitle>
              <CardDescription>
                Mobil uygulamada anket gösterimi ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enablePolls"
                  checked={settings.enablePolls}
                  onCheckedChange={(checked) => updateSetting('enablePolls', checked)}
                  disabled={isLoading || isSaving}
                />
                <label htmlFor="enablePolls" className="text-sm font-medium">Anketleri Etkinleştir</label>
              </div>

              {settings.enablePolls && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showOnlyLastActivePoll"
                    checked={settings.showOnlyLastActivePoll}
                    onCheckedChange={(checked) => updateSetting('showOnlyLastActivePoll', checked)}
                    disabled={isLoading || isSaving}
                  />
                  <label htmlFor="showOnlyLastActivePoll" className="text-sm font-medium">
                    Sadece Son Aktif Anketi Göster
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* News Settings */}
        <TabsContent value="news">
          <Card>
            <CardHeader>
              <CardTitle>Haber Ayarları</CardTitle>
              <CardDescription>
                Mobil uygulamada haber gösterimi ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableNews"
                  checked={settings.enableNews}
                  onCheckedChange={(checked) => updateSetting('enableNews', checked)}
                  disabled={isLoading || isSaving}
                />
                <label htmlFor="enableNews" className="text-sm font-medium">Haberleri Etkinleştir</label>
              </div>

              {settings.enableNews && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="maxNewsCount" className="text-sm font-medium">Maksimum Haber Sayısı</label>
                    <Input
                      id="maxNewsCount"
                      type="number"
                      value={settings.maxNewsCount}
                      onChange={(e) => updateSetting('maxNewsCount', parseInt(e.target.value) || 100)}
                      min="1"
                      max="500"
                      disabled={isLoading || isSaving}
                    />
                    <p className="text-sm text-gray-500">
                      Mobil uygulamada gösterilecek maksimum haber sayısı
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableBreakingNews"
                      checked={false}
                      onCheckedChange={() => {}}
                      disabled={isLoading || isSaving}
                    />
                    <label htmlFor="enableBreakingNews" className="text-sm font-medium">Son Dakika Haberlerini Etkinleştir</label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Player Settings */}
        <TabsContent value="player">
          <Card>
            <CardHeader>
              <CardTitle>Oynatıcı Ayarları</CardTitle>
              <CardDescription>
                Mobil radyo oynatıcı ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stream URL Display with Test Button */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Radyo Yayın URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-md border min-h-[36px] flex items-center">
                    <code className="text-sm text-muted-foreground break-all">
                      {streamUrl || 'Yükleniyor...'}
                    </code>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testStreamConnection}
                    disabled={isLoading || isSaving || isTestingStream || !streamUrl || !streamUrl.startsWith('http')}
                    className="flex items-center gap-2"
                  >
                    {isTestingStream ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                        Test ediliyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Test Et
                      </>
                    )}
                  </Button>
                </div>
                {testResult && (
                  <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  Web sitesi ile aynı yayın URL&apos;si kullanılır. Radyo Ayarları&apos;ndan değiştirilebilir.
                </p>
              </div>

              {/* Player Logo Upload */}
              <div className="space-y-2">
                <label htmlFor="playerLogo" className="text-sm font-medium">Oynatıcı Logosu</label>
                <div className="flex gap-2">
                  <Input
                    id="playerLogo"
                    value={settings.playerLogoUrl || ''}
                    onChange={(e) => updateSetting('playerLogoUrl', e.target.value || undefined)}
                    placeholder="https://example.com/logo.png (isteğe bağlı)"
                    disabled={isLoading || isSaving}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMediaPickerOpen(true)}
                    disabled={isLoading || isSaving}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Mobil oynatıcıda gösterilecek özel logo (isteğe bağlı)
                </p>
                {settings.playerLogoUrl && (
                  <div className="mt-2">
                    <img
                      alt="Oynatıcı logosu önizleme"
                      src={settings.playerLogoUrl}
                      className="max-w-xs max-h-20 rounded-lg border object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableLiveInfo"
                  checked={settings.enableLiveInfo || false}
                  onCheckedChange={(checked) => updateSetting('enableLiveInfo', checked)}
                  disabled={isLoading || isSaving}
                />
                <label htmlFor="enableLiveInfo" className="text-sm font-medium">Canlı Yayın Bilgilerini Göster</label>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium">Sosyal Medya Bağlantıları</h4>

                <div className="space-y-2">
                  <label htmlFor="playerFacebookUrl" className="text-sm font-medium flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </label>
                  <Input
                    id="playerFacebookUrl"
                    value={settings.playerFacebookUrl || ''}
                    onChange={(e) => updateSetting('playerFacebookUrl', e.target.value || undefined)}
                    placeholder="https://facebook.com/yourpage"
                    disabled={isLoading || isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="playerInstagramUrl" className="text-sm font-medium flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </label>
                  <Input
                    id="playerInstagramUrl"
                    value={settings.playerInstagramUrl || ''}
                    onChange={(e) => updateSetting('playerInstagramUrl', e.target.value || undefined)}
                    placeholder="https://instagram.com/yourpage"
                    disabled={isLoading || isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="playerWhatsappNumber" className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </label>
                  <Input
                    id="playerWhatsappNumber"
                    value={settings.playerWhatsappNumber || ''}
                    onChange={(e) => updateSetting('playerWhatsappNumber', e.target.value || undefined)}
                    placeholder="905551234567 (ülke koduyla birlikte)"
                    disabled={isLoading || isSaving}
                  />
                  <p className="text-sm text-gray-500">
                    Ülke koduyla birlikte, başında + olmadan yazın (örn: 905551234567)
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="liveCallPhoneNumber" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Canlı Yayın Hattı
                  </label>
                  <Input
                    id="liveCallPhoneNumber"
                    value={settings.liveCallPhoneNumber || ''}
                    onChange={(e) => updateSetting('liveCallPhoneNumber', e.target.value || undefined)}
                    placeholder="0312 555 12 34 (dinleyicilerin arayabileceği numara)"
                    disabled={isLoading || isSaving}
                  />
                  <p className="text-sm text-gray-500">
                    Dinleyicilerin canlı yayına katılmak için arayabileceği telefon numarası
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Card Settings */}
        <TabsContent value="cards">
          <Card>
            <CardHeader>
              <CardTitle>Kart Limitleri</CardTitle>
              <CardDescription>
                Mobil uygulamada gösterilecek kart sayı limitleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="maxFeaturedCards" className="text-sm font-medium">Maks. Öne Çıkan Kart</label>
                  <Input
                    id="maxFeaturedCards"
                    type="number"
                    value={settings.maxFeaturedCards}
                    onChange={(e) => updateSetting('maxFeaturedCards', parseInt(e.target.value) || 5)}
                    min="0"
                    max="20"
                    disabled={isLoading || isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="maxNormalCards" className="text-sm font-medium">Maks. Normal Kart</label>
                  <Input
                    id="maxNormalCards"
                    type="number"
                    value={20}
                    onChange={() => {}}
                    min="0"
                    max="100"
                    disabled={isLoading || isSaving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isLoading || isSaving}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </Button>
      </div>

      <MediaPickerDialog
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        accept="image/*"
      />
    </div>
  );
}