import { StatsCard } from '@/components/admin/StatsCard';
import { RadioStatsCard } from '@/components/admin/RadioStatsCard';
import { AdminDashboardGrid, ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import {
  FiFileText,
  FiBarChart2,
  FiImage,
  FiActivity,
  FiRadio,
  FiUsers
} from 'react-icons/fi';
import { headers } from 'next/headers';

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic';

async function fetchDashboardStats() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';

    const response = await fetch(`${baseUrl}/api/admin/dashboard/stats`, {
      cache: 'no-store',
      headers: {
        cookie: cookie
      }
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
      totalMedia: 0,
      currentListeners: 0,
      peakListeners: 0,
      streamStatus: false
    };
  }
}

export default async function AdminDashboardPage() {
  const stats = await fetchDashboardStats();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-dark-text-primary">
          Yönetim Paneli
        </h1>
        <p className="text-sm md:text-base text-dark-text-secondary mt-1">
          Site yönetimine genel bakış
        </p>
      </div>

      {/* Radio Stats - Featured */}
      <RadioStatsCard
        currentListeners={stats.currentListeners}
        peakListeners={stats.peakListeners}
        streamStatus={stats.streamStatus}
        className="mb-6"
      />

      {/* Other Stats Grid */}
      <AdminDashboardGrid gap="md">
        <StatsCard
          title="Toplam Haber"
          value={stats.totalNews}
          icon={<FiFileText className="w-4 h-4 md:w-5 md:h-5" />}
          badge={stats.totalNews > 100 ? { text: 'Popüler', variant: 'purple' } : stats.totalNews > 50 ? { text: 'Aktif', variant: 'success' } : undefined}
        />

        <StatsCard
          title="Toplam Anket"
          value={stats.totalPolls}
          icon={<FiBarChart2 className="w-4 h-4 md:w-5 md:h-5" />}
          badge={stats.totalPolls > 0 ? { text: `${stats.totalPolls} Anket`, variant: 'info' } : undefined}
        />

        <StatsCard
          title="Aktif Anket"
          value={stats.activePolls}
          icon={<FiActivity className="w-4 h-4 md:w-5 md:h-5" />}
          trend={stats.activePolls > 0 ? { value: 100, isPositive: true } : undefined}
          badge={stats.activePolls > 0 ? { text: 'Canlı', variant: 'success' } : { text: 'Pasif', variant: 'warning' }}
        />

        <StatsCard
          title="Medya Dosyaları"
          value={stats.totalMedia}
          icon={<FiImage className="w-4 h-4 md:w-5 md:h-5" />}
          badge={stats.totalMedia > 500 ? { text: 'Yüksek', variant: 'pink' } : stats.totalMedia > 100 ? { text: 'Orta', variant: 'purple' } : undefined}
        />
      </AdminDashboardGrid>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/50 rounded-xl border border-dark-border-primary/50 p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-dark-text-primary to-dark-text-secondary bg-clip-text text-transparent mb-6">
          Hızlı İşlemler
        </h2>
        <ResponsiveGrid
          cols={{
            base: 1,
            sm: 2,
            lg: 4
          }}
          gap="md"
        >
          <a
            href="/admin/news"
            className="group p-6 bg-gradient-to-br from-dark-surface-secondary/80 to-dark-surface-primary/50 rounded-xl hover:from-dark-surface-tertiary hover:to-dark-surface-secondary transition-all duration-300 text-center border border-dark-border-primary/30 hover:border-brand-red-900/30 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-1"
          >
            <div className="p-3 bg-gradient-to-br from-brand-red-600/20 to-brand-red-700/10 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-brand-red-900/20">
              <FiFileText className="w-8 h-8 text-brand-red-500" />
            </div>
            <span className="block text-sm font-medium text-dark-text-primary">Yeni Haber</span>
          </a>

          <a
            href="/admin/polls"
            className="group p-6 bg-gradient-to-br from-dark-surface-secondary/80 to-dark-surface-primary/50 rounded-xl hover:from-dark-surface-tertiary hover:to-dark-surface-secondary transition-all duration-300 text-center border border-dark-border-primary/30 hover:border-purple-900/30 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-1"
          >
            <div className="p-3 bg-gradient-to-br from-purple-600/20 to-purple-700/10 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-900/20">
              <FiBarChart2 className="w-8 h-8 text-purple-500" />
            </div>
            <span className="block text-sm font-medium text-dark-text-primary">Yeni Anket</span>
          </a>

          <a
            href="/admin/media"
            className="group p-6 bg-gradient-to-br from-dark-surface-secondary/80 to-dark-surface-primary/50 rounded-xl hover:from-dark-surface-tertiary hover:to-dark-surface-secondary transition-all duration-300 text-center border border-dark-border-primary/30 hover:border-pink-900/30 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-1"
          >
            <div className="p-3 bg-gradient-to-br from-pink-600/20 to-pink-700/10 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-pink-900/20">
              <FiImage className="w-8 h-8 text-pink-500" />
            </div>
            <span className="block text-sm font-medium text-dark-text-primary">Medya Yükle</span>
          </a>

          <a
            href="/admin/settings"
            className="group p-6 bg-gradient-to-br from-dark-surface-secondary/80 to-dark-surface-primary/50 rounded-xl hover:from-dark-surface-tertiary hover:to-dark-surface-secondary transition-all duration-300 text-center border border-dark-border-primary/30 hover:border-green-900/30 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-1"
          >
            <div className="p-3 bg-gradient-to-br from-green-600/20 to-green-700/10 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-900/20">
              <FiActivity className="w-8 h-8 text-green-500" />
            </div>
            <span className="block text-sm font-medium text-dark-text-primary">Ayarlar</span>
          </a>
        </ResponsiveGrid>
      </div>
    </div>
  );
}
