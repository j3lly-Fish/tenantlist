import React from 'react';
import { DemandListing, DemandListingStatus, FilterOption } from '@types';
import { SearchInput } from './SearchInput';
import { FilterDropdown } from './FilterDropdown';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import styles from './TenantDemandsSection.module.css';

interface TenantDemandsSectionProps {
  demands: DemandListing[];
  loading?: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onDemandClick?: (demandId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  totalCount?: number;
}

/**
 * TenantDemandsSection Component
 *
 * Displays tenant demand listings for brokers with search and filter controls
 * - Section header with demand count
 * - Search input and status filter
 * - Grid of demand cards
 * - Empty state when no demands
 * - Loading states for initial load and infinite scroll
 *
 * Layout:
 * - Desktop (1200px+): 3-column grid
 * - Tablet (768-1199px): 2-column grid
 * - Mobile (<768px): 1-column stack
 */
export const TenantDemandsSection: React.FC<TenantDemandsSectionProps> = ({
  demands,
  loading = false,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  hasActiveFilters,
  onClearFilters,
  onDemandClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  totalCount,
}) => {
  const statusFilterOptions: FilterOption[] = [
    { value: 'all', label: 'All Status' },
    { value: DemandListingStatus.ACTIVE, label: 'Active' },
    { value: DemandListingStatus.PENDING, label: 'Pending' },
    { value: DemandListingStatus.CLOSED, label: 'Closed' },
  ];

  // Show skeleton loaders for initial load
  if (loading && demands.length === 0) {
    return (
      <section className={styles.demandsSection} aria-label="Tenant Demands">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tenant Demands</h2>
        </div>

        <div className={styles.demandsGrid}>
          {[...Array(6)].map((_, index) => (
            <div key={index} className={styles.demandCardSkeleton}>
              <div className={styles.skeletonHeader}></div>
              <div className={styles.skeletonText}></div>
              <div className={styles.skeletonText}></div>
              <div className={styles.skeletonFooter}></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.demandsSection} aria-label="Tenant Demands">
      {/* Section header with count */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Tenant Demands {totalCount !== undefined && `(${totalCount})`}
        </h2>
      </div>

      {/* Controls bar: Search and Filter */}
      <div className={styles.controlsBar}>
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search demands..."
          className={styles.searchInput}
        />

        <FilterDropdown
          options={statusFilterOptions}
          value={statusFilter}
          onChange={onStatusFilterChange}
          label="Status"
          className={styles.filterDropdown}
        />

        {hasActiveFilters && (
          <button className={styles.clearFiltersButton} onClick={onClearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Demands grid */}
      {demands.length === 0 && !loading ? (
        <EmptyState
          title="No tenant demands found"
          description={
            hasActiveFilters
              ? 'Try adjusting your filters or search query'
              : 'No tenant demands are available at this time'
          }
          action={
            hasActiveFilters
              ? {
                  label: 'Clear Filters',
                  onClick: onClearFilters,
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className={styles.demandsGrid}>
            {demands.map((demand) => (
              <div
                key={demand.id}
                className={styles.demandCard}
                onClick={() => onDemandClick?.(demand.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDemandClick?.(demand.id);
                  }
                }}
              >
                {/* Card header */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.demandTitle}>
                    {demand.title || `${demand.asset_type} Space`}
                  </h3>
                  <span className={`${styles.statusBadge} ${styles[`status_${demand.status}`]}`}>
                    {demand.status}
                  </span>
                </div>

                {/* Location */}
                <div className={styles.cardRow}>
                  <span className={styles.label}>Location:</span>
                  <span className={styles.value}>{demand.location_name}</span>
                </div>

                {/* Square footage */}
                {(demand.min_sqft || demand.max_sqft) && (
                  <div className={styles.cardRow}>
                    <span className={styles.label}>Size:</span>
                    <span className={styles.value}>
                      {demand.min_sqft && demand.max_sqft
                        ? `${demand.min_sqft?.toLocaleString()} - ${demand.max_sqft?.toLocaleString()} sq ft`
                        : demand.min_sqft
                        ? `${demand.min_sqft?.toLocaleString()}+ sq ft`
                        : `Up to ${demand.max_sqft?.toLocaleString()} sq ft`}
                    </span>
                  </div>
                )}

                {/* Asset type */}
                <div className={styles.cardRow}>
                  <span className={styles.label}>Type:</span>
                  <span className={styles.value}>{demand.asset_type}</span>
                </div>

                {/* Budget */}
                {(demand.min_budget || demand.max_budget) && (
                  <div className={styles.cardRow}>
                    <span className={styles.label}>Budget:</span>
                    <span className={styles.value}>
                      {demand.min_budget && demand.max_budget
                        ? `$${demand.min_budget?.toLocaleString()} - $${demand.max_budget?.toLocaleString()}/mo`
                        : demand.min_budget
                        ? `$${demand.min_budget?.toLocaleString()}+/mo`
                        : `Up to $${demand.max_budget?.toLocaleString()}/mo`}
                    </span>
                  </div>
                )}

                {/* Start date */}
                {demand.start_date && (
                  <div className={styles.cardRow}>
                    <span className={styles.label}>Start Date:</span>
                    <span className={styles.value}>
                      {new Date(demand.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Description (truncated) */}
                {demand.description && (
                  <p className={styles.description}>
                    {demand.description.length > 120
                      ? `${demand.description.substring(0, 120)}...`
                      : demand.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Load more spinner */}
          {isLoadingMore && (
            <div className={styles.loadingMore}>
              <LoadingSpinner size="small" />
              <span>Loading more demands...</span>
            </div>
          )}
        </>
      )}
    </section>
  );
};
