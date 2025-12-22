import React from 'react';
import { PropertyListing, PropertyType, PropertyListingStatus, FilterOption } from '@types';
import { PropertyCard } from './PropertyCard';
import { PropertyCardSkeleton } from './PropertyCardSkeleton';
import { SearchInput } from './SearchInput';
import { FilterDropdown } from './FilterDropdown';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import styles from './PropertyListingsSection.module.css';

interface PropertyListingsSectionProps {
  properties: PropertyListing[];
  loading?: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onEdit?: (propertyId: string) => void;
  onDelete?: (propertyId: string) => void;
  onViewDetails?: (propertyId: string) => void;
  onUpdateStatus?: (propertyId: string) => void;
  onPropertyClick?: (propertyId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  totalCount?: number;
}

/**
 * PropertyListingsSection Component
 *
 * Displays the property listings with search and filter controls
 * - Section header with property count
 * - Search input with "Search Listings" placeholder
 * - Status/type filters with filter icons
 * - Grid of property cards
 * - Empty state when no properties
 * - Loading states for initial load and infinite scroll
 *
 * Layout:
 * - Desktop (1200px+): 3-column grid
 * - Tablet (768-1199px): 2-column grid
 * - Mobile (<768px): 1-column stack
 */
export const PropertyListingsSection: React.FC<PropertyListingsSectionProps> = ({
  properties,
  loading = false,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  hasActiveFilters,
  onClearFilters,
  onEdit,
  onDelete,
  onViewDetails,
  onUpdateStatus,
  onPropertyClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  totalCount,
}) => {
  const statusFilterOptions: FilterOption[] = [
    { value: 'all', label: 'All Status' },
    { value: PropertyListingStatus.ACTIVE, label: 'Active' },
    { value: PropertyListingStatus.PENDING, label: 'Pending' },
    { value: PropertyListingStatus.LEASED, label: 'Leased' },
    { value: PropertyListingStatus.OFF_MARKET, label: 'Off Market' },
  ];

  const typeFilterOptions: FilterOption[] = [
    { value: 'all', label: 'All Types' },
    { value: PropertyType.RETAIL, label: 'Retail' },
    { value: PropertyType.RESTAURANT, label: 'Restaurant' },
    { value: PropertyType.OFFICE, label: 'Office' },
    { value: PropertyType.INDUSTRIAL, label: 'Industrial' },
    { value: PropertyType.WAREHOUSE, label: 'Warehouse' },
    { value: PropertyType.MEDICAL, label: 'Medical' },
    { value: PropertyType.FLEX, label: 'Flex' },
    { value: PropertyType.LAND, label: 'Land' },
    { value: PropertyType.OTHER, label: 'Other' },
  ];

  // Show skeleton loaders for initial load
  if (loading && properties.length === 0) {
    return (
      <section className={styles.propertyListingsSection} aria-label="Property Listings">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Your Property Listings</h2>
        </div>

        <div className={styles.propertyGrid}>
          {[...Array(6)].map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  const displayCount = totalCount !== undefined ? totalCount : properties.length;

  return (
    <section className={styles.propertyListingsSection} aria-label="Property Listings">
      {/* Section header with count */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Your Property Listings ({displayCount})
        </h2>
      </div>

      {/* Controls bar: Search and Filters */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <SearchInput
            placeholder="Search Listings"
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onClearFilters}
          />
        </div>
        <div className={styles.filtersWrapper}>
          <FilterDropdown
            options={statusFilterOptions}
            value={statusFilter}
            onChange={onStatusFilterChange}
            label="Filter by status"
          />
          <FilterDropdown
            options={typeFilterOptions}
            value={typeFilter}
            onChange={onTypeFilterChange}
            label="Filter by type"
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

      {/* Property grid or empty state */}
      {properties.length === 0 ? (
        <EmptyState
          title="No Property Listings"
          message={
            hasActiveFilters
              ? 'No properties match your filters. Try clearing filters or adjusting your search.'
              : "You haven't created any property listings yet. Click the 'Add Property' button to get started."
          }
        />
      ) : (
        <>
          <div className={styles.propertyGrid}>
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                onUpdateStatus={onUpdateStatus}
                onClick={onPropertyClick}
              />
            ))}
          </div>

          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className={styles.loadingMore}>
              <LoadingSpinner size="medium" />
              <p className={styles.loadingText}>Loading more properties...</p>
            </div>
          )}

          {/* End of list message */}
          {!hasMore && properties.length > 0 && !isLoadingMore && (
            <div className={styles.endOfList}>
              <p>No more properties to load</p>
            </div>
          )}
        </>
      )}
    </section>
  );
};
