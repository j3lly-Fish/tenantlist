import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { TenantSidebar } from '@components/TenantSidebar';
import { BusinessCard } from '@components/BusinessCard';
import { BusinessProfileBlurOverlay } from '@components/BusinessProfileBlurOverlay';
import { GlobalBusinessSearch } from '@components/GlobalBusinessSearch';
import { Business } from '@types';
import styles from './MyBusinesses.module.css';

/**
 * MyBusinesses Page (Portfolio Overview)
 *
 * Displays user's business portfolio with:
 * - Page header with business count
 * - Grid layout of business cards
 * - "+ Add Business" button
 * - Blur overlay for empty state (no businesses)
 * - Global business search modal integration
 *
 * Features:
 * - Fetches user's businesses from GET /api/users/businesses on mount
 * - Displays businesses in responsive 3-column grid (desktop)
 * - Shows blur overlay when businesses.length === 0
 * - Opens GlobalBusinessSearch modal on "+ Add Business" click
 * - Refreshes business list after addition
 * - Updates count in page title dynamically
 * - Removes blur overlay after first business added
 */
const MyBusinesses: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessCount, setBusinessCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);
  const [showGlobalBusinessSearch, setShowGlobalBusinessSearch] = useState(false);

  /**
   * Fetch user's businesses
   */
  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/users/businesses', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }

      const data = await response.json();
      const fetchedBusinesses = data.data?.businesses || [];
      const count = data.data?.count || 0;

      setBusinesses(fetchedBusinesses);
      setBusinessCount(count);
      setShowBlurOverlay(count === 0);
    } catch (err: any) {
      console.error('Failed to fetch businesses:', err);
      setError(err.message || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load businesses on mount
   */
  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  /**
   * Handle "+ Add Business" button click
   * Opens Global Business Search modal
   */
  const handleAddBusiness = useCallback(() => {
    setShowGlobalBusinessSearch(true);
  }, []);

  /**
   * Handle business added from Global Business Search
   * Refreshes business list and updates count
   */
  const handleBusinessAdded = useCallback(async () => {
    console.log('Business added - refreshing list');

    // Refresh business list
    await fetchBusinesses();

    // Close modal
    setShowGlobalBusinessSearch(false);
  }, [fetchBusinesses]);

  /**
   * Handle business click - navigate to business detail
   */
  const handleBusinessClick = useCallback(
    (businessId: string) => {
      navigate(`/business/${businessId}`);
    },
    [navigate]
  );

  /**
   * Handle edit business
   */
  const handleEdit = useCallback((businessId: string) => {
    console.log('Edit business:', businessId);
    // TODO: Implement edit functionality
  }, []);

  /**
   * Handle delete business
   */
  const handleDelete = useCallback((businessId: string) => {
    console.log('Delete business:', businessId);
    // TODO: Implement delete functionality
  }, []);

  /**
   * Handle view performance
   */
  const handleViewPerformance = useCallback(
    (businessId: string) => {
      navigate(`/business/${businessId}`);
    },
    [navigate]
  );

  /**
   * Handle manage locations
   */
  const handleManageLocations = useCallback((businessId: string) => {
    console.log('Manage locations for business:', businessId);
    // TODO: Implement manage locations functionality
  }, []);

  /**
   * Handle toggle stealth mode
   */
  const handleToggleStealthMode = useCallback((businessId: string) => {
    console.log('Toggle stealth mode for business:', businessId);
    // TODO: Implement stealth mode toggle
  }, []);

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className={styles.myBusinesses}>
        <TopNavigation tier="Free Plan" />
        <div className={styles.layoutContainer}>
          <aside className={styles.sidebar}>
            <TenantSidebar />
          </aside>
          <main className={styles.content}>
            <div className={styles.container}>
              <div className={styles.loadingState}>
                <p>Loading businesses...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error && !loading) {
    return (
      <div className={styles.myBusinesses}>
        <TopNavigation tier="Free Plan" />
        <div className={styles.layoutContainer}>
          <aside className={styles.sidebar}>
            <TenantSidebar />
          </aside>
          <main className={styles.content}>
            <div className={styles.container}>
              <div className={styles.errorState}>
                <h2>Error Loading Businesses</h2>
                <p>{error}</p>
                <button
                  className={styles.retryButton}
                  onClick={fetchBusinesses}
                >
                  Retry
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.myBusinesses}>
      <TopNavigation tier="Free Plan" />

      <div className={styles.layoutContainer}>
        <aside className={styles.sidebar}>
          <TenantSidebar />
        </aside>

        <main className={styles.content}>
          <div className={styles.container}>
            {/* Page header */}
            <div className={styles.header}>
              <div className={styles.headerText}>
                <h1 className={styles.title}>
                  Portfolio Overview ({businessCount})
                </h1>
                <p className={styles.subtitle}>
                  Monitor your properties to seek tenant engagement
                </p>
              </div>
              <button
                className={styles.addBusinessButton}
                onClick={handleAddBusiness}
                aria-label="Add new business"
              >
                + Add Business
              </button>
            </div>

            {/* Business grid - Apply blur when overlay is visible */}
            <div className={showBlurOverlay ? styles.blurredContent : ''}>
              {businesses.length > 0 ? (
                <div className={styles.businessGrid}>
                  {businesses.map((business) => (
                    <BusinessCard
                      key={business.id}
                      business={business}
                      onClick={handleBusinessClick}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onViewPerformance={handleViewPerformance}
                      onManageLocations={handleManageLocations}
                      onToggleStealthMode={handleToggleStealthMode}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyPlaceholder}>
                  {/* Empty placeholder for layout */}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Blur Overlay for empty state */}
      <BusinessProfileBlurOverlay
        isVisible={showBlurOverlay}
        onAddBusinessClick={handleAddBusiness}
      />

      {/* Global Business Search Modal */}
      <GlobalBusinessSearch
        isOpen={showGlobalBusinessSearch}
        onClose={() => setShowGlobalBusinessSearch(false)}
        onBusinessAdded={handleBusinessAdded}
      />
    </div>
  );
};

export default MyBusinesses;
