import React, { useState } from 'react';
import styles from './TenantSearchCard.module.css';

/**
 * TenantSearchCard Component
 *
 * Main search interface for tenant listings page.
 * Features:
 * - Search input for tenant name
 * - Category filter dropdown
 * - Location filter input
 * - Clear filters button
 * - Empty state when no tenants found
 * - "Create New Tenant" CTA button
 */

interface TenantSearchCardProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  locationFilter: string;
  onLocationChange: (location: string) => void;
  onClearFilters: () => void;
  onCreateTenant?: () => void;
  hasActiveFilters: boolean;
  showEmptyState: boolean;
  totalResults: number;
}

// Common tenant categories from Figma design
const TENANT_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Quick Service Retail', label: 'Quick Service Retail' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Office', label: 'Office' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Fitness', label: 'Fitness' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Services', label: 'Services' },
];

export const TenantSearchCard: React.FC<TenantSearchCardProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  locationFilter,
  onLocationChange,
  onClearFilters,
  onCreateTenant,
  hasActiveFilters,
  showEmptyState,
  totalResults,
}) => {
  const [searchInputValue, setSearchInputValue] = useState(searchQuery);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInputValue(value);
    // Debounce is handled in the parent component
    onSearchChange(value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCategoryChange(e.target.value);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLocationChange(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchInputValue('');
    onClearFilters();
  };

  const handleCreateTenant = () => {
    if (onCreateTenant) {
      onCreateTenant();
    }
  };

  return (
    <div className={styles.searchCard}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Search for tenant profile</h2>
        <p className={styles.subtitle}>
          Create your personal profile, you will then be able to create your business pages
        </p>
      </div>

      {/* Search Input */}
      <div className={styles.searchSection}>
        <div className={styles.searchInputContainer}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search for Tenant"
            value={searchInputValue}
            onChange={handleSearchInputChange}
            aria-label="Search for tenant"
          />
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filterRow}>
          {/* Category Filter */}
          <div className={styles.filterGroup}>
            <label htmlFor="category-filter" className={styles.filterLabel}>
              Category
            </label>
            <select
              id="category-filter"
              className={styles.filterSelect}
              value={categoryFilter}
              onChange={handleCategoryChange}
            >
              {TENANT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className={styles.filterGroup}>
            <label htmlFor="location-filter" className={styles.filterLabel}>
              Location (Optional)
            </label>
            <input
              id="location-filter"
              type="text"
              className={styles.filterInput}
              placeholder="City, State"
              value={locationFilter}
              onChange={handleLocationChange}
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearFiltersButton}
              onClick={handleClearFilters}
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      {!showEmptyState && totalResults > 0 && (
        <div className={styles.resultsCount}>
          {totalResults} {totalResults === 1 ? 'tenant' : 'tenants'} found
        </div>
      )}

      {/* Empty State */}
      {showEmptyState && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🔍</div>
          <p className={styles.emptyStateText}>Can't find your tenant?</p>
          <p className={styles.emptyStateSubtext}>
            Click the button below to create a new tenant and add expansion locations
          </p>
          <button
            type="button"
            className={styles.createButton}
            onClick={handleCreateTenant}
          >
            Create New Tenant
          </button>
        </div>
      )}
    </div>
  );
};
