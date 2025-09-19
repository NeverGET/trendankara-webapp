'use client';

import { useState, useEffect } from 'react';
import { NewsCard } from '@/components/admin/NewsCard';
import { NewsForm } from '@/components/admin/NewsForm';
import { StatsCard } from '@/components/admin/StatsCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  FiPlus,
  FiFileText,
  FiEye,
  FiTrendingUp,
  FiArchive,
  FiFilter,
  FiSearch,
  FiGrid,
  FiList,
  FiEdit,
  FiTrash2,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import {
  getAdminNews,
  getAdminNewsById,
  createAdminNews,
  updateAdminNews,
  deleteAdminNews,
  NewsFormData,
  NewsFilters
} from '@/lib/api/admin/news';
import { NewsArticle } from '@/types/news';

interface NewsStats {
  total_count: number;
  published_count: number;
  draft_count: number;
  archived_count: number;
  views_today: number;
}

export default function AdminNewsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['all', 'MAGAZINE', 'ARTIST', 'ALBUM', 'CONCERT'];

  // Load news data
  const loadNews = async (page: number = 1, search?: string, category?: string) => {
    try {
      setLoading(true);
      const filters: NewsFilters = {};

      if (search && search.trim()) {
        filters.search = search.trim();
      }

      if (category && category !== 'all') {
        // Map frontend categories to backend format
        const categoryMap: Record<string, string> = {
          'MAGAZINE': 'MAGAZINE',
          'ARTIST': 'ARTIST',
          'ALBUM': 'ALBUM',
          'CONCERT': 'CONCERT'
        };
        if (categoryMap[category]) {
          filters.search = `category:${categoryMap[category]}`;
        }
      }

      const response = await getAdminNews(page, 20, filters, true);

      if (response.success) {
        setNews(response.data);
        setPagination(response.pagination);
        if (response.stats) {
          setStats(response.stats);
        }
      }
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadNews(currentPage, searchQuery, filterCategory);
  }, [currentPage, searchQuery, filterCategory]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadNews(1, searchQuery, filterCategory);
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentPage, filterCategory]);

  // Handle category filter
  const handleCategoryChange = (category: string) => {
    setFilterCategory(category);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle create news
  const handleCreateNews = async (data: NewsFormData) => {
    try {
      setIsSubmitting(true);
      await createAdminNews(data);
      setShowCreateModal(false);
      loadNews(currentPage, searchQuery, filterCategory); // Refresh data
    } catch (error) {
      console.error('Error creating news:', error);
      alert('Haber oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit news
  const handleEditNews = async (id: number) => {
    try {
      const response = await getAdminNewsById(id);
      if (response && response.success) {
        setEditingNews(response.data);
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Error fetching news for edit:', error);
    }
  };

  // Handle update news
  const handleUpdateNews = async (data: NewsFormData) => {
    if (!editingNews) return;

    try {
      setIsSubmitting(true);
      await updateAdminNews(editingNews.id, data);
      setShowEditModal(false);
      setEditingNews(null);
      loadNews(currentPage, searchQuery, filterCategory); // Refresh data
    } catch (error) {
      console.error('Error updating news:', error);
      alert('Haber güncellenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete news
  const handleDeleteNews = async (id: number) => {
    if (!confirm('Bu haberi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await deleteAdminNews(id);
      loadNews(currentPage, searchQuery, filterCategory); // Refresh data
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('Haber silinirken bir hata oluştu.');
    }
  };

  // Handle view news (placeholder for now)
  const handleViewNews = (id: number) => {
    // TODO: Open news in new tab or modal
    console.log('View news:', id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-dark-text-primary">
            Haber Yönetimi
          </h1>
          <p className="text-dark-text-secondary mt-1">
            Site haberlerini yönetin ve düzenleyin
          </p>
        </div>
        <Button
          variant="primary"
          size="medium"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Yeni Haber
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Toplam Haber"
            value={stats.total_count}
            icon={<FiFileText className="w-5 h-5" />}
            badge={{ text: 'Tümü', variant: 'info' }}
          />
          <StatsCard
            title="Yayında"
            value={stats.published_count}
            icon={<FiEye className="w-5 h-5" />}
            badge={{ text: 'Aktif', variant: 'success' }}
          />
          <StatsCard
            title="Taslak"
            value={stats.draft_count}
            icon={<FiArchive className="w-5 h-5" />}
            badge={{ text: 'Bekliyor', variant: 'warning' }}
          />
          <StatsCard
            title="Bugünkü Görüntülenme"
            value={stats.views_today}
            icon={<FiTrendingUp className="w-5 h-5" />}
            trend={{ value: 12, isPositive: true }}
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-gradient-to-br from-dark-surface-primary to-dark-surface-secondary/50 rounded-xl border border-dark-border-primary/50 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" />
            <input
              type="text"
              placeholder="Haber ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-surface-secondary/50 border border-dark-border-primary/50 rounded-lg text-dark-text-primary placeholder-dark-text-secondary focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 items-center">
            <FiFilter className="text-dark-text-secondary" />
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    filterCategory === cat
                      ? "bg-red-500 text-white shadow-lg shadow-red-900/30"
                      : "bg-dark-surface-secondary/50 text-dark-text-secondary hover:bg-dark-surface-tertiary"
                  )}
                >
                  {cat === 'all' ? 'Tümü' : cat}
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
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          {/* News Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {news.map(article => (
                <NewsCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  excerpt={article.summary}
                  category={article.category}
                  author={article.author?.name || 'Unknown'}
                  publishedAt={new Date(article.publishedAt).toLocaleDateString('tr-TR')}
                  viewCount={article.viewCount}
                  commentCount={0} // Not available in current data structure
                  imageUrl={typeof article.thumbnail === 'string' ? article.thumbnail : article.thumbnail?.url || '/api/placeholder/400/200'}
                  status={'published'} // Map from article status
                  isHot={article.isHot}
                  isBreaking={article.isBreaking}
                  onEdit={handleEditNews}
                  onDelete={handleDeleteNews}
                  onView={handleViewNews}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {news.map(article => (
                <div
                  key={article.id}
                  className="bg-gradient-to-r from-dark-surface-primary to-dark-surface-secondary/50 rounded-xl border border-dark-border-primary/50 p-4 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-dark-text-primary">
                          {article.title}
                        </h3>
                        <Badge
                          variant={categoryColors[article.category] as any || 'default'}
                          size="small"
                          pill
                        >
                          {article.category}
                        </Badge>
                        {article.isHot && (
                          <Badge variant="error" size="small" pill animated>
                            🔥 HOT
                          </Badge>
                        )}
                        {article.isBreaking && (
                          <Badge variant="warning" size="small" pill animated>
                            ⚡ SON DAKİKA
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-dark-text-secondary mb-2">
                        {article.summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-dark-text-secondary">
                        <span>{article.author?.name || 'Unknown'}</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString('tr-TR')}</span>
                        <div className="flex items-center gap-1">
                          <FiEye className="w-3 h-3" />
                          <span>{article.viewCount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="small" onClick={() => handleViewNews(article.id)}>
                        <FiEye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="small" onClick={() => handleEditNews(article.id)}>
                        <FiEdit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="small" onClick={() => handleDeleteNews(article.id)}>
                        <FiTrash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="ghost"
                size="small"
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <FiChevronLeft className="w-4 h-4" />
                Önceki
              </Button>

              <div className="flex gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                        currentPage === page
                          ? "bg-red-500 text-white shadow-lg shadow-red-900/30"
                          : "bg-dark-surface-secondary/50 text-dark-text-secondary hover:bg-dark-surface-tertiary"
                      )}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="ghost"
                size="small"
                disabled={!pagination.hasNext}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Sonraki
                <FiChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* No Results */}
      {!loading && news.length === 0 && (
        <div className="text-center py-12">
          <FiFileText className="w-12 h-12 mx-auto text-dark-text-secondary mb-4" />
          <p className="text-dark-text-secondary">
            Haber bulunamadı
          </p>
        </div>
      )}

      {/* Create News Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Yeni Haber Oluştur"
        size="large"
      >
        <NewsForm
          mode="create"
          onSubmit={handleCreateNews}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Edit News Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingNews(null);
        }}
        title="Haberi Düzenle"
        size="large"
      >
        {editingNews && (
          <NewsForm
            mode="edit"
            initialData={editingNews}
            onSubmit={handleUpdateNews}
            isLoading={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
}

// Helper function
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const categoryColors: Record<string, string> = {
  'MAGAZIN': 'purple',
  'SANATÇI': 'pink',
  'ALBÜM': 'info',
  'KONSER': 'success',
  'HABER': 'warning'
};