'use client';

import { useState } from 'react';
import { PollCard } from '@/components/admin/PollCard';
import { StatsCard } from '@/components/admin/StatsCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import {
  FiPlus,
  FiBarChart2,
  FiUsers,
  FiActivity,
  FiClock,
  FiFilter,
  FiSearch,
  FiGrid,
  FiList,
  FiTrendingUp,
  FiCheckCircle,
  FiCalendar,
  FiAward,
  FiEdit,
  FiTrash2
} from 'react-icons/fi';

// Mock data - replace with API call
const mockPolls = [
  {
    id: 1,
    title: 'Haftanın En İyi Şarkısı',
    description: 'Bu hafta en çok dinlenen ve beğenilen şarkıları oylayın',
    type: 'TOP_50' as const,
    totalVotes: 3456,
    uniqueVoters: 1234,
    options: [
      { id: 1, name: 'Şarkı 1 - Sanatçı A', votes: 1234, percentage: 35.7, imageUrl: '/api/placeholder/50/50' },
      { id: 2, name: 'Şarkı 2 - Sanatçı B', votes: 987, percentage: 28.6, imageUrl: '/api/placeholder/50/50' },
      { id: 3, name: 'Şarkı 3 - Sanatçı C', votes: 678, percentage: 19.6, imageUrl: '/api/placeholder/50/50' },
      { id: 4, name: 'Şarkı 4 - Sanatçı D', votes: 557, percentage: 16.1, imageUrl: '/api/placeholder/50/50' }
    ],
    startDate: '15 Eyl',
    endDate: '22 Eyl',
    status: 'active' as const,
    daysRemaining: 4
  },
  {
    id: 2,
    title: 'Ayın En İyi Albümü',
    description: 'Eylül ayının en başarılı albümünü seçiyoruz',
    type: 'TOP_10' as const,
    totalVotes: 2145,
    uniqueVoters: 892,
    options: [
      { id: 1, name: 'Albüm X', votes: 856, percentage: 39.9, imageUrl: '/api/placeholder/50/50' },
      { id: 2, name: 'Albüm Y', votes: 645, percentage: 30.1, imageUrl: '/api/placeholder/50/50' },
      { id: 3, name: 'Albüm Z', votes: 644, percentage: 30.0, imageUrl: '/api/placeholder/50/50' }
    ],
    startDate: '1 Eyl',
    endDate: '30 Eyl',
    status: 'active' as const,
    daysRemaining: 12
  },
  {
    id: 3,
    title: 'En İyi Yeni Çıkan',
    description: 'Bu ay çıkan şarkılar arasından en iyisini seçin',
    type: 'BEST_OF_MONTH' as const,
    totalVotes: 567,
    uniqueVoters: 234,
    options: [
      { id: 1, name: 'Yeni Şarkı 1', votes: 234, percentage: 41.3 },
      { id: 2, name: 'Yeni Şarkı 2', votes: 200, percentage: 35.3 },
      { id: 3, name: 'Yeni Şarkı 3', votes: 133, percentage: 23.4 }
    ],
    startDate: '10 Eyl',
    endDate: '25 Eyl',
    status: 'scheduled' as const,
    daysRemaining: undefined
  },
  {
    id: 4,
    title: 'Dinleyici Tercihi - Rock',
    description: 'Rock severler için özel anket',
    type: 'LISTENER_CHOICE' as const,
    totalVotes: 8912,
    uniqueVoters: 3456,
    options: [
      { id: 1, name: 'Rock Band A', votes: 3456, percentage: 38.8 },
      { id: 2, name: 'Rock Band B', votes: 2890, percentage: 32.4 },
      { id: 3, name: 'Rock Band C', votes: 2566, percentage: 28.8 }
    ],
    startDate: '1 Ağu',
    endDate: '31 Ağu',
    status: 'ended' as const,
    daysRemaining: undefined
  },
  {
    id: 5,
    title: 'Yaz Festivali Anketi',
    description: 'En iyi festival performansını oylayın',
    type: 'SPECIAL' as const,
    totalVotes: 0,
    uniqueVoters: 0,
    options: [],
    startDate: '1 Tem',
    endDate: '15 Tem',
    status: 'draft' as const,
    daysRemaining: undefined
  },
  {
    id: 6,
    title: 'Nostaljik Şarkılar',
    description: '90\'ların en iyi şarkısı hangisi?',
    type: 'SPECIAL' as const,
    totalVotes: 12345,
    uniqueVoters: 4567,
    options: [
      { id: 1, name: '90\'lar Hit 1', votes: 5432, percentage: 44.0 },
      { id: 2, name: '90\'lar Hit 2', votes: 3912, percentage: 31.7 },
      { id: 3, name: '90\'lar Hit 3', votes: 3001, percentage: 24.3 }
    ],
    startDate: '1 Haz',
    endDate: '30 Haz',
    status: 'ended' as const,
    daysRemaining: undefined
  }
];

