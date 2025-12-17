import { useState, useMemo } from 'react';
import { PropertyListing } from '@types';

/**
 * Custom hook for filtering property listings by search query, status, and type
 *
 * Features:
 * - Client-side filtering by property title, address, city (search query)
 * - Filter by property status
 * - Filter by property type
 * - Debounced search handled by SearchInput component
 * - Clear filters functionality
 *
 * @param properties - Array of property listings to filter
 * @returns Object with filtered properties and filter state/setters
 */
export const usePropertyFilter = (properties: PropertyListing[]) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  /**
   * Filter properties based on search query, status, and type
   */
  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((property) =>
        property.title.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        property.city.toLowerCase().includes(query) ||
        property.state.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((property) => property.status === statusFilter);
    }

    // Filter by type
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((property) => property.property_type === typeFilter);
    }

    return filtered;
  }, [properties, searchQuery, statusFilter, typeFilter]);

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || typeFilter !== 'all';

  return {
    filteredProperties,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    clearFilters,
    hasActiveFilters,
  };
};
