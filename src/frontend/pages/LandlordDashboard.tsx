import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { PropertyListingsSection } from '@components/PropertyListingsSection';
import { PropertyListingModal } from '@components/PropertyListingModal';
import { KPICard, TrendData } from '@components/KPICard';
import { ConnectionIndicator, ConnectionStatus } from '@components/ConnectionIndicator';
import { useAuth } from '@contexts/AuthContext';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { usePropertyDashboardWebSocket } from '@hooks/usePropertyDashboardWebSocket';
import {
  getMyPropertyListings,
  getPropertyDashboardStats,
  getLandlordKPIs,
  deletePropertyListing,
  updatePropertyListingStatus,
  createPropertyListing,
  updatePropertyListing,
} from '@utils/apiClient';
import { usePropertyFilter } from '@hooks/usePropertyFilter';
import { PropertyListing, PropertyType, PropertyListingStatus } from '@types';
import styles from './LandlordDashboard.module.css';

/**
 * LandlordDashboard Page
 *
 * Main dashboard for landlords and brokers displaying:
 * - Top navigation bar
 * - Connection status indicator (top-right of dashboard header)
 * - KPI cards showing property stats with trend indicators
 * - Property listings with search, filter, and infinite scroll
 * - Property listing creation modal
 *
 * Features:
 * - Loads property listings and stats on mount
 * - Displays KPIs with trend data (up/down arrows)
 * - Real-time updates via WebSocket with fallback to polling
 * - Client-side search and filtering
 * - Infinite scroll for property listings (20 per page)
 * - Create, edit, and delete property listings
 * - Status management (active, pending, leased, off market)
 */
const LandlordDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Dashboard stats (legacy format)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    leased: 0,
    offMarket: 0,
    totalViews: 0,
    totalInquiries: 0,
  });

  // KPI data with trends
  const [kpiData, setKpiData] = useState<{
    totalListings?: { value: number; trend?: TrendData };
    activeListings?: { value: number; trend?: TrendData };
    avgDaysOnMarket?: { value: number; trend?: TrendData };
    responseRate?: { value: number; trend?: TrendData };
  } | null>(null);

  // Modal state
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyListing | null>(null);

  // Property filtering
  const {
    filteredProperties,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    clearFilters,
    hasActiveFilters,
  } = usePropertyFilter(properties);

  /**
   * Load dashboard stats with KPIs and trends
   */
  const loadStats = useCallback(async () => {
    try {
      // Try to load enhanced KPIs with trends
      try {
        const kpis = await getLandlordKPIs();
        setKpiData(kpis);
      } catch (kpiError) {
        // Fallback to legacy stats API if new endpoint not available
        console.log('KPI endpoint not available, using legacy stats');
        const dashboardStats = await getPropertyDashboardStats();
        setStats(dashboardStats);
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      // Don't set error state here, let the dashboard continue to work
    }
  }, []);

  /**
   * Load initial property listings
   */
  const loadPropertyListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMyPropertyListings({ page: 1, limit: 20 });

      setProperties(data.listings || []);
      setTotalCount(data.total);
      setHasMore(data.hasMore);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Failed to load property listings:', err);
      setError(err.message || 'Failed to load property listings');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load more properties (infinite scroll)
   * Automatically triggered when sentinel element becomes visible
   */
  const loadMoreProperties = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);

      const nextPage = currentPage + 1;
      const data = await getMyPropertyListings({ page: nextPage, limit: 20 });

      setProperties((prev) => [...prev, ...(data.listings || [])]);
      setCurrentPage(nextPage);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load more properties:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore]);

  /**
   * Set up infinite scroll with Intersection Observer
   * Triggers loadMoreProperties when sentinel element is ~200px from viewport
   */
  const { sentinelRef } = useInfiniteScroll(loadMoreProperties, hasMore, isLoadingMore);

  /**
   * Handle KPI update event from WebSocket
   */
  const handleKPIUpdate = useCallback((kpis: any) => {
    console.log('Received KPI update via WebSocket:', kpis);
    setKpiData(kpis);
  }, []);

  /**
   * Handle property created event from WebSocket
   */
  const handlePropertyCreated = useCallback((property: PropertyListing) => {
    console.log('Received property created event:', property);
    setProperties((prev) => [property, ...prev]);
    setTotalCount((prev) => prev + 1);
    // Refresh stats to get updated KPIs
    loadStats();
  }, [loadStats]);

  /**
   * Handle property updated event from WebSocket
   */
  const handlePropertyUpdated = useCallback((propertyId: string, updatedProperty: PropertyListing) => {
    console.log('Received property updated event:', propertyId, updatedProperty);
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? updatedProperty : p))
    );
  }, []);

  /**
   * Handle property deleted event from WebSocket
   */
  const handlePropertyDeleted = useCallback((propertyId: string) => {
    console.log('Received property deleted event:', propertyId);
    setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    setTotalCount((prev) => Math.max(0, prev - 1));
    // Refresh stats to get updated KPIs
    loadStats();
  }, [loadStats]);

  /**
   * Handle property status changed event from WebSocket
   */
  const handleStatusChanged = useCallback((propertyId: string, oldStatus: string, newStatus: string) => {
    console.log('Received status changed event:', propertyId, oldStatus, newStatus);
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus as PropertyListingStatus } : p))
    );
    // Refresh stats to get updated KPIs (status change affects activeListings)
    loadStats();
  }, [loadStats]);

  /**
   * WebSocket connection for real-time updates
   */
  const { connectionStatus, isConnected, isPolling, isReconnecting } = usePropertyDashboardWebSocket(
    user?.userId,
    true, // enabled
    {
      onKPIUpdate: handleKPIUpdate,
      onPropertyCreated: handlePropertyCreated,
      onPropertyUpdated: handlePropertyUpdated,
      onPropertyDeleted: handlePropertyDeleted,
      onStatusChanged: handleStatusChanged,
    }
  );

  /**
   * Determine connection status for indicator
   */
  const getConnectionStatus = useCallback((): ConnectionStatus => {
    if (isPolling) {
      return 'polling';
    }
    if (isReconnecting) {
      return 'reconnecting';
    }
    if (isConnected) {
      return 'connected';
    }
    return 'disconnected';
  }, [isConnected, isPolling, isReconnecting]);

  /**
   * Initial data load
   */
  useEffect(() => {
    loadPropertyListings();
    loadStats();
  }, [loadPropertyListings, loadStats]);

  /**
   * Handle "Add Property" button click
   */
  const handleAddProperty = useCallback(() => {
    setEditingProperty(null);
    setShowPropertyModal(true);
  }, []);

  /**
   * Handle edit property
   */
  const handleEdit = useCallback((propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (property) {
      setEditingProperty(property);
      setShowPropertyModal(true);
    }
  }, [properties]);

  /**
   * Handle delete property
   */
  const handleDelete = useCallback(async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property listing? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePropertyListing(propertyId);
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setTotalCount((prev) => prev - 1);
      loadStats();
    } catch (err: any) {
      console.error('Failed to delete property:', err);
      alert(err.message || 'Failed to delete property listing');
    }
  }, [loadStats]);

  /**
   * Handle view property details
   */
  const handleViewDetails = useCallback((propertyId: string) => {
    navigate(`/property/${propertyId}`);
  }, [navigate]);

  /**
   * Handle update status
   */
  const handleUpdateStatus = useCallback(async (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (!property) return;

    const statusOptions: PropertyListingStatus[] = [
      PropertyListingStatus.ACTIVE,
      PropertyListingStatus.PENDING,
      PropertyListingStatus.LEASED,
      PropertyListingStatus.OFF_MARKET,
    ];

    const statusLabels: Record<PropertyListingStatus, string> = {
      [PropertyListingStatus.ACTIVE]: 'Active',
      [PropertyListingStatus.PENDING]: 'Pending',
      [PropertyListingStatus.LEASED]: 'Leased',
      [PropertyListingStatus.OFF_MARKET]: 'Off Market',
    };

    const currentIndex = statusOptions.indexOf(property.status);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    const newStatus = statusOptions[nextIndex];

    if (!window.confirm(`Change status from "${statusLabels[property.status]}" to "${statusLabels[newStatus]}"?`)) {
      return;
    }

    try {
      const result = await updatePropertyListingStatus(propertyId, newStatus);
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? result.listing : p))
      );
      loadStats();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert(err.message || 'Failed to update listing status');
    }
  }, [properties, loadStats]);

  /**
   * Handle property click
   */
  const handlePropertyClick = useCallback((propertyId: string) => {
    navigate(`/property/${propertyId}`);
  }, [navigate]);

  /**
   * Handle property listing created/updated
   * Called by PropertyListingModal after it saves the listing
   */
  const handlePropertySaved = useCallback(async () => {
    // Refresh the properties list and stats
    await loadPropertyListings();
    await loadStats();
    setShowPropertyModal(false);
    setEditingProperty(null);
  }, [loadPropertyListings, loadStats]);

  /**
   * Render error state
   */
  if (error && !loading) {
    return (
      <div className={styles.dashboard}>
        <TopNavigation />
        <main className={styles.content}>
          <div className={styles.errorState}>
            <h2>Error Loading Dashboard</h2>
            <p>{error}</p>
            <button
              className={styles.retryButton}
              onClick={() => {
                loadPropertyListings();
                loadStats();
              }}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Determine which KPI values to use (new KPI data if available, fallback to legacy stats)
  const displayKPIs = kpiData ? {
    totalListings: kpiData.totalListings?.value ?? stats.total,
    active: kpiData.activeListings?.value ?? stats.active,
    totalViews: stats.totalViews,
    totalInquiries: stats.totalInquiries,
    trends: {
      totalListings: kpiData.totalListings?.trend,
      activeListings: kpiData.activeListings?.trend,
      avgDaysOnMarket: kpiData.avgDaysOnMarket?.trend,
      responseRate: kpiData.responseRate?.trend,
    }
  } : {
    totalListings: stats.total,
    active: stats.active,
    totalViews: stats.totalViews,
    totalInquiries: stats.totalInquiries,
    trends: {}
  };

  return (
    <div className={styles.dashboard}>
      <TopNavigation tier="Free Plan" />

      <main className={styles.content}>
        <div className={styles.container}>
          {/* Dashboard header with Add Property button and Connection Indicator */}
          <div className={styles.headerSection}>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Property Listings</h1>
              <p className={styles.pageSubtitle}>
                Manage your commercial real estate listings
              </p>
            </div>
            <div className={styles.headerActions}>
              <ConnectionIndicator connectionStatus={getConnectionStatus()} />
              <button className={styles.addPropertyButton} onClick={handleAddProperty}>
                + Add Property
              </button>
            </div>
          </div>

          {/* KPI Cards with trend indicators */}
          <div className={styles.kpiGrid}>
            <KPICard
              title="Total Listings"
              value={displayKPIs.totalListings}
              loading={loading}
              trend={displayKPIs.trends.totalListings}
            />
            <KPICard
              title="Active"
              value={displayKPIs.active}
              loading={loading}
              trend={displayKPIs.trends.activeListings}
            />
            <KPICard
              title="Total Views"
              value={displayKPIs.totalViews}
              loading={loading}
            />
            <KPICard
              title="Inquiries"
              value={displayKPIs.totalInquiries}
              loading={loading}
            />
          </div>

          {/* Property listings section */}
          <PropertyListingsSection
            properties={filteredProperties}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            onUpdateStatus={handleUpdateStatus}
            onPropertyClick={handlePropertyClick}
            hasMore={hasMore && !hasActiveFilters}
            isLoadingMore={isLoadingMore}
            totalCount={totalCount}
          />

          {/* Infinite scroll sentinel - triggers loading when user scrolls near bottom */}
          {hasMore && !hasActiveFilters && (
            <div
              ref={sentinelRef}
              className={styles.scrollSentinel}
              aria-hidden="true"
            />
          )}
        </div>
      </main>

      {/* Property Listing Modal */}
      <PropertyListingModal
        isOpen={showPropertyModal}
        onClose={() => {
          setShowPropertyModal(false);
          setEditingProperty(null);
        }}
        onListingCreated={handlePropertySaved}
        editListing={editingProperty}
      />
    </div>
  );
};

export default LandlordDashboard;
