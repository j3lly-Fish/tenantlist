import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { DashboardHeader } from '@components/DashboardHeader';
import { BusinessListingsSection } from '@components/BusinessListingsSection';
import { ConnectionIndicator } from '@components/ConnectionIndicator';
import { BusinessProfileModal } from '@components/BusinessProfileModal';
import { BusinessProfileStep2Modal } from '@components/BusinessProfileStep2Modal';
import { DemandListingModal } from '@components/DemandListingModal';
import { EditBusinessModal } from '@components/EditBusinessModal';
import { DeleteBusinessModal } from '@components/DeleteBusinessModal';
import { useAuth } from '@contexts/AuthContext';
import { getDashboardData, getBusinesses } from '@utils/apiClient';
import { useBusinessFilter } from '@hooks/useBusinessFilter';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import { useDashboardWebSocket } from '@hooks/useDashboardWebSocket';
import { Business } from '@types';
import styles from './Dashboard.module.css';

/**
 * Dashboard Page
 *
 * Main tenant dashboard displaying:
 * - Top navigation bar
 * - Dashboard header with title and subtitle
 * - Business listings with search, filter, and infinite scroll
 * - Connection indicator showing WebSocket status
 * - Empty state when no businesses
 *
 * Features:
 * - Loads dashboard data on mount
 * - Establishes WebSocket connection for real-time updates
 * - Client-side search and filtering
 * - Infinite scroll for business listings (20 per page)
 * - Fallback to polling if WebSocket fails
 * - Responsive design (desktop, tablet, mobile)
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal state
  const [showBusinessProfileModal, setShowBusinessProfileModal] = useState(false);
  const [showBusinessProfileStep2Modal, setShowBusinessProfileStep2Modal] = useState(false);
  const [showDemandListingModal, setShowDemandListingModal] = useState(false);
  const [createdBusinessId, setCreatedBusinessId] = useState<string | null>(null);
  const [createdBusinessName, setCreatedBusinessName] = useState<string>('');

  // Edit/Delete modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  // Business filtering
  const {
    filteredBusinesses,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    clearFilters,
    hasActiveFilters,
  } = useBusinessFilter(businesses);

  /**
   * Load initial dashboard data
   */
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getDashboardData();

        setBusinesses(data.businesses || []);
        setHasMore(data.total > (data.businesses?.length || 0));
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  /**
   * Load more businesses (infinite scroll)
   */
  const loadMoreBusinesses = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);

      const nextPage = currentPage + 1;
      const response = await getBusinesses({
        page: nextPage,
        limit: 20,
      });

      setBusinesses((prev) => [...prev, ...response.items]);
      setCurrentPage(nextPage);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error('Failed to load more businesses:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore]);

  /**
   * Set up infinite scroll
   */
  const { sentinelRef } = useInfiniteScroll(loadMoreBusinesses, hasMore, isLoadingMore);

  /**
   * WebSocket event handlers
   */
  const handleBusinessUpdate = useCallback((updatedBusiness: Business) => {
    console.log('Business update received:', updatedBusiness);
    setBusinesses((prev) =>
      prev.map((b) => (b.id === updatedBusiness.id ? updatedBusiness : b))
    );
  }, []);

  const handleBusinessCreated = useCallback((newBusiness: Business) => {
    console.log('Business created:', newBusiness);
    setBusinesses((prev) => [newBusiness, ...prev]);
  }, []);

  const handleBusinessDeleted = useCallback((data: { businessId: string }) => {
    console.log('Business deleted:', data.businessId);
    setBusinesses((prev) => prev.filter((b) => b.id !== data.businessId));
  }, []);

  /**
   * Set up WebSocket connection for real-time updates
   */
  const { isConnected, isFallbackPolling } = useDashboardWebSocket(
    undefined, // No KPI updates needed
    handleBusinessUpdate,
    handleBusinessCreated,
    handleBusinessDeleted
  );

  // Determine connection state for indicator
  const getConnectionState = (): 'connected' | 'disconnected' | 'reconnecting' => {
    if (isFallbackPolling) return 'disconnected';
    if (isConnected) return 'connected';
    return 'reconnecting';
  };

  /**
   * Edit Business handler
   */
  const handleEdit = useCallback((businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusiness(business);
      setShowEditModal(true);
    }
  }, [businesses]);

  /**
   * Delete Business handler
   */
  const handleDelete = useCallback((businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusiness(business);
      setShowDeleteModal(true);
    }
  }, [businesses]);

  /**
   * Save edited business
   */
  const handleSaveEdit = useCallback(async (businessId: string, data: Partial<Business>) => {
    const response = await fetch(`/api/businesses/${businessId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to update business');
    }

    // Reload dashboard data to reflect changes
    const dashboardData = await getDashboardData();
    setBusinesses(dashboardData.businesses || []);
  }, []);

  /**
   * Confirm delete business
   */
  const handleConfirmDelete = useCallback(async (businessId: string) => {
    const response = await fetch(`/api/businesses/${businessId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to delete business');
    }

    // Reload dashboard data to reflect changes
    const dashboardData = await getDashboardData();
    setBusinesses(dashboardData.businesses || []);
  }, []);

  const handleViewPerformance = useCallback(
    (businessId: string) => {
      // Navigate to business detail page
      navigate(`/business/${businessId}`);
    },
    [navigate]
  );

  const handleManageLocations = useCallback((businessId: string) => {
    alert('Coming soon: Manage locations functionality');
    console.log('Manage locations for business:', businessId);
  }, []);

  const handleToggleStealthMode = useCallback((businessId: string) => {
    alert('Coming soon: Toggle stealth mode functionality');
    console.log('Toggle stealth mode for business:', businessId);
  }, []);

  const handleBusinessClick = useCallback(
    (businessId: string) => {
      // Navigate to placeholder business detail page
      navigate(`/business/${businessId}`);
    },
    [navigate]
  );

  /**
   * Handle "Add Business" button click
   * Opens Business Profile modal
   */
  const handleAddBusiness = useCallback(() => {
    setShowBusinessProfileModal(true);
  }, []);

  /**
   * Handle Business Profile step 1 created
   * Opens step 2 modal
   */
  const handleBusinessProfileCreated = useCallback((businessId: string, businessName: string) => {
    console.log('Step 1 complete - opening step 2 for business:', businessId, businessName);
    setCreatedBusinessId(businessId);
    setCreatedBusinessName(businessName);
    setShowBusinessProfileModal(false);
    setShowBusinessProfileStep2Modal(true);
  }, []);

  /**
   * Handle going back from step 2 to step 1
   */
  const handleBackToStep1 = useCallback(() => {
    setShowBusinessProfileStep2Modal(false);
    setShowBusinessProfileModal(true);
  }, []);

  /**
   * Handle Business Profile step 2 completed
   * Opens the DemandListingModal to create first QFP
   */
  const handleBusinessProfileCompleted = useCallback(async () => {
    setShowBusinessProfileStep2Modal(false);
    // Show the demand listing modal to create first QFP (location)
    setShowDemandListingModal(true);

    // Also reload dashboard data to reflect new business
    try {
      const data = await getDashboardData();
      setBusinesses(data.businesses || []);
    } catch (err) {
      console.error('Failed to reload dashboard:', err);
    }
  }, []);

  /**
   * Handle DemandListing (QFP) created or skipped
   * Closes modal, clears state, and optionally navigates to business detail
   */
  const handleDemandListingCreated = useCallback(async () => {
    const businessId = createdBusinessId;
    setShowDemandListingModal(false);
    setCreatedBusinessId(null);
    setCreatedBusinessName('');

    // Reload dashboard data
    try {
      const data = await getDashboardData();
      setBusinesses(data.businesses || []);
    } catch (err) {
      console.error('Failed to reload dashboard:', err);
    }

    // Navigate to the business detail page to see the new listing
    if (businessId) {
      navigate(`/business/${businessId}`);
    }
  }, [createdBusinessId, navigate]);

  /**
   * Handle skipping QFP creation
   * User chooses not to create a QFP now
   */
  const handleSkipDemandListing = useCallback(() => {
    setShowDemandListingModal(false);
    setCreatedBusinessId(null);
    setCreatedBusinessName('');
  }, []);

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
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <TopNavigation tier="Free Plan" />

      {/* Connection indicator */}
      <ConnectionIndicator connectionState={getConnectionState()} />

      <main className={styles.content}>
        <div className={styles.container}>
          {/* Dashboard header with action buttons */}
          <div className={styles.headerWithActions}>
            <DashboardHeader />
            <div className={styles.headerButtons}>
              <button className={styles.viewMetricsButton} onClick={() => navigate('/metrics')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                View Metrics
              </button>
              <button className={styles.addBusinessButton} onClick={handleAddBusiness}>
                + Add Business
              </button>
            </div>
          </div>

          {/* Business listings section */}
          <BusinessListingsSection
            businesses={filteredBusinesses}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewPerformance={handleViewPerformance}
            onManageLocations={handleManageLocations}
            onToggleStealthMode={handleToggleStealthMode}
            onBusinessClick={handleBusinessClick}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />

          {/* Infinite scroll sentinel */}
          {hasMore && !hasActiveFilters && (
            <div ref={sentinelRef} className={styles.scrollSentinel} />
          )}
        </div>
      </main>

      {/* Modals */}
      <BusinessProfileModal
        isOpen={showBusinessProfileModal}
        onClose={() => setShowBusinessProfileModal(false)}
        onBusinessCreated={handleBusinessProfileCreated}
      />

      {createdBusinessId && (
        <BusinessProfileStep2Modal
          isOpen={showBusinessProfileStep2Modal}
          onClose={() => setShowBusinessProfileStep2Modal(false)}
          onBack={handleBackToStep1}
          businessId={createdBusinessId}
          businessName={createdBusinessName}
          onComplete={handleBusinessProfileCompleted}
        />
      )}

      {/* Demand Listing Modal - shown after business profile creation */}
      {createdBusinessId && (
        <DemandListingModal
          isOpen={showDemandListingModal}
          onClose={handleSkipDemandListing}
          businessId={createdBusinessId}
          businessName={createdBusinessName}
          onListingCreated={handleDemandListingCreated}
        />
      )}

      {/* Edit Business Modal */}
      <EditBusinessModal
        isOpen={showEditModal}
        business={selectedBusiness}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBusiness(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Delete Business Modal */}
      <DeleteBusinessModal
        isOpen={showDeleteModal}
        business={selectedBusiness}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBusiness(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default Dashboard;
