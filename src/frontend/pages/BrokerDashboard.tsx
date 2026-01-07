import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { KPICard, TrendData } from '@components/KPICard';
import { ConnectionIndicator, ConnectionStatus } from '@components/ConnectionIndicator';
import { DualViewToggle, ViewMode } from '@components/DualViewToggle';
import { TenantDemandsSection } from '@components/TenantDemandsSection';
import { PropertyListingsSection } from '@components/PropertyListingsSection';
import { BrokerProfileModal } from '@components/BrokerProfileModal';
import { useAuth } from '@contexts/AuthContext';
import { useBrokerDashboardWebSocket } from '@hooks/useBrokerDashboardWebSocket';
import { useInfiniteScroll } from '@hooks/useInfiniteScroll';
import {
  getBrokerKPIs,
  getBrokerProfile,
  getBrokerDemands,
  getBrokerProperties,
} from '@utils/apiClient';
import { DemandListing, PropertyListing, PropertyType, PropertyListingStatus } from '@types';
import styles from './BrokerDashboard.module.css';

/**
 * Broker KPI data structure
 */
interface BrokerKPIData {
  activeDeals?: { value: number; trend?: TrendData };
  commissionPipeline?: { value: number; trend?: TrendData };
  responseRate?: { value: number; trend?: TrendData };
  propertiesMatched?: { value: number; trend?: TrendData };
}

/**
 * Broker Profile data structure
 */
interface BrokerProfile {
  id: string;
  user_id: string;
  company_name: string;
  license_number?: string;
  license_state?: string;
  specialties?: string[];
  bio?: string;
  website_url?: string;
  years_experience?: number;
  total_deals_closed: number;
  total_commission_earned: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * BrokerDashboard Page
 *
 * Main dashboard for brokers displaying:
 * - Top navigation bar
 * - Connection status indicator
 * - KPI cards showing broker stats with trend indicators
 * - Dual view toggle (Tenant Demands / Property Listings)
 * - Broker profile management modal
 *
 * Features:
 * - Loads KPIs and broker profile on mount
 * - Displays KPIs with trend data (up/down arrows)
 * - Real-time updates via WebSocket
 * - Dual view toggle between tenant demands and property listings
 * - Infinite scroll for both views
 * - Search and filter capabilities
 */
const BrokerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>('demands');

  // KPI data with trends
  const [kpiData, setKpiData] = useState<BrokerKPIData | null>(null);

  // Broker profile
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Tenant Demands state
  const [demands, setDemands] = useState<DemandListing[]>([]);
  const [demandsPage, setDemandsPage] = useState(1);
  const [demandsHasMore, setDemandsHasMore] = useState(false);
  const [demandsLoading, setDemandsLoading] = useState(false);
  const [demandsTotalCount, setDemandsTotalCount] = useState(0);

