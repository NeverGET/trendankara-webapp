import { Card } from '@/components/ui/Card';
import { PasswordChangeForm } from '@/components/admin/PasswordChangeForm';
import { FiLock, FiUser, FiRadio } from 'react-icons/fi';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-text-primary">
          Ayarlar
        </h1>
        <p className="text-dark-text-secondary mt-1">
          Sistem ayarlarını ve profilinizi yönetin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Change Card */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <FiLock className="w-5 h-5 text-brand-red-600" />
              <span>Şifre Değiştir</span>
            </div>
          }
        >
          <PasswordChangeForm />
        </Card>

        {/* Profile Settings Card */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <FiUser className="w-5 h-5 text-brand-red-600" />
              <span>Profil Bilgileri</span>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Kullanıcı Adı
              </label>
              <p className="text-dark-text-primary">admin</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Rol
              </label>
              <p className="text-dark-text-primary">Yönetici</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Son Giriş
              </label>
              <p className="text-dark-text-primary">Şimdi</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Radio Settings */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FiRadio className="w-5 h-5 text-brand-red-600" />
            <span>Radyo Ayarları</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-dark-surface-secondary rounded-lg">
            <p className="text-sm text-dark-text-secondary mb-2">
              Yayın Durumu
            </p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-dark-text-primary">Aktif</span>
            </div>
          </div>

          <div className="p-4 bg-dark-surface-secondary rounded-lg">
            <p className="text-sm text-dark-text-secondary mb-2">
              Yayın URL
            </p>
            <p className="text-dark-text-primary font-mono text-sm">
              https://radyo.yayin.com.tr:5132/stream
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
