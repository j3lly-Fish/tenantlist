import { useState, useMemo } from 'react';
import { Business } from '@types';

/**
 * Custom hook for filtering businesses by search query and status
 *
 * Features:
 * - Client-side filtering by business name (search query)
 * - Filter by business status
 * - Debounced search handled by SearchInput component
 * - Clear filters functionality
 *
 * @param businesses - Array of businesses to filter
 * @returns Object with filtered businesses and filter state/setters
 */
export const useBusinessFilter = (businesses: Business[]) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  /**
   * Filter businesses based on search query and status
   */
  const filteredBusinesses = useMemo(() => {
    let filtered = [...businesses];

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((business) =>
        business.name.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((business) => business.status === statusFilter);
    }

    return filtered;
  }, [businesses, searchQuery, statusFilter]);

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  return {
    filteredBusinesses,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    clearFilters,
    hasActiveFilters,
  };
};