// Mock stats
const pollStats = {
  totalPolls: 24,
  activePolls: 3,
  totalVotes: 45678,
  uniqueVoters: 8912,
  avgParticipation: 72
};

const pollTypes = [
  { value: 'all', label: 'Tümü' },
  { value: 'TOP_50', label: 'Top 50' },
  { value: 'TOP_10', label: 'Top 10' },
  { value: 'BEST_OF_MONTH', label: 'Ayın En İyisi' },
  { value: 'LISTENER_CHOICE', label: 'Dinleyici Seçimi' },
  { value: 'SPECIAL', label: 'Özel' }
];

const pollStatuses = [
  { value: 'all', label: 'Tümü' },
  { value: 'active', label: 'Aktif', color: 'success' },
  { value: 'scheduled', label: 'Planlandı', color: 'warning' },
  { value: 'ended', label: 'Bitti', color: 'error' },
  { value: 'draft', label: 'Taslak', color: 'default' }
];

const pollTypeConfig: Record<string, { label: string; color: string }> = {
  'TOP_50': { label: 'Top 50', color: 'primary' },
  'TOP_10': { label: 'Top 10', color: 'secondary' },
  'BEST_OF_MONTH': { label: 'Ayın En İyisi', color: 'success' },
  'LISTENER_CHOICE': { label: 'Dinleyici Seçimi', color: 'warning' },
  'SPECIAL': { label: 'Özel', color: 'info' }
};

