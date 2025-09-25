'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchPolls, PollResponse } from '@/lib/api/admin-polls';

interface PollFilters {
  search?: string;
  poll_type?: string;
  is_active?: boolean;
  show_on_homepage?: boolean;
  show_results?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsePollsDataOptions {
  initialPage?: number;
  initialLimit?: number;
  initialFilters?: PollFilters;
  autoFetch?: boolean;
}

interface UsePollsDataReturn {
  // Data
  polls: any[];
  pagination: PaginationInfo;

  // State
  loading: boolean;
  error: string | null;

  // Actions
  fetchPollsData: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilters: (filters: PollFilters) => void;
  setSearch: (search: string) => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing polls data with pagination and filtering
 */
export function usePollsData({
  initialPage = 1,
  initialLimit = 10,
  initialFilters = {},
  autoFetch = true
}: UsePollsDataOptions = {}): UsePollsDataReturn {

  // State
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filter state
  const [filters, setFilters] = useState<PollFilters>(initialFilters);
  const [search, setSearch] = useState(initialFilters.search || '');

  // Fetch polls data
  const fetchPollsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare fetch parameters
      const fetchParams = {
        page,
        limit,
        search: search.trim() || undefined,
        poll_type: filters.poll_type !== 'all' ? filters.poll_type : undefined,
        is_active: filters.is_active,
        show_on_homepage: filters.show_on_homepage,
        show_results: filters.show_results !== 'all' ? filters.show_results : undefined
      };

      // Remove undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(fetchParams).filter(([_, value]) => value !== undefined)
      );

      const response: PollResponse = await fetchPolls(cleanParams);

      if (response.success && response.data) {
        setPolls(response.data.data || []);

        // Update pagination info
        const paginationData = response.data.pagination || {};
        setPagination({
          page: paginationData.page || page,
          limit: paginationData.limit || limit,
          total: paginationData.total || 0,
          totalPages: paginationData.totalPages || 0,
          hasNext: paginationData.hasNext || false,
          hasPrev: paginationData.hasPrev || false
        });
      } else {
        throw new Error(response.error || 'Anketler yüklenirken bir hata oluştu');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Anketler yüklenirken bir hata oluştu';
      setError(errorMessage);
      console.error('Error fetching polls:', err);

      // Reset data on error
      setPolls([]);
      setPagination({
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filters]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchPollsData();
    }
  }, [fetchPollsData, autoFetch]);

  // Page setter with validation
  const handleSetPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  }, [pagination.totalPages]);

  // Limit setter with validation and page reset
  const handleSetLimit = useCallback((newLimit: number) => {
    if (newLimit > 0 && newLimit <= 100) {
      setLimit(newLimit);
      setPage(1); // Reset to first page when changing limit
    }
  }, []);

  // Filters setter with page reset
  const handleSetFilters = useCallback((newFilters: PollFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when changing filters
  }, []);

  // Search setter with page reset and debouncing effect handled by parent
  const handleSetSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Reset to first page when searching
  }, []);

  // Refresh function that maintains current state
  const refresh = useCallback(async () => {
    await fetchPollsData();
  }, [fetchPollsData]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    polls,
    pagination,

    // State
    loading,
    error,

    // Actions
    fetchPollsData,
    setPage: handleSetPage,
    setLimit: handleSetLimit,
    setFilters: handleSetFilters,
    setSearch: handleSetSearch,
    refresh,
    clearError
  };
}

export default usePollsData;