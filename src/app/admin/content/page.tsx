import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FiPlus, FiEdit, FiTrash2, FiSmartphone, FiLayout } from 'react-icons/fi';

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-dark-text-primary">
            Dinamik İçerik
          </h1>
          <p className="text-dark-text-secondary mt-1">
            Mobil uygulama için dinamik içerik sayfaları oluşturun
          </p>
        </div>
        <Button variant="primary" size="medium">
          <FiPlus className="w-4 h-4 mr-2" />
          Yeni Sayfa
        </Button>
      </div>

      {/* Content Pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium text-dark-text-primary mb-1">
                Sponsorluk Sayfası
              </h3>
              <p className="text-sm text-dark-text-secondary">
                {"Mobil ana sayfa banner'ı"}
              </p>
            </div>
            <FiSmartphone className="w-5 h-5 text-brand-red-600" />
          </div>

          <div className="flex items-center gap-2 text-xs text-dark-text-tertiary mb-4">
            <span>5 Bileşen</span>
            <span>•</span>
            <span>Aktif</span>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="small" fullWidth>
              <FiLayout className="w-4 h-4 mr-1" />
              Önizle
            </Button>
            <Button variant="ghost" size="small" fullWidth>
              <FiEdit className="w-4 h-4 mr-1" />
              Düzenle
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium text-dark-text-primary mb-1">
                Etkinlik Duyurusu
              </h3>
              <p className="text-sm text-dark-text-secondary">
                Konser bilgileri
              </p>
            </div>
            <FiSmartphone className="w-5 h-5 text-brand-red-600" />
          </div>

          <div className="flex items-center gap-2 text-xs text-dark-text-tertiary mb-4">
            <span>8 Bileşen</span>
            <span>•</span>
            <span>Taslak</span>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="small" fullWidth>
              <FiLayout className="w-4 h-4 mr-1" />
              Önizle
            </Button>
            <Button variant="ghost" size="small" fullWidth>
              <FiEdit className="w-4 h-4 mr-1" />
              Düzenle
            </Button>
          </div>
        </Card>

        {/* Add New Card */}
        <button className="min-h-[200px] border-2 border-dashed border-dark-border-secondary rounded-lg flex flex-col items-center justify-center gap-2 hover:border-dark-border-primary hover:bg-dark-surface-primary transition-all">
          <FiPlus className="w-8 h-8 text-dark-text-tertiary" />
          <span className="text-dark-text-secondary">Yeni Sayfa Ekle</span>
        </button>
      </div>

      {/* Component Library Info */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FiLayout className="w-5 h-5 text-brand-red-600" />
            <span>Bileşen Kütüphanesi</span>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {['Başlık', 'Metin', 'Resim', 'Buton', 'Kart', 'Liste', 'Video', 'Harita'].map((component) => (
            <div
              key={component}
              className="p-3 bg-dark-surface-secondary rounded text-center text-sm text-dark-text-secondary hover:bg-dark-surface-tertiary transition-colors"
            >
              {component}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
