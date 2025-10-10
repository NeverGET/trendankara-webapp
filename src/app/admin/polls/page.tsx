'use client';

import { useState, useEffect } from 'react';
import { PollCard } from '@/components/admin/PollCard';
import { PollSkeleton } from '@/components/admin/PollSkeleton';
import { StatsCard } from '@/components/admin/StatsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfirmation } from '@/hooks/useConfirmation';
import { usePollsData } from '@/hooks/usePollsData';
import { deletePoll } from '@/lib/api/admin-polls';
import { cn } from '@/lib/utils';
import { getPollStatus } from '@/lib/utils/poll-status';
import { PollDialog } from '@/components/admin/PollDialog';
import { Modal } from '@/components/ui/Modal';
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
  FiTrash2,
  FiAlertCircle,
  FiX
} from 'react-icons/fi';

// Filter and sort options for polls
const pollTypes = [
  { value: 'all', label: 'Tümü' },
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
  { value: 'custom', label: 'Özel' }
];

const pollStatuses = [
  { value: 'all', label: 'Tümü' },
  { value: 'active', label: 'Aktif', color: 'success' },
  { value: 'scheduled', label: 'Planlandı', color: 'warning' },
  { value: 'ended', label: 'Bitti', color: 'error' },
  { value: 'draft', label: 'Taslak', color: 'default' }
];

const pollTypeConfig: Record<string, { label: string; color: string }> = {
  'weekly': { label: 'Haftalık', color: 'primary' },
  'monthly': { label: 'Aylık', color: 'secondary' },
  'custom': { label: 'Özel', color: 'success' }
};

