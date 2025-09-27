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
import {
  Save,
  Settings,
  Newspaper,
  Vote,
  Play,
  Smartphone,
  CreditCard,
  AlertCircle
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
  const [activeTab, setActiveTab] = useState('app');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

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

  return (
    <div className="space-y-6">
      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Kaydedilmemiş değişiklikler var. Değişiklikleri kaydetmeyi unutmayın.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Custom Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'app', label: 'Uygulama', icon: Smartphone },
              { id: 'polls', label: 'Anketler', icon: Vote },
              { id: 'news', label: 'Haberler', icon: Newspaper },
              { id: 'player', label: 'Oynatıcı', icon: Play },
              { id: 'cards', label: 'Kartlar', icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* App Settings */}
        {activeTab === 'app' && (
          <Card>
            <CardHeader>
              <CardTitle>Uygulama Ayarları</CardTitle>
              <CardDescription>
                Mobil uygulama versiyon ve bakım ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="appVersion" className="text-sm font-medium">Mevcut Versiyon</label>
                  <Input
                    id="appVersion"
                    value={settings.appVersion}
                    onChange={(e) => updateSetting('appVersion', e.target.value)}
                    placeholder="1.0.0"
                    disabled={isLoading || isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="minAppVersion" className="text-sm font-medium">Minimum Versiyon</label>
                  <Input
                    id="minAppVersion"
                    value={settings.minAppVersion}
                    onChange={(e) => updateSetting('minAppVersion', e.target.value)}
                    placeholder="1.0.0"
                    disabled={isLoading || isSaving}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="forceUpdate"
                  checked={settings.forceUpdate}
                  onCheckedChange={(checked) => updateSetting('forceUpdate', checked)}
                  disabled={isLoading || isSaving}
                />
                <label htmlFor="forceUpdate" className="text-sm font-medium">Zorunlu Güncelleme</label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                  disabled={isLoading || isSaving}
                />
                <label htmlFor="maintenanceMode" className="text-sm font-medium">Bakım Modu</label>
              </div>

              {settings.maintenanceMode && (
                <div className="space-y-2">
                  <label htmlFor="maintenanceMessage" className="text-sm font-medium">Bakım Mesajı</label>
                  <Textarea
                    id="maintenanceMessage"
                    value={settings.maintenanceMessage}
                    onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                    placeholder="Sistem bakımda, lütfen daha sonra tekrar deneyin."
                    rows={3}
                    disabled={isLoading || isSaving}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Poll Settings */}
        {activeTab === 'polls' && (
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
        )}

        {/* News Settings */}
        {activeTab === 'news' && (
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
                      checked={settings.enableBreakingNews}
                      onCheckedChange={(checked) => updateSetting('enableBreakingNews', checked)}
                      disabled={isLoading || isSaving}
                    />
                    <label htmlFor="enableBreakingNews" className="text-sm font-medium">Son Dakika Haberlerini Etkinleştir</label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Player Settings */}
        {activeTab === 'player' && (
          <Card>
            <CardHeader>
              <CardTitle>Oynatıcı Ayarları</CardTitle>
              <CardDescription>
                Mobil radyo oynatıcı ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="streamUrl" className="text-sm font-medium">Yayın URL</label>
                <Input
                  id="streamUrl"
                  value={settings.streamUrl}
                  onChange={(e) => updateSetting('streamUrl', e.target.value)}
                  placeholder="https://example.com/stream"
                  disabled={isLoading || isSaving}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="playerBackgroundUrl" className="text-sm font-medium">Arka Plan Görseli URL</label>
                <Input
                  id="playerBackgroundUrl"
                  value={settings.playerBackgroundUrl || ''}
                  onChange={(e) => updateSetting('playerBackgroundUrl', e.target.value || null)}
                  placeholder="https://example.com/background.jpg (isteğe bağlı)"
                  disabled={isLoading || isSaving}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableLiveInfo"
                  checked={settings.enableLiveInfo}
                  onCheckedChange={(checked) => updateSetting('enableLiveInfo', checked)}
                  disabled={isLoading || isSaving}
                />
                <label htmlFor="enableLiveInfo" className="text-sm font-medium">Canlı Yayın Bilgilerini Göster</label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card Settings */}
        {activeTab === 'cards' && (
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
                    value={settings.maxNormalCards}
                    onChange={(e) => updateSetting('maxNormalCards', parseInt(e.target.value) || 20)}
                    min="0"
                    max="100"
                    disabled={isLoading || isSaving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
    </div>
  );
}