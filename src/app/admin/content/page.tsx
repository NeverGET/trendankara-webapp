'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Settings,
  ArrowRight,
  Smartphone
} from 'lucide-react';

// Simplified Mobile App Management Page
// Redirects to the appropriate mobile management sections

export default function AdminContentPage() {
  const router = useRouter();

  // No auto-redirect - let users choose where to go

  return (
    <div className="p-6 max-w-4xl mx-auto bg-dark-bg-primary min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Smartphone className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-dark-text-primary">Mobil Uygulama Yönetimi</h1>
        <p className="text-dark-text-secondary">
          Mobil uygulama içeriklerini buradan yönetebilirsiniz
        </p>
      </div>

      {/* Simple Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sponsorship Cards Management */}
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer bg-dark-surface-primary border-2 border-dark-border-primary hover:border-brand-red-500 text-dark-text-primary"
          onClick={() => router.push('/admin/mobile/cards')}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-brand-red-900/20 rounded-lg">
                  <CreditCard className="h-6 w-6 text-brand-red-500" />
                </div>
                <h2 className="text-xl font-semibold">Sponsorluk Kartları</h2>
              </div>
              <p className="text-dark-text-secondary mb-4">
                Mobil uygulamada gösterilecek sponsorluk kartlarını yönetin.
                Başlık, açıklama, görsel ve yönlendirme bağlantısı ekleyin.
              </p>
              <div className="text-sm text-dark-text-tertiary">
                • Basit kart yönetimi<br />
                • Görsel yükleme<br />
                • Sıralama ve öncelik<br />
                • Tek tıkla yayınlama
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-dark-text-tertiary flex-shrink-0 mt-1" />
          </div>
        </Card>

        {/* Mobile Settings */}
        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer bg-dark-surface-primary border-2 border-dark-border-primary hover:border-brand-red-500 text-dark-text-primary"
          onClick={() => router.push('/admin/mobile/settings')}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-dark-surface-secondary rounded-lg">
                  <Settings className="h-6 w-6 text-dark-text-secondary" />
                </div>
                <h2 className="text-xl font-semibold">Uygulama Ayarları</h2>
              </div>
              <p className="text-dark-text-secondary mb-4">
                Mobil uygulama genel ayarlarını ve oynatıcı logosunu yönetin.
                Versiyon kontrolü ayarları.
              </p>
              <div className="text-sm text-dark-text-tertiary">
                • Oynatıcı logosu<br />
                • Versiyon yönetimi<br />
                • Yayın URL testi<br />
                • Haber ve anket ayarları
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-dark-text-tertiary flex-shrink-0 mt-1" />
          </div>
        </Card>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-dark-surface-primary rounded-lg border border-dark-border-primary">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-5 w-5 rounded-full bg-brand-red-600 text-white flex items-center justify-center text-xs font-bold">
              i
            </div>
          </div>
          <div className="text-sm text-dark-text-secondary">
            <p className="font-medium mb-1 text-dark-text-primary">Basit ve Kolay Yönetim</p>
            <p>
              Mobil uygulama içerikleri artık çok daha basit!
              Sadece sponsorluk kartları ekleyin ve oynatıcı logonuzu yükleyin.
              Haberler ve anketler otomatik olarak mevcut sistemden alınır.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}