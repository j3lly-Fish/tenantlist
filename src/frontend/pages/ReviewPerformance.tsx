import React, { useState, useEffect } from 'react';
import { TopNavigation } from '@components/TopNavigation';
import { TenantSidebar } from '@components/TenantSidebar';
import { Business } from '@types';
import {
  BuildingOfficeIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import styles from './ReviewPerformance.module.css';

/**
 * ReviewPerformance Page (Tenant)
 *
 * Performance overview page showing:
 * - Key metrics (Property Invites, Declined, Messages, OFPs)
 * - Business/listing filters
 * - Property performance cards with circular charts
 * - Top performing brokers chart
 */
const ReviewPerformance: React.FC = () => {
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('last-30');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    propertyInvites: 0,
    declined: { count: 0, percentage: 0 },
    messages: { total: 0, unread: 0 },
    qfps: 0,
  });
  const [properties, setProperties] = useState<any[]>([]);

  // Fetch user's businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/businesses', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBusinesses(data.data?.businesses || []);
        }
      } catch (error) {
        console.error('Failed to fetch businesses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  // Fetch performance metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedBusiness !== 'all') {
          params.append('businessId', selectedBusiness);
        }

        const response = await fetch(`/api/performance/metrics?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
  }, [selectedBusiness]);

  // Fetch property performance data
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedBusiness !== 'all') {
          params.append('businessId', selectedBusiness);
        }

        const response = await fetch(`/api/performance/properties?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProperties(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      }
    };

    fetchProperties();
  }, [selectedBusiness]);

  return (
    <div className={styles.reviewPerformance}>
      <TopNavigation tier="Free Plan" />

      <div className={styles.layoutContainer}>
        <aside className={styles.sidebar}>
          <TenantSidebar />
        </aside>

        <main className={styles.content}>
          <div className={styles.container}>
            {/* Page Header */}
            <div className={styles.header}>
              <h1 className={styles.title}>Performance Overview</h1>
              <p className={styles.subtitle}>
                Track proposals, review performance, and reinforce your brokers strategies
              </p>
            </div>

            {/* Metrics Row */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <BuildingOfficeIcon className={styles.metricIcon} />
                <div className={styles.metricValue}>{metrics.propertyInvites.toLocaleString()}</div>
                <div className={styles.metricLabel}>Property Invites</div>
              </div>

              <div className={`${styles.metricCard} ${styles.declined}`}>
                <XCircleIcon className={styles.metricIcon} />
                <div className={styles.metricValue}>
                  {metrics.declined.count.toLocaleString()}
                  <span className={styles.percentage}>({metrics.declined.percentage}%)</span>
                </div>
                <div className={styles.metricLabel}>Declined</div>
              </div>

              <div className={styles.metricCard}>
                <ChatBubbleLeftRightIcon className={styles.metricIcon} />
                <div className={styles.metricValue}>
                  {metrics.messages.total.toLocaleString()}
                  <span className={styles.percentage}>({metrics.messages.unread} unread)</span>
                </div>
                <div className={styles.metricLabel}>Messages</div>
              </div>

              <div className={styles.metricCard}>
                <DocumentTextIcon className={styles.metricIcon} />
                <div className={styles.metricValue}>
                  {metrics.qfps.toLocaleString()}
                </div>
                <div className={styles.metricLabel}>QFP's</div>
              </div>
            </div>

            {/* Filters Section */}
            <div className={styles.filtersSection}>
              <div className={styles.filters}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Select Business</label>
                  <select
                    className={styles.filterSelect}
                    value={selectedBusiness}
                    onChange={(e) => setSelectedBusiness(e.target.value)}
                    disabled={loading}
                  >
                    <option value="all">All Businesses</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Listing Name</label>
                  <select
                    className={styles.filterSelect}
                    value={selectedListing}
                    onChange={(e) => setSelectedListing(e.target.value)}
                  >
                    <option value="">Select</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>State</label>
                  <select
                    className={styles.filterSelect}
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    <option value="">Select</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Date Range</label>
                  <select
                    className={styles.filterSelect}
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="last-30">Last 30 days</option>
                    <option value="last-60">Last 60 days</option>
                    <option value="last-90">Last 90 days</option>
                  </select>
                </div>

                <button className={styles.iconButton} aria-label="View as table">
                  <span>📊</span>
                </button>

                <button className={styles.iconButton} aria-label="Export data">
                  <span>📈</span>
                </button>
              </div>

              <button className={styles.downloadButton}>
                <ArrowDownTrayIcon className={styles.downloadIcon} />
                Download
              </button>
            </div>

            {/* Property Performance Cards */}
            <div className={styles.propertiesGrid}>
              {properties.map((property) => (
                <div key={property.id} className={styles.propertyCard}>
                  <div className={styles.propertyHeader}>
                    <div>
                      <h3 className={styles.propertyName}>{property.name}</h3>
                      <p className={styles.propertyType}>{property.type}</p>
                    </div>
                    <div className={styles.chartContainer}>
                      <svg viewBox="0 0 120 120" className={styles.chart}>
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="20"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="20"
                          strokeDasharray="314"
                          strokeDashoffset="78"
                          transform="rotate(-90 60 60)"
                        />
                      </svg>
                      <div className={styles.chartLabel}>
                        <div className={styles.chartValue}>{property.views}</div>
                        <div className={styles.chartText}>Views</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.propertyMetrics}>
                    <div className={styles.propertyMetric}>
                      <div className={styles.metricDot} style={{ backgroundColor: '#3b82f6' }} />
                      <span className={styles.metricText}>
                        Property Invitations ({property.propertyInvitations})
                      </span>
                    </div>
                    <div className={styles.propertyMetric}>
                      <div className={styles.metricDot} style={{ backgroundColor: '#60a5fa' }} />
                      <span className={styles.metricText}>
                        OFPs Submitted ({property.ofpsSubmitted})
                      </span>
                    </div>
                    <div className={styles.propertyMetric}>
                      <div className={styles.metricDot} style={{ backgroundColor: '#93c5fd' }} />
                      <span className={styles.metricText}>Messages ({property.messages})</span>
                    </div>
                    <div className={styles.propertyMetric}>
                      <div className={styles.metricDot} style={{ backgroundColor: '#dbeafe' }} />
                      <span className={styles.metricText}>Declines ({property.declines})</span>
                    </div>
                  </div>

                  <div className={styles.avgTime}>{property.avgTime} (avg. time on page)</div>

                  {property.declineReasons && (
                    <div className={styles.declineReasons}>
                      {property.declineReasons.map((reason, idx) => (
                        <div key={idx} className={styles.declineReason}>
                          <span className={styles.reasonText}>{reason.reason}</span>
                          <span className={styles.reasonStats}>
                            ({reason.count}) {reason.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReviewPerformance;
