import React from 'react';
import { Business, FilterOption } from '@types';
import { BusinessCard } from './BusinessCard';
import { BusinessCardSkeleton } from './BusinessCardSkeleton';
import { SearchInput } from './SearchInput';
import { FilterDropdown } from './FilterDropdown';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import styles from './BusinessListingsSection.module.css';

interface BusinessListingsSectionProps {
  businesses: Business[];
  loading?: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onEdit?: (businessId: string) => void;
  onDelete?: (businessId: string) => void;
  onViewPerformance?: (businessId: string) => void;
  onManageLocations?: (businessId: string) => void;
  onToggleStealthMode?: (businessId: string) => void;
  onBusinessClick?: (businessId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  userTier?: string;
}

/**
 * BusinessListingsSection Component
 *
 * Displays the business listings with search and filter controls
 * - Section header with business count
 * - Search input and status filter
 * - Grid of business cards
 * - Empty state when no businesses
 * - Loading states for initial load and infinite scroll
 *
 * Layout:
 * - Desktop (1200px+): 3-column grid
 * - Tablet (768-1199px): 2-column grid
 * - Mobile (<768px): 1-column stack
 */
export const BusinessListingsSection: React.FC<BusinessListingsSectionProps> = ({
  businesses,
  loading = false,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  hasActiveFilters,
  onClearFilters,
  onEdit,
  onDelete,
  onViewPerformance,
  onManageLocations,
  onToggleStealthMode,
  onBusinessClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  userTier = 'starter',
}) => {
  const statusFilterOptions: FilterOption[] = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'pending_verification', label: 'Pending Verification' },
    { value: 'stealth_mode', label: 'Stealth Mode' },
  ];

  // Show skeleton loaders for initial load
  if (loading && businesses.length === 0) {
    return (
      <section className={styles.businessListingsSection} aria-label="Business Listings">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Business Listings</h2>
        </div>

        <div className={styles.businessGrid}>
          {[...Array(4)].map((_, index) => (
            <BusinessCardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.businessListingsSection} aria-label="Business Listings">
      {/* Section header with count */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Your Business Listings ({businesses.length})
        </h2>
      </div>

      {/* Controls bar: Search and Filter */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <SearchInput
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onClearFilters}
          />
        </div>
        <div className={styles.filterWrapper}>
          <FilterDropdown
            options={statusFilterOptions}
            value={statusFilter}
            onChange={onStatusFilterChange}
            label="Filter by status"
          />
        </div>
        {hasActiveFilters && (
          <button
            className={styles.clearFiltersButton}
            onClick={onClearFilters}
            aria-label="Clear all filters"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Business grid or empty state */}
      {businesses.length === 0 ? (
        <EmptyState
          title="No Active Listings"
          message={
            hasActiveFilters
              ? 'No businesses match your filters. Try clearing filters or adjusting your search.'
              : "You haven't created any business listings yet. Click the Add Business button to get started."
          }
        />
      ) : (
        <>
          <div className={styles.businessGrid}>
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewPerformance={onViewPerformance}
                onManageLocations={onManageLocations}
                onToggleStealthMode={onToggleStealthMode}
                onClick={onBusinessClick}
                userTier={userTier}
              />
            ))}
          </div>

          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className={styles.loadingMore}>
              <LoadingSpinner size="medium" />
              <p className={styles.loadingText}>Loading more businesses...</p>
            </div>
          )}

          {/* End of list message */}
          {!hasMore && businesses.length > 0 && !isLoadingMore && (
            <div className={styles.endOfList}>
              <p>No more businesses to load</p>
            </div>
          )}
        </>
      )}
    </section>
  );
};