export default function AdminPollsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPollIds, setSelectedPollIds] = useState<number[]>([]);

  // Confirmation dialog
  const confirmation = useConfirmation();

  const filteredPolls = mockPolls.filter(poll => {
    const matchesType = filterType === 'all' || poll.type === filterType;
    const matchesStatus = filterStatus === 'all' || poll.status === filterStatus;
    const matchesSearch = poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          poll.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // Handle single poll deletion
  const handleDeletePoll = async (id: number) => {
    const poll = mockPolls.find(p => p.id === id);
    const pollTitle = poll?.title || 'Bu anket';

    const confirmed = await confirmation.confirm({
      title: 'Anketi Sil',
      message: `"${pollTitle}" başlıklı anketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm oy verileri silinecektir.`,
      confirmText: 'Sil',
      cancelText: 'İptal',
      variant: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      confirmation.setLoading(true);
      // TODO: Add API call to delete poll
      console.log('Deleting poll:', id);
      // Mock deletion - in real app, refresh data after successful deletion
    } catch (error) {
      console.error('Error deleting poll:', error);
      confirmation.setError('Anket silinirken bir hata oluştu.');
    } finally {
      confirmation.setLoading(false);
    }
  };

  // Handle batch deletion
  const handleBatchDelete = async () => {
    if (selectedPollIds.length === 0) return;

    const confirmed = await confirmation.confirm({
      title: 'Anketleri Sil',
      message: `${selectedPollIds.length} anketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm oy verileri silinecektir.`,
      confirmText: `${selectedPollIds.length} Anketi Sil`,
      cancelText: 'İptal',
      variant: 'danger'
    });

    if (!confirmed) {
      return;
    }

    try {
      confirmation.setLoading(true);
      // TODO: Add API call to delete multiple polls
      console.log('Deleting polls:', selectedPollIds);
      setSelectedPollIds([]);
      // Mock deletion - in real app, refresh data after successful deletion
    } catch (error) {
      console.error('Error deleting polls:', error);
      confirmation.setError('Anketler silinirken bir hata oluştu.');
    } finally {
      confirmation.setLoading(false);
    }
  };

  // Toggle poll selection
  const togglePollSelection = (id: number) => {
    setSelectedPollIds(prev =>
      prev.includes(id)
        ? prev.filter(pollId => pollId !== id)
        : [...prev, id]
    );
  };

  // Select all visible polls
  const selectAllVisiblePolls = () => {
    const visibleIds = filteredPolls.map(poll => poll.id);
    setSelectedPollIds(visibleIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPollIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-dark-text-primary">
            Anket Yönetimi
          </h1>
          <p className="text-dark-text-secondary mt-1">
            Anketleri yönetin, sonuçları görüntüleyin
          </p>
        </div>
        <Button variant="primary" size="medium">
          <FiPlus className="w-4 h-4 mr-2" />
          Yeni Anket
        </Button>
      </div>

      {/* Batch Actions */}
      {selectedPollIds.length > 0 && (
        <div className="bg-gradient-to-r from-red-900/20 to-transparent rounded-xl border border-red-900/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <FiCheckCircle className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-dark-text-primary">Toplu İşlemler</h2>
              <Badge variant="error" size="small" pill>
                {selectedPollIds.length} Anket Seçili
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="small" onClick={clearSelection}>
                Seçimi Temizle
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={handleBatchDelete}
                className="flex items-center gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                {selectedPollIds.length} Anketi Sil
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Toplam Anket"
          value={pollStats.totalPolls}
          icon={<FiBarChart2 className="w-5 h-5" />}
          badge={{ text: 'Tümü', variant: 'info' }}
        />
        <StatsCard
          title="Aktif Anket"
          value={pollStats.activePolls}
          icon={<FiActivity className="w-5 h-5" />}
          badge={{ text: 'Canlı', variant: 'success' }}
        />
        <StatsCard
          title="Toplam Oy"
          value={`${(pollStats.totalVotes / 1000).toFixed(1)}K`}
          icon={<FiCheckCircle className="w-5 h-5" />}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Katılımcı"
          value={`${(pollStats.uniqueVoters / 1000).toFixed(1)}K`}
          icon={<FiUsers className="w-5 h-5" />}
          badge={{ text: 'Benzersiz', variant: 'purple' }}
        />
        <StatsCard
          title="Katılım Oranı"
          value={`${pollStats.avgParticipation}%`}
          icon={<FiTrendingUp className="w-5 h-5" />}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/50 rounded-xl border border-dark-border-primary/50 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" />
            <input
              type="text"
              placeholder="Anket ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-surface-secondary/50 border border-dark-border-primary/50 rounded-lg text-dark-text-primary placeholder-dark-text-secondary focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 items-center">
            <FiAward className="text-dark-text-secondary" />
            <div className="flex gap-2 flex-wrap">
              {pollTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    filterType === type.value
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-900/30"
                      : "bg-dark-surface-secondary/50 text-dark-text-secondary hover:bg-dark-surface-tertiary"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 items-center">
            <FiFilter className="text-dark-text-secondary" />
            <div className="flex gap-2">
              {pollStatuses.map(status => (
                <button
                  key={status.value}
                  onClick={() => setFilterStatus(status.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    filterStatus === status.value
                      ? "bg-red-500 text-white shadow-lg shadow-red-900/30"
                      : "bg-dark-surface-secondary/50 text-dark-text-secondary hover:bg-dark-surface-tertiary"
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                viewMode === 'grid'
                  ? "bg-red-500 text-white shadow-lg shadow-red-900/30"
                  : "bg-dark-surface-secondary/50 text-dark-text-secondary hover:bg-dark-surface-tertiary"
              )}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                viewMode === 'list'
                  ? "bg-red-500 text-white shadow-lg shadow-red-900/30"
                  : "bg-dark-surface-secondary/50 text-dark-text-secondary hover:bg-dark-surface-tertiary"
              )}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          {/* Selection Controls */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="small"
              onClick={selectedPollIds.length === filteredPolls.length ? clearSelection : selectAllVisiblePolls}
            >
              {selectedPollIds.length === filteredPolls.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
            </Button>
          </div>
        </div>
      </div>

      {/* Active Polls Highlight */}
      {filteredPolls.filter(p => p.status === 'active').length > 0 && filterStatus === 'all' && (
        <div className="bg-gradient-to-r from-green-900/20 to-transparent rounded-xl border border-green-900/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <FiActivity className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-dark-text-primary">Aktif Anketler</h2>
            <Badge variant="success" size="small" pill animated>
              {filteredPolls.filter(p => p.status === 'active').length} Adet
            </Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filteredPolls.filter(p => p.status === 'active').map(poll => (
              <div key={poll.id} className="bg-dark-surface-secondary/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-dark-text-primary">{poll.title}</span>
                  {poll.daysRemaining !== undefined && (
                    <Badge
                      variant={poll.daysRemaining <= 3 ? 'error' : 'warning'}
                      size="small"
                      animated={poll.daysRemaining <= 3}
                    >
                      {poll.daysRemaining} gün
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-dark-text-secondary">
                  <span>{poll.totalVotes} oy</span>
                  <span>{poll.uniqueVoters} katılımcı</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Polls Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPolls.map(poll => (
            <div key={poll.id} className={cn(
              "relative",
              selectedPollIds.includes(poll.id) && "ring-2 ring-red-500 rounded-xl"
            )}>
              {/* Selection Checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedPollIds.includes(poll.id)}
                  onChange={() => togglePollSelection(poll.id)}
                  className="w-4 h-4 text-red-600 bg-dark-surface-secondary border-dark-border-primary rounded focus:ring-red-500 focus:ring-2"
                />
              </div>
              <PollCard
                {...poll}
                onEdit={(id) => console.log('Edit', id)}
                onDelete={handleDeletePoll}
                onView={(id) => console.log('View', id)}
                onToggleStatus={(id) => console.log('Toggle', id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPolls.map(poll => {
            const config = pollTypeConfig[poll.type];
            return (
              <div
                key={poll.id}
                className={cn(
                  "bg-gradient-to-r from-dark-surface-primary to-dark-surface-secondary/50 rounded-xl border border-dark-border-primary/50 p-4 hover:shadow-lg transition-all duration-200",
                  selectedPollIds.includes(poll.id) && "ring-2 ring-red-500"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      checked={selectedPollIds.includes(poll.id)}
                      onChange={() => togglePollSelection(poll.id)}
                      className="w-4 h-4 text-red-600 bg-dark-surface-secondary border-dark-border-primary rounded focus:ring-red-500 focus:ring-2"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-dark-text-primary">
                        {poll.title}
                      </h3>
                      <Badge
                        variant={config.color as any}
                        size="small"
                        pill
                      >
                        {config.label}
                      </Badge>
                      <Badge
                        variant={
                          poll.status === 'active' ? 'success' :
                          poll.status === 'scheduled' ? 'warning' :
                          poll.status === 'ended' ? 'error' :
                          'default'
                        }
                        size="small"
                        pill
                        animated={poll.status === 'active'}
                      >
                        {poll.status === 'active' ? 'Aktif' :
                         poll.status === 'scheduled' ? 'Planlandı' :
                         poll.status === 'ended' ? 'Bitti' :
                         'Taslak'}
                      </Badge>
                    </div>
                    <p className="text-sm text-dark-text-secondary mb-2">
                      {poll.description}
                    </p>
                    <div className="flex items-center gap-6 text-xs text-dark-text-secondary">
                      <div className="flex items-center gap-1">
                        <FiBarChart2 className="w-3 h-3" />
                        <span>{poll.totalVotes} oy</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiUsers className="w-3 h-3" />
                        <span>{poll.uniqueVoters} katılımcı</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        <span>{poll.startDate} - {poll.endDate}</span>
                      </div>
                      {poll.daysRemaining !== undefined && (
                        <Badge
                          variant={poll.daysRemaining <= 3 ? 'error' : 'warning'}
                          size="small"
                        >
                          {poll.daysRemaining} gün kaldı
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="small">
                      <FiBarChart2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="small">
                      <FiEdit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleDeletePoll(poll.id)}
                    >
                      <FiTrash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {filteredPolls.length === 0 && (
        <div className="text-center py-12">
          <FiBarChart2 className="w-12 h-12 mx-auto text-dark-text-secondary mb-4" />
          <p className="text-dark-text-secondary">
            Anket bulunamadı
          </p>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.close}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant as 'danger' | 'warning' | 'info'}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        loading={confirmation.isLoading}
      />
    </div>
  );
}

// Helper function
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}