/**
 * Mobile Settings Admin Page
 * Admin interface for managing mobile app settings
 * Requirements: 3.1, 3.4 - Settings management page
 */

'use client';

import { useState, useEffect } from 'react';
import { MobileSettingsForm } from '@/components/admin/mobile/MobileSettingsForm';
import { MobileStatsCard } from '@/components/admin/mobile/MobileStatsCard';
import { toast } from 'sonner';
import type { MobileSettings } from '@/types/mobile';
import {
  Smartphone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function MobileSettingsPage() {
  const [settings, setSettings] = useState<MobileSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/mobile/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        if (data.lastUpdated) {
          setLastUpdated(new Date(data.lastUpdated));
        }
      } else {
        toast.error('Ayarlar yüklenemedi');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Ayarlar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (updatedSettings: MobileSettings) => {
    try {
      const response = await fetch('/api/admin/mobile/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      if (response.ok) {
        toast.success('Ayarlar başarıyla kaydedildi');
        setSettings(updatedSettings);
        setLastUpdated(new Date());
      } else {
        const error = await response.json();
        toast.error(error.message || 'Ayarlar kaydedilemedi');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    }
  };

  // Calculate statistics
  const getSystemStatus = () => {
    if (!settings) return { status: 'loading', color: 'blue' as const };
    if (settings.maintenanceMode) return { status: 'maintenance', color: 'yellow' as const };
    if (!settings.enableNews && !settings.enablePolls) return { status: 'limited', color: 'yellow' as const };
    return { status: 'active', color: 'green' as const };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mobil Uygulama Ayarları</h1>
          <p className="text-gray-500 mt-1">
            Mobil uygulama yapılandırmasını yönetin
          </p>
        </div>
        {lastUpdated && (
          <div className="text-sm text-gray-500">
            Son güncelleme: {lastUpdated.toLocaleString('tr-TR')}
          </div>
        )}
      </div>

      {/* Statistics */}
      {settings && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MobileStatsCard
            title="Sistem Durumu"
            value={
              systemStatus.status === 'active' ? 'Aktif' :
              systemStatus.status === 'maintenance' ? 'Bakımda' :
              systemStatus.status === 'limited' ? 'Kısıtlı' : 'Yükleniyor'
            }
            icon={
              systemStatus.status === 'active' ? CheckCircle :
              systemStatus.status === 'maintenance' ? AlertTriangle :
              systemStatus.status === 'limited' ? AlertTriangle : RefreshCw
            }
            color={systemStatus.color}
            description={
              systemStatus.status === 'active' ? 'Tüm özellikler aktif' :
              systemStatus.status === 'maintenance' ? 'Bakım modu açık' :
              systemStatus.status === 'limited' ? 'Bazı özellikler kapalı' : 'Ayarlar yükleniyor'
            }
          />
          <MobileStatsCard
            title="Uygulama Versiyonu"
            value={settings.appVersion}
            icon={Smartphone}
            color="blue"
            description={`Min: ${settings.minAppVersion}`}
          />
          <MobileStatsCard
            title="Haberler"
            value={settings.enableNews ? 'Aktif' : 'Kapalı'}
            icon={settings.enableNews ? CheckCircle : XCircle}
            color={settings.enableNews ? 'green' : 'red'}
            description={settings.enableNews ? `Maks: ${settings.maxNewsCount}` : 'Devre dışı'}
          />
          <MobileStatsCard
            title="Anketler"
            value={settings.enablePolls ? 'Aktif' : 'Kapalı'}
            icon={settings.enablePolls ? CheckCircle : XCircle}
            color={settings.enablePolls ? 'green' : 'red'}
            description={
              settings.enablePolls 
                ? (settings.showOnlyLastActivePoll ? 'Sadece son anket' : 'Tüm anketler')
                : 'Devre dışı'
            }
          />
        </div>
      )}

      {/* Settings Form */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-12 w-full bg-gray-200 animate-pulse rounded" />
          <div className="h-64 w-full bg-gray-200 animate-pulse rounded" />
          <div className="h-64 w-full bg-gray-200 animate-pulse rounded" />
        </div>
      ) : settings ? (
        <MobileSettingsForm
          settings={settings}
          onSave={handleSaveSettings}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Ayarlar yüklenemedi</p>
        </div>
      )}
    </div>
  );
}