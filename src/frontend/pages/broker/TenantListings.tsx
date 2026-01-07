import React, { useState, useEffect, useCallback } from 'react';
import { TenantSearchCard } from '@components/broker/TenantSearchCard';
import { TenantProfileCard, TenantProfile } from '@components/broker/TenantProfileCard';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import apiClient from '@utils/apiClient';
import styles from './TenantListings.module.css';

/**
 * TenantListings Page (Broker Dashboard)
 *
 * Tenant overview page showing:
 * - Header with tenant count and "+ Add Tenant" button
 * - Search card with filters (name, category, location)
 * - Grid of tenant profile cards (2 columns desktop, 1 mobile)
 * - Infinite scroll pagination
 * - Loading states, empty states
 *
 * Features:
 * - Client-side search filtering with debounce (300ms)
 * - Category and location filters
 * - Click on tenant card navigates to profile page
 * - Responsive grid layout
 */

interface TenantProfileResponse {
  id: string;
  display_name: string;
  logo_url?: string | null;
  category?: string | null;
  rating: number;
  review_count: number;
  is_verified: boolean;
}

interface TenantSearchResponse {
  profiles: TenantProfileResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const TenantListings: React.FC = () => {
  // State management
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check if filters are active
  const hasActiveFilters =
    debouncedSearchQuery.trim() !== '' ||
    categoryFilter !== '' ||
    locationFilter.trim() !== '';

  /**
   * Load tenant profiles from API
   */
  const loadTenants = useCallback(async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const params: any = {
        page,
        limit: 20,
      };

      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      if (locationFilter.trim()) {
        params.location = locationFilter.trim();
      }

      const response = await apiClient.get<TenantSearchResponse>(
        '/api/broker/tenants',
        params
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch tenant profiles');
      }

      const data = response.data;

      if (page === 1) {
        setTenants(data.profiles);
        setCurrentPage(1);
      } else {
        setTenants((prev) => [...prev, ...data.profiles]);
        setCurrentPage(page);
      }

      setTotalCount(data.total);
      setHasMore(page < data.totalPages);
    } catch (err: any) {
      console.error('Failed to load tenant profiles:', err);
      setError(err.message || 'Failed to load tenant profiles');
      if (page === 1) {
        setTenants([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [debouncedSearchQuery, categoryFilter, locationFilter]);

  /**
   * Load more tenants for infinite scroll
   */
  const loadMoreTenants = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await loadTenants(currentPage + 1);
  }, [isLoadingMore, hasMore, currentPage, loadTenants]);

  /**
   * Set up infinite scroll with Intersection Observer
   */
  const { sentinelRef } = useInfiniteScroll(loadMoreTenants, hasMore, isLoadingMore);

  /**
   * Reload tenants when filters change
   */
  useEffect(() => {
    loadTenants(1);
  }, [loadTenants]);

  /**
   * Handle filter changes
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string) => {
    setCategoryFilter(category);
  };

  const handleLocationChange = (location: string) => {
    setLocationFilter(location);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCategoryFilter('');
    setLocationFilter('');
  };

  const handleAddTenant = () => {
    // TODO: Implement add tenant functionality
    // This could open a modal or navigate to a tenant creation page
    console.log('Add tenant clicked');
    alert('Add tenant functionality coming soon');
  };

  const handleCreateTenant = () => {
    // Same as add tenant for now
    handleAddTenant();
  };

  // Determine if we should show empty state
  const showEmptyState = !loading && tenants.length === 0;

  return (
    <div className={styles.tenantListings}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Tenant Overview ({totalCount})</h1>
          <p className={styles.subtitle}>
            Monitor your properties to seek tenant engagement
          </p>
        </div>
        <button className={styles.addButton} onClick={handleAddTenant}>
          + Add Tenant
        </button>
      </header>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Search Card */}
        <TenantSearchCard
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          categoryFilter={categoryFilter}
          onCategoryChange={handleCategoryChange}
          locationFilter={locationFilter}
          onLocationChange={handleLocationChange}
          onClearFilters={handleClearFilters}
          onCreateTenant={handleCreateTenant}
          hasActiveFilters={hasActiveFilters}
          showEmptyState={showEmptyState}
          totalResults={totalCount}
        />

        {/* Error State */}
        {error && !loading && (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Error Loading Tenants</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button
              className={styles.retryButton}
              onClick={() => loadTenants(1)}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading tenant profiles...</p>
          </div>
        )}

        {/* Tenant Grid */}
        {!loading && !error && tenants.length > 0 && (
          <>
            <div className={styles.tenantGrid}>
              {tenants.map((tenant) => (
                <TenantProfileCard key={tenant.id} tenant={tenant} />
              ))}
            </div>

            {/* Loading More Indicator */}
            {isLoadingMore && (
              <div className={styles.loadingMore}>
                <div className={styles.spinner}></div>
                <span>Loading more tenants...</span>
              </div>
            )}

            {/* Infinite Scroll Sentinel */}
            {hasMore && (
              <div
                ref={sentinelRef}
                className={styles.scrollSentinel}
                aria-hidden="true"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TenantListings;