  // Property Listings state
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [propertiesPage, setPropertiesPage] = useState(1);
  const [propertiesHasMore, setPropertiesHasMore] = useState(false);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesTotalCount, setPropertiesTotalCount] = useState(0);

  // Filter state for demands
  const [demandsSearchQuery, setDemandsSearchQuery] = useState('');
  const [demandsStatusFilter, setDemandsStatusFilter] = useState('all');

  // Filter state for properties
  const [propertiesSearchQuery, setPropertiesSearchQuery] = useState('');
  const [propertiesStatusFilter, setPropertiesStatusFilter] = useState('all');
  const [propertiesTypeFilter, setPropertiesTypeFilter] = useState('all');

  /**
   * Load broker KPIs
   */
  const loadKPIs = useCallback(async () => {
    try {
      const kpis = await getBrokerKPIs();
      setKpiData(kpis);
    } catch (err: any) {
      console.error('Failed to load KPIs:', err);
    }
  }, []);

  /**
   * Load broker profile
   */
  const loadBrokerProfile = useCallback(async () => {
    try {
      const profile = await getBrokerProfile();
      setBrokerProfile(profile);
    } catch (err: any) {
      console.log('Broker profile not found or error loading:', err);
    }
  }, []);

  /**
   * Load tenant demands
   */
  const loadDemands = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setDemandsLoading(true);

      const data = await getBrokerDemands({ page, limit: 20 });

      setDemands(prev => append ? [...prev, ...(data.demands || [])] : (data.demands || []));
      setDemandsTotalCount(data.total);
      setDemandsHasMore(data.hasMore);
      setDemandsPage(page);
    } catch (err: any) {
      console.error('Failed to load tenant demands:', err);
    } finally {
      setDemandsLoading(false);
    }
  }, []);

  /**
   * Load property listings
   */
  const loadProperties = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setPropertiesLoading(true);

      const data = await getBrokerProperties({ page, limit: 20 });

      setProperties(prev => append ? [...prev, ...(data.properties || [])] : (data.properties || []));
      setPropertiesTotalCount(data.total);
      setPropertiesHasMore(data.hasMore);
      setPropertiesPage(page);
    } catch (err: any) {
      console.error('Failed to load properties:', err);
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  /**
   * Load more demands (infinite scroll)
   */
  const loadMoreDemands = useCallback(async () => {
    if (!demandsHasMore || demandsLoading) return;
    await loadDemands(demandsPage + 1, true);
  }, [demandsHasMore, demandsLoading, demandsPage, loadDemands]);

  /**
   * Load more properties (infinite scroll)
   */
  const loadMoreProperties = useCallback(async () => {
    if (!propertiesHasMore || propertiesLoading) return;
    await loadProperties(propertiesPage + 1, true);
  }, [propertiesHasMore, propertiesLoading, propertiesPage, loadProperties]);

  /**
   * Set up infinite scroll for demands
   */
  const { sentinelRef: demandsSentinelRef } = useInfiniteScroll(
    loadMoreDemands,
    demandsHasMore,
    demandsLoading
  );

  /**
   * Set up infinite scroll for properties
   */
  const { sentinelRef: propertiesSentinelRef } = useInfiniteScroll(
    loadMoreProperties,
    propertiesHasMore,
    propertiesLoading
  );

  /**
   * Load initial dashboard data
   */
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadKPIs(),
        loadBrokerProfile(),
        loadDemands(1),
        loadProperties(1),
      ]);
    } catch (err: any) {
      console.error('Failed to load broker dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [loadKPIs, loadBrokerProfile, loadDemands, loadProperties]);

  /**
   * Handle KPI update event from WebSocket
   */
  const handleKPIUpdate = useCallback((kpis: BrokerKPIData) => {
    console.log('Received broker KPI update via WebSocket:', kpis);
    setKpiData(kpis);
  }, []);

  /**
   * Handle deal created event from WebSocket
   */
  const handleDealCreated = useCallback((deal: any) => {
    console.log('Received broker deal created:', deal);
    // Refresh KPIs when a new deal is created
    loadKPIs();
  }, [loadKPIs]);

  /**
   * Handle deal updated event from WebSocket
   */
  const handleDealUpdated = useCallback((dealId: string, deal: any) => {
    console.log('Received broker deal updated:', dealId, deal);
    // Refresh KPIs when a deal is updated
    loadKPIs();
  }, [loadKPIs]);

  /**
   * WebSocket connection for real-time updates
   */
  const { connectionStatus, isConnected, isPolling, isReconnecting } = useBrokerDashboardWebSocket(
    user?.userId,
    true, // enabled
    {
      onKPIUpdate: handleKPIUpdate,
      onDealCreated: handleDealCreated,
      onDealUpdated: handleDealUpdated,
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
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Handle view change
   */
  const handleViewChange = useCallback((view: ViewMode) => {
    setActiveView(view);
  }, []);

  /**
   * Handle profile button click
   */
  const handleProfileButtonClick = useCallback(() => {
    setShowProfileModal(true);
  }, []);

  /**
   * Handle profile saved
   */
  const handleProfileSaved = useCallback((profile: BrokerProfile) => {
    setBrokerProfile(profile);
    setShowProfileModal(false);
  }, []);

  /**
   * Handle demand click
   */
  const handleDemandClick = useCallback((demandId: string) => {
    navigate(`/demand/${demandId}`);
  }, [navigate]);

  /**
   * Handle property click
   */
  const handlePropertyClick = useCallback((propertyId: string) => {
    navigate(`/property/${propertyId}`);
  }, [navigate]);

  /**
   * Filter demands
   */
  const filteredDemands = demands.filter((demand) => {
    // Status filter
    if (demandsStatusFilter !== 'all' && demand.status !== demandsStatusFilter) {
      return false;
    }

    // Search filter
    if (demandsSearchQuery) {
      const query = demandsSearchQuery.toLowerCase();
      return (
        demand.title?.toLowerCase().includes(query) ||
        demand.location_name?.toLowerCase().includes(query) ||
        demand.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  /**
   * Filter properties
   */
  const filteredProperties = properties.filter((property) => {
    // Status filter
    if (propertiesStatusFilter !== 'all' && property.status !== propertiesStatusFilter) {
      return false;
    }

    // Type filter
    if (propertiesTypeFilter !== 'all' && property.property_type !== propertiesTypeFilter) {
      return false;
    }

    // Search filter
    if (propertiesSearchQuery) {
      const query = propertiesSearchQuery.toLowerCase();
      return (
        property.title?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

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
              onClick={loadDashboardData}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Format commission pipeline value as currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const hasDemandsFilters = demandsSearchQuery || demandsStatusFilter !== 'all';
  const hasPropertiesFilters = propertiesSearchQuery || propertiesStatusFilter !== 'all' || propertiesTypeFilter !== 'all';

  return (
    <div className={styles.dashboard}>
      <TopNavigation tier="Broker" />

      <main className={styles.content}>
        <div className={styles.container}>
          {/* Dashboard header with Connection Indicator and Profile Button */}
          <div className={styles.headerSection}>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Broker Dashboard</h1>
              <p className={styles.pageSubtitle}>
                {brokerProfile ? brokerProfile.company_name : 'Manage your broker operations'}
              </p>
            </div>
            <div className={styles.headerActions}>
              <ConnectionIndicator connectionStatus={getConnectionStatus()} />
              <button className={styles.profileButton} onClick={handleProfileButtonClick}>
                {brokerProfile ? 'Manage Profile' : 'Create Profile'}
              </button>
            </div>
          </div>

          {/* KPI Cards with trend indicators */}
          <div className={styles.kpiGrid}>
            <KPICard
              title="Active Deals"
              value={kpiData?.activeDeals?.value ?? 0}
              loading={loading}
              trend={kpiData?.activeDeals?.trend}
            />
            <KPICard
              title="Commission Pipeline"
              value={kpiData?.commissionPipeline?.value ?? 0}
              loading={loading}
              trend={kpiData?.commissionPipeline?.trend}
              formatter={formatCurrency}
            />
            <KPICard
              title="Response Rate"
              value={kpiData?.responseRate?.value ?? 0}
              loading={loading}
              trend={kpiData?.responseRate?.trend}
              suffix="%"
            />
            <KPICard
              title="Properties Matched"
              value={kpiData?.propertiesMatched?.value ?? 0}
              loading={loading}
              trend={kpiData?.propertiesMatched?.trend}
            />
          </div>

          {/* Dual View Toggle */}
          <div className={styles.dualViewSection}>
            <DualViewToggle
              activeView={activeView}
              onViewChange={handleViewChange}
              demandsCount={demandsTotalCount}
              propertiesCount={propertiesTotalCount}
            />

            {/* Content area for dual views */}
            <div className={styles.viewContent}>
              {activeView === 'demands' ? (
                <>
                  <TenantDemandsSection
                    demands={filteredDemands}
                    loading={loading}
                    searchQuery={demandsSearchQuery}
                    onSearchChange={setDemandsSearchQuery}
                    statusFilter={demandsStatusFilter}
                    onStatusFilterChange={setDemandsStatusFilter}
                    hasActiveFilters={hasDemandsFilters}
                    onClearFilters={() => {
                      setDemandsSearchQuery('');
                      setDemandsStatusFilter('all');
                    }}
                    onDemandClick={handleDemandClick}
                    hasMore={demandsHasMore && !hasDemandsFilters}
                    isLoadingMore={demandsLoading}
                    totalCount={demandsTotalCount}
                  />
                  {/* Infinite scroll sentinel */}
                  {demandsHasMore && !hasDemandsFilters && (
                    <div ref={demandsSentinelRef} className={styles.scrollSentinel} aria-hidden="true" />
                  )}
                </>
              ) : (
                <>
                  <PropertyListingsSection
                    properties={filteredProperties}
                    loading={loading}
                    searchQuery={propertiesSearchQuery}
                    onSearchChange={setPropertiesSearchQuery}
                    statusFilter={propertiesStatusFilter}
                    onStatusFilterChange={setPropertiesStatusFilter}
                    typeFilter={propertiesTypeFilter}
                    onTypeFilterChange={setPropertiesTypeFilter}
                    hasActiveFilters={hasPropertiesFilters}
                    onClearFilters={() => {
                      setPropertiesSearchQuery('');
                      setPropertiesStatusFilter('all');
                      setPropertiesTypeFilter('all');
                    }}
                    onPropertyClick={handlePropertyClick}
                    hasMore={propertiesHasMore && !hasPropertiesFilters}
                    isLoadingMore={propertiesLoading}
                    totalCount={propertiesTotalCount}
                  />
                  {/* Infinite scroll sentinel */}
                  {propertiesHasMore && !hasPropertiesFilters && (
                    <div ref={propertiesSentinelRef} className={styles.scrollSentinel} aria-hidden="true" />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Broker Profile Modal */}
      <BrokerProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileSaved={handleProfileSaved}
        existingProfile={brokerProfile}
      />
    </div>
  );
};

export default BrokerDashboard;