export default function AdminPollsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPollIds, setSelectedPollIds] = useState<number[]>([]);

  // Dialog states
  const [isPollDialogOpen, setIsPollDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedPoll, setSelectedPoll] = useState<any>(null);

  // Preview modal states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPoll, setPreviewPoll] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Confirmation dialog
  const confirmation = useConfirmation();

  // Data fetching hook
  const {
    polls,
    pagination,
    loading,
    error,
    setPage,
    setLimit,
    setFilters,
    setSearch,
    refresh,
    clearError
  } = usePollsData({
    initialLimit: 10,
    autoFetch: true
  });

  // Update search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, setSearch]);

  // Update filters when filter state changes
  useEffect(() => {
    const filters = {
      poll_type: filterType !== 'all' ? filterType : undefined,
      is_active: filterStatus === 'active' ? true : filterStatus === 'draft' ? false : undefined
    };
    setFilters(filters);
  }, [filterType, filterStatus, setFilters]);

  // Apply filtering to polls
  const filteredPolls = polls.filter(poll => {
    // Calculate real status for filtering
    const realStatus = getPollStatus({
      start_date: poll.start_date,
      end_date: poll.end_date,
      is_active: poll.is_active
    });

    // Apply type filter
    if (filterType !== 'all' && poll.poll_type !== filterType) {
      return false;
    }

    // Apply status filter
    if (filterStatus !== 'all' && realStatus !== filterStatus) {
      return false;
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      return (
        poll.title?.toLowerCase().includes(query) ||
        poll.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Calculate stats from current polls data
  const pollStats = {
    totalPolls: pagination.total,
    activePolls: filteredPolls.filter(poll => {
      const realStatus = getPollStatus({
        start_date: poll.start_date,
        end_date: poll.end_date,
        is_active: poll.is_active
      });
      return realStatus === 'active';
    }).length,
    totalVotes: polls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0),
    uniqueVoters: polls.length > 0 ? Math.floor(polls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0) * 0.7) : 0,
    avgParticipation: polls.length > 0 ? Math.round(polls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0) / polls.length) : 0
  };

  // Handle single poll deletion
  const handleDeletePoll = async (id: number) => {
    const poll = polls.find(p => p.id === id);
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
      const result = await deletePoll(id);

      if (!result.success) {
        throw new Error(result.error || 'Anket silinirken bir hata oluştu');
      }

      // Refresh data after successful deletion
      await refresh();
    } catch (error) {
      console.error('Error deleting poll:', error);
      confirmation.setError(error instanceof Error ? error.message : 'Anket silinirken bir hata oluştu.');
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

      // Delete polls one by one (since we don't have a batch delete API)
      const results = await Promise.allSettled(
        selectedPollIds.map(id => deletePoll(id))
      );

      // Check for any failures
      const failures = results.filter(result =>
        result.status === 'rejected' ||
        (result.status === 'fulfilled' && !result.value.success)
      );

      if (failures.length > 0) {
        throw new Error(`${failures.length} anket silinirken hata oluştu`);
      }

      setSelectedPollIds([]);
      // Refresh data after successful deletion
      await refresh();
    } catch (error) {
      console.error('Error deleting polls:', error);
      confirmation.setError(error instanceof Error ? error.message : 'Anketler silinirken bir hata oluştu.');
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

  // Handle opening create dialog
  const handleCreatePoll = () => {
    setDialogMode('create');
    setSelectedPoll(null);
    setIsPollDialogOpen(true);
  };

  // Handle opening edit dialog
  const handleEditPoll = async (poll: any) => {
    setDialogMode('edit');

    try {
      // Fetch full poll data with items
      const response = await fetch(`/api/admin/polls/${poll.id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPoll(data.data);
      } else {
        // Fallback to poll from list if fetch fails
        setSelectedPoll(poll);
      }
    } catch (error) {
      console.error('Error fetching poll details:', error);
      // Fallback to poll from list if fetch fails
      setSelectedPoll(poll);
    }

    setIsPollDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsPollDialogOpen(false);
    setSelectedPoll(null);
  };

  // Handle dialog success (poll created/updated)
  const handleDialogSuccess = () => {
    // Refresh the polls list
    refresh();
  };

  // Handle poll preview
  const handlePreviewPoll = async (id: number) => {
    try {
      setPreviewLoading(true);
      setIsPreviewOpen(true);

      // Fetch poll preview data
      const response = await fetch(`/api/admin/polls/${id}/preview`);
      const data = await response.json();

      if (data.success) {
        setPreviewPoll(data.data);
      } else {
        throw new Error(data.error || 'Failed to load preview');
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setIsPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Cmd/Ctrl + N: New poll
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        handleCreatePoll();
      }

      // Escape: Close dialog
      if (event.key === 'Escape') {
        if (isPollDialogOpen) {
          handleDialogClose();
        }
        if (confirmation.isOpen) {
          confirmation.close();
        }
      }

      // Delete: Delete selected polls
      if (event.key === 'Delete' && selectedPollIds.length > 0) {
        event.preventDefault();
        handleBatchDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPollDialogOpen, selectedPollIds, confirmation.isOpen, confirmation, handleBatchDelete]);

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
          <div className="text-xs text-dark-text-secondary mt-2 space-y-1">
            <p>
              <strong>Kısayollar:</strong> {navigator.platform.indexOf('Mac') > -1 ? 'Cmd' : 'Ctrl'}+N (Yeni), Delete (Sil), Esc (Kapat)
            </p>
          </div>
        </div>
        <Button
          variant="default"
          size="default"
          onClick={handleCreatePoll}
          title={`Yeni Anket (${navigator.platform.indexOf('Mac') > -1 ? 'Cmd' : 'Ctrl'}+N)`}
        >
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
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Seçimi Temizle
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                className="flex items-center gap-2"
                title="Seçili anketleri sil (Delete)"
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
              size="sm"
              onClick={selectedPollIds.length === filteredPolls.length ? clearSelection : selectAllVisiblePolls}
            >
              {selectedPollIds.length === filteredPolls.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
            </Button>
          </div>
        </div>
      </div>

      {/* Active Polls Highlight */}
      {filteredPolls.filter(p => {
        const realStatus = getPollStatus({
          start_date: p.start_date,
          end_date: p.end_date,
          is_active: p.is_active
        });
        return realStatus === 'active';
      }).length > 0 && filterStatus === 'all' && (
        <div className="bg-gradient-to-r from-green-900/20 to-transparent rounded-xl border border-green-900/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <FiActivity className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-dark-text-primary">Aktif Anketler</h2>
            <Badge variant="success" size="small" pill animated>
              {filteredPolls.filter(p => {
                const realStatus = getPollStatus({
                  start_date: p.start_date,
                  end_date: p.end_date,
                  is_active: p.is_active
                });
                return realStatus === 'active';
              }).length} Adet
            </Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filteredPolls.filter(p => {
              const realStatus = getPollStatus({
                start_date: p.start_date,
                end_date: p.end_date,
                is_active: p.is_active
              });
              return realStatus === 'active';
            }).map(poll => (
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

      {/* Error Display */}
      {error && (
        <div className="bg-brand-red-50 dark:bg-brand-red-900/20 border border-brand-red-200 dark:border-brand-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="h-5 w-5 text-brand-red-600 dark:text-brand-red-400" />
            <div className="flex-1">
              <h4 className="font-medium text-brand-red-800 dark:text-brand-red-200">
                Hata Oluştu
              </h4>
              <p className="text-sm text-brand-red-700 dark:text-brand-red-300 mt-1">
                {error}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="text-brand-red-600 dark:text-brand-red-400"
            >
              <FiX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <PollSkeleton key={i} variant="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <PollSkeleton key={i} variant="list" />
              ))}
            </div>
          )}
        </>
      )}

      {/* Polls Grid/List */}
      {!loading && !error && (
        <>
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
                    id={poll.id}
                    title={poll.title}
                    description={poll.description}
                    type={poll.poll_type || 'SPECIAL'}
                    totalVotes={poll.total_votes || 0}
                    uniqueVoters={Math.floor((poll.total_votes || 0) * 0.7)}
                    options={[]}
                    startDate={new Date(poll.start_date).toLocaleDateString('tr-TR')}
                    endDate={new Date(poll.end_date).toLocaleDateString('tr-TR')}
                    start_date={poll.start_date}
                    end_date={poll.end_date}
                    is_active={poll.is_active}
                    onEdit={() => handleEditPoll(poll)}
                    onDelete={handleDeletePoll}
                    onView={(id) => console.log('View', id)}
                    onPreview={handlePreviewPoll}
                    onToggleStatus={(id) => console.log('Toggle', id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPolls.map(poll => {
                const config = pollTypeConfig[poll.poll_type];
                const realStatus = getPollStatus({
                  start_date: poll.start_date,
                  end_date: poll.end_date,
                  is_active: poll.is_active
                });
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
                          realStatus === 'active' ? 'success' :
                          realStatus === 'scheduled' ? 'warning' :
                          realStatus === 'ended' ? 'error' :
                          'default'
                        }
                        size="small"
                        pill
                        animated={realStatus === 'active'}
                      >
                        {realStatus === 'active' ? 'Aktif' :
                         realStatus === 'scheduled' ? 'Planlandı' :
                         realStatus === 'ended' ? 'Bitti' :
                         'Taslak'}
                      </Badge>
                    </div>
                    <p className="text-sm text-dark-text-secondary mb-2">
                      {poll.description}
                    </p>
                    <div className="flex items-center gap-6 text-xs text-dark-text-secondary">
                      <div className="flex items-center gap-1">
                        <FiBarChart2 className="w-3 h-3" />
                        <span>{poll.total_votes} oy</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiUsers className="w-3 h-3" />
                        <span>{poll.item_count} seçenek</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        <span>{new Date(poll.start_date).toLocaleDateString('tr-TR')} - {new Date(poll.end_date).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <FiBarChart2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditPoll(poll)}>
                      <FiEdit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
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
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Filtrelere uygun anket bulunamadı'
                  : 'Anket bulunamadı'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="ghost"
                size="sm"
                disabled={!pagination.hasPrev}
                onClick={() => setPage(pagination.page - 1)}
              >
                Önceki
              </Button>
              <span className="text-sm text-dark-text-secondary">
                Sayfa {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => setPage(pagination.page + 1)}
              >
                Sonraki
              </Button>
            </div>
          )}
        </>
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

      {/* Poll Dialog */}
      <PollDialog
        isOpen={isPollDialogOpen}
        onClose={handleDialogClose}
        poll={selectedPoll}
        mode={dialogMode}
        onSuccess={handleDialogSuccess}
      />

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Anket Önizleme"
        size="large"
      >
        {previewLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : previewPoll ? (
          <div className="space-y-6">
            {/* Admin Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                <FiBarChart2 className="w-4 h-4" />
                <div className="flex-1">
                  <strong>Önizleme Modu:</strong> Bu anketin kullanıcıların göreceği halidir. Oy verme işlevsel değildir.
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                <div>📅 {new Date(previewPoll.start_date).toLocaleDateString('tr-TR')} - {new Date(previewPoll.end_date).toLocaleDateString('tr-TR')}</div>
                <div>📊 Toplam: {previewPoll.total_votes || 0} oy</div>
              </div>
            </div>

            {/* PUBLIC POLL VIEW - Matches the user-facing interface */}
            <div className="bg-dark-surface-primary border border-dark-border-primary rounded-lg p-4 md:p-6">
              {/* Poll Header */}
              <div className="mb-4">
                <h3 className="text-lg md:text-xl font-semibold text-dark-text-primary mb-2">
                  {previewPoll.title}
                </h3>
                {previewPoll.description && (
                  <p className="text-sm text-dark-text-secondary mb-3">
                    {previewPoll.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs md:text-sm text-dark-text-secondary">
                  <span>{previewPoll.total_votes || 0} oy</span>
                  <span className="font-medium text-brand-red-600">
                    {(() => {
                      const now = new Date();
                      const end = new Date(previewPoll.end_date);
                      const diff = end.getTime() - now.getTime();
                      if (diff <= 0) return 'Sona erdi';
                      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      if (days > 0) return `${days} gün ${hours} saat kaldı`;
                      return `${hours} saat kaldı`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Poll Options - Interactive looking but disabled */}
              {previewPoll.options && previewPoll.options.length > 0 && (
                <div className="space-y-3 mb-4">
                  {previewPoll.options.map((option: any, index: number) => (
                    <label
                      key={option.id || index}
                      className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg border border-dark-border-primary hover:border-dark-border-secondary hover:bg-dark-surface-secondary cursor-not-allowed opacity-75 transition-all min-h-[44px]"
                      title="Önizleme modunda oy kullanılamaz"
                    >
                      <input
                        type="radio"
                        name="preview-poll"
                        disabled
                        className="w-4 h-4 text-brand-red-600 bg-dark-surface-primary border-dark-border-secondary flex-shrink-0 cursor-not-allowed"
                      />

                      {option.imageUrl && (
                        <div
                          className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] rounded-lg bg-cover bg-center bg-dark-surface-secondary flex-shrink-0"
                          style={{ backgroundImage: `url(${option.imageUrl})` }}
                        />
                      )}

                      <span className="text-sm md:text-base text-dark-text-primary flex-1">
                        {option.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Vote Button (Disabled) */}
              <Button
                variant="default"
                disabled
                className="w-full opacity-75 cursor-not-allowed"
                title="Önizleme modunda oy kullanılamaz"
              >
                Oy Ver
              </Button>

              {/* Preview Note */}
              <p className="text-center text-xs md:text-sm text-dark-text-secondary mt-3">
                Bu bir önizlemedir. Gerçek ankette kullanıcılar oy verebilir.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-dark-border-primary/50">
              <Button
                variant="ghost"
                onClick={() => setIsPreviewOpen(false)}
              >
                Kapat
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setIsPreviewOpen(false);
                  handleEditPoll(previewPoll);
                }}
              >
                <FiEdit className="w-4 h-4 mr-2" />
                Düzenle
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-dark-text-secondary">
            Önizleme yüklenemedi
          </div>
        )}
      </Modal>
    </div>
  );
}