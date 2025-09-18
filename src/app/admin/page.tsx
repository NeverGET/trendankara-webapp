import { StatsCard } from '@/components/admin/StatsCard';
import {
  FiFileText,
  FiBarChart2,
  FiImage,
  FiActivity
} from 'react-icons/fi';

async function fetchDashboardStats() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalNews: 0,
      totalPolls: 0,
      activePolls: 0,
      totalMedia: 0
    };
  }
}

export default async function AdminDashboardPage() {
  const stats = await fetchDashboardStats();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-text-primary">
          Yönetim Paneli
        </h1>
        <p className="text-dark-text-secondary mt-1">
          Site yönetimine genel bakış
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Toplam Haber"
          value={stats.totalNews}
          icon={<FiFileText className="w-5 h-5" />}
        />

        <StatsCard
          title="Toplam Anket"
          value={stats.totalPolls}
          icon={<FiBarChart2 className="w-5 h-5" />}
        />

        <StatsCard
          title="Aktif Anket"
          value={stats.activePolls}
          icon={<FiActivity className="w-5 h-5" />}
          trend={stats.activePolls > 0 ? { value: 100, isPositive: true } : undefined}
        />

        <StatsCard
          title="Medya Dosyaları"
          value={stats.totalMedia}
          icon={<FiImage className="w-5 h-5" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-dark-surface-primary rounded-lg border border-dark-border-primary p-6">
        <h2 className="text-xl font-semibold text-dark-text-primary mb-4">
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/admin/news"
            className="p-4 bg-dark-surface-secondary rounded-lg hover:bg-dark-surface-tertiary transition-colors text-center"
          >
            <FiFileText className="w-8 h-8 mx-auto mb-2 text-brand-red-600" />
            <span className="text-sm text-dark-text-primary">Yeni Haber</span>
          </a>

          <a
            href="/admin/polls"
            className="p-4 bg-dark-surface-secondary rounded-lg hover:bg-dark-surface-tertiary transition-colors text-center"
          >
            <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-brand-red-600" />
            <span className="text-sm text-dark-text-primary">Yeni Anket</span>
          </a>

          <a
            href="/admin/media"
            className="p-4 bg-dark-surface-secondary rounded-lg hover:bg-dark-surface-tertiary transition-colors text-center"
          >
            <FiImage className="w-8 h-8 mx-auto mb-2 text-brand-red-600" />
            <span className="text-sm text-dark-text-primary">Medya Yükle</span>
          </a>

          <a
            href="/admin/settings"
            className="p-4 bg-dark-surface-secondary rounded-lg hover:bg-dark-surface-tertiary transition-colors text-center"
          >
            <FiActivity className="w-8 h-8 mx-auto mb-2 text-brand-red-600" />
            <span className="text-sm text-dark-text-primary">Ayarlar</span>
          </a>
        </div>
      </div>
    </div>
  );
}
