import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { KPICard, TrendData } from '@components/KPICard';
import { ConnectionIndicator, ConnectionStatus } from '@components/ConnectionIndicator';
import { useAuth } from '@contexts/AuthContext';
import { usePropertyDashboardWebSocket } from '@hooks/usePropertyDashboardWebSocket';
import {
  getBrokerKPIs,
  getBrokerProfile,
} from '@utils/apiClient';
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
 * Dual view mode for broker dashboard
 */
type ViewMode = 'tenant-demands' | 'property-listings';

/**
 * BrokerDashboard Page
 *
 * Main dashboard for brokers displaying:
 * - Top navigation bar
 * - Connection status indicator
 * - KPI cards showing broker stats with trend indicators
 * - Dual view toggle (Tenant Demands / Property Listings)
 * - Broker profile management link
 *
 * Features:
 * - Loads KPIs and broker profile on mount
 * - Displays KPIs with trend data (up/down arrows)
 * - Real-time updates via WebSocket
 * - Dual view toggle between tenant demands and property listings
 */
const BrokerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('tenant-demands');

  // KPI data with trends
  const [kpiData, setKpiData] = useState<BrokerKPIData | null>(null);

  // Broker profile
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(null);

  /**
   * Load broker KPIs
   */
  const loadKPIs = useCallback(async () => {
    try {
      const kpis = await getBrokerKPIs();
      setKpiData(kpis);
    } catch (err: any) {
      console.error('Failed to load KPIs:', err);
      // Don't set error state, let dashboard continue to work
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
      // Don't set error state, profile is optional
    }
  }, []);

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
      ]);
    } catch (err: any) {
      console.error('Failed to load broker dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [loadKPIs, loadBrokerProfile]);

  /**
   * Handle KPI update event from WebSocket
   */
  const handleKPIUpdate = useCallback((kpis: any) => {
    console.log('Received broker KPI update via WebSocket:', kpis);
    setKpiData(kpis);
  }, []);

  /**
   * WebSocket connection for real-time updates
   * Reusing property dashboard WebSocket hook for now
   * TODO: Create broker-specific WebSocket hook
   */
  const { connectionStatus, isConnected, isPolling, isReconnecting } = usePropertyDashboardWebSocket(
    user?.userId,
    true, // enabled
    {
      onKPIUpdate: handleKPIUpdate,
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
   * Handle view mode toggle
   */
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  /**
   * Navigate to broker profile management
   */
  const handleManageProfile = useCallback(() => {
    navigate('/broker-profile');
  }, [navigate]);

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

  return (
    <div className={styles.dashboard}>
      <TopNavigation tier="Broker" />

      <main className={styles.content}>
        <div className={styles.container}>
          {/* Dashboard header with Connection Indicator and Profile Link */}
          <div className={styles.headerSection}>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Broker Dashboard</h1>
              <p className={styles.pageSubtitle}>
                {brokerProfile ? brokerProfile.company_name : 'Manage your broker operations'}
              </p>
            </div>
            <div className={styles.headerActions}>
              <ConnectionIndicator connectionStatus={getConnectionStatus()} />
              <button className={styles.profileButton} onClick={handleManageProfile}>
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
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleButton} ${viewMode === 'tenant-demands' ? styles.active : ''}`}
                onClick={() => handleViewModeChange('tenant-demands')}
              >
                Tenant Demands
              </button>
              <button
                className={`${styles.toggleButton} ${viewMode === 'property-listings' ? styles.active : ''}`}
                onClick={() => handleViewModeChange('property-listings')}
              >
                Property Listings
              </button>
            </div>

            {/* Content area for dual views (to be implemented in Task Group 7) */}
            <div className={styles.viewContent}>
              {viewMode === 'tenant-demands' ? (
                <div className={styles.placeholderContent}>
                  <p>Tenant Demands view - Coming soon</p>
                  <p className={styles.placeholderSubtext}>Browse and match with tenant space requirements</p>
                </div>
              ) : (
                <div className={styles.placeholderContent}>
                  <p>Property Listings view - Coming soon</p>
                  <p className={styles.placeholderSubtext}>Browse available commercial properties</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BrokerDashboard;
