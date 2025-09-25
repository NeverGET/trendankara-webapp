'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { RadioSettingsForm } from '@/components/admin/RadioSettingsForm';
import { FiRadio, FiSettings, FiRefreshCw } from 'react-icons/fi';

interface RadioSettings {
  stationName: string;
  description: string;
  streamUrl: string;
  backupStreamUrl?: string;
  websiteUrl?: string;
  socialUrl?: string;
}

export default function RadioSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<RadioSettings | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Load current radio settings from database
  useEffect(() => {
    const loadRadioSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/radio');
        if (response.ok) {
          const data = await response.json();
          setInitialData(data);
        } else {
          console.error('Failed to load radio settings');
        }
      } catch (error) {
        console.error('Error loading radio settings:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadRadioSettings();
  }, []);

  const handleSubmit = async (data: RadioSettings) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings/radio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save radio settings');
      }

      // Refresh the data to show updated values
      const updatedData = await response.json();
      setInitialData(updatedData);

      // Show success feedback (could be enhanced with toast notifications)
      console.log('Radio settings saved successfully');
    } catch (error) {
      console.error('Error saving radio settings:', error);
      throw error; // Let the form handle the error display
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsDataLoading(true);
    window.location.reload();
  };

  if (isDataLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-dark-text-primary flex items-center gap-3">
            <FiRadio className="w-8 h-8 text-brand-red-600" />
            Radyo Ayarları
          </h1>
          <p className="text-dark-text-secondary mt-1">
            Radyo istasyonu konfigürasyonunu ve yayın ayarlarını yönetin
          </p>
        </div>

        {/* Loading Card */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <FiSettings className="w-5 h-5 text-brand-red-600" />
              <span>Yayın Konfigürasyonu</span>
            </div>
          }
        >
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-dark-text-secondary">
              <FiRefreshCw className="w-5 h-5 animate-spin" />
              <span>Mevcut ayarlar yükleniyor...</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-text-primary flex items-center gap-3">
            <FiRadio className="w-8 h-8 text-brand-red-600" />
            Radyo Ayarları
          </h1>
          <p className="text-dark-text-secondary mt-1">
            Radyo istasyonu konfigürasyonunu ve yayın ayarlarını yönetin
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm text-dark-text-secondary hover:text-dark-text-primary transition-colors duration-200"
          title="Sayfayı yenile"
        >
          <FiRefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {/* Current Stream Status */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FiSettings className="w-5 h-5 text-brand-red-600" />
            <span>Mevcut Yayın Durumu</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-dark-surface-secondary rounded-lg">
            <p className="text-sm text-dark-text-secondary mb-2">
              İstasyon Adı
            </p>
            <p className="text-dark-text-primary font-medium">
              {initialData?.stationName || 'Veri yükleniyor...'}
            </p>
          </div>

          <div className="p-4 bg-dark-surface-secondary rounded-lg">
            <p className="text-sm text-dark-text-secondary mb-2">
              Ana Stream URL
            </p>
            <p className="text-dark-text-primary font-mono text-sm break-all">
              {initialData?.streamUrl || 'Veri yükleniyor...'}
            </p>
          </div>

          {initialData?.backupStreamUrl && (
            <div className="p-4 bg-dark-surface-secondary rounded-lg">
              <p className="text-sm text-dark-text-secondary mb-2">
                Yedek Stream URL
              </p>
              <p className="text-dark-text-primary font-mono text-sm break-all">
                {initialData.backupStreamUrl}
              </p>
            </div>
          )}

          <div className="p-4 bg-dark-surface-secondary rounded-lg">
            <p className="text-sm text-dark-text-secondary mb-2">
              Yayın Durumu
            </p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-dark-text-primary">Aktif</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Radio Settings Form */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FiSettings className="w-5 h-5 text-brand-red-600" />
            <span>Yayın Konfigürasyonu</span>
          </div>
        }
      >
        <RadioSettingsForm
          initialData={initialData || undefined}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}