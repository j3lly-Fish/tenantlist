import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { LoadingSpinner } from '@components/LoadingSpinner';
import styles from './MetricsDashboard.module.css';

interface LocationMetrics {
  id: string;
  businessName: string;
  businessLogo?: string;
  city: string;
  state: string;
  propertyInvitations: number;
  declines: number;
  messages: number;
  qfpSubmitted: number;
  avgTimeOnPage: number;
}

interface BrokerPerformance {
  id: string;
  name: string;
  avatar?: string;
  deals: number;
  responseRate: number;
  avgDeal: number;
}

interface SummaryMetrics {
  totalInvites: number;
  totalDeclines: number;
  totalMessages: number;
  totalQfpSent: number;
}

interface Business {
  id: string;
  name: string;
}

// Donut Chart Component for Graph View
const DonutChart: React.FC<{
  totalViews: number;
  propertyInvitations: number;
  qfpSubmitted: number;
  messages: number;
  declines: number;
}> = ({ totalViews, propertyInvitations, qfpSubmitted, messages, declines }) => {
  const total = propertyInvitations + qfpSubmitted + messages + declines;
  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  const invitationsPercent = total > 0 ? (propertyInvitations / total) * 100 : 0;
  const qfpPercent = total > 0 ? (qfpSubmitted / total) * 100 : 0;
  const messagesPercent = total > 0 ? (messages / total) * 100 : 0;
  const declinesPercent = total > 0 ? (declines / total) * 100 : 0;

  const invitationsOffset = 0;
  const qfpOffset = (invitationsPercent / 100) * circumference;
  const messagesOffset = ((invitationsPercent + qfpPercent) / 100) * circumference;
  const declinesOffset = ((invitationsPercent + qfpPercent + messagesPercent) / 100) * circumference;

  return (
    <div className={styles.donutContainer}>
      <svg viewBox="0 0 160 160" className={styles.donutSvg}>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        {invitationsPercent > 0 && (
          <circle
            cx="80" cy="80" r={radius} fill="none" stroke="#3b82f6" strokeWidth={strokeWidth}
            strokeDasharray={`${(invitationsPercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-invitationsOffset} transform="rotate(-90 80 80)"
          />
        )}
        {qfpPercent > 0 && (
          <circle
            cx="80" cy="80" r={radius} fill="none" stroke="#14b8a6" strokeWidth={strokeWidth}
            strokeDasharray={`${(qfpPercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-qfpOffset} transform="rotate(-90 80 80)"
          />
        )}
        {messagesPercent > 0 && (
          <circle
            cx="80" cy="80" r={radius} fill="none" stroke="#1e40af" strokeWidth={strokeWidth}
            strokeDasharray={`${(messagesPercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-messagesOffset} transform="rotate(-90 80 80)"
          />
        )}
        {declinesPercent > 0 && (
          <circle
            cx="80" cy="80" r={radius} fill="none" stroke="#d1d5db" strokeWidth={strokeWidth}
            strokeDasharray={`${(declinesPercent / 100) * circumference} ${circumference}`}
            strokeDashoffset={-declinesOffset} transform="rotate(-90 80 80)"
          />
        )}
      </svg>
      <div className={styles.donutCenter}>
        <span className={styles.donutValue}>{totalViews}</span>
        <span className={styles.donutLabel}>Views</span>
      </div>
    </div>
  );
};

const MetricsDashboard: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('30');
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');
  const [sortColumn, setSortColumn] = useState<string>('declines');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Metrics data
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalInvites: 122,
    totalDeclines: 16,
    totalMessages: 97,
    totalQfpSent: 28,
  });

  const [locationMetrics, setLocationMetrics] = useState<LocationMetrics[]>([]);
  const [brokerPerformance, setBrokerPerformance] = useState<BrokerPerformance[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch businesses
        const businessResponse = await fetch('/api/businesses', {
          credentials: 'include',
        });
        const businessData = await businessResponse.json();
        if (businessResponse.ok && businessData.data?.items) {
          setBusinesses(businessData.data.items);
        }

        // Mock location metrics data
        const mockLocations: LocationMetrics[] = [
          {
            id: '1',
            businessName: "Rocco's Taco's",
            city: 'Miami',
            state: 'FL',
            propertyInvitations: 39,
            declines: 4,
            messages: 22,
            qfpSubmitted: 3,
            avgTimeOnPage: 2.3,
          },
          {
            id: '2',
            businessName: "Rocco's Taco's",
            city: 'New York',
            state: 'NY',
            propertyInvitations: 42,
            declines: 7,
            messages: 22,
            qfpSubmitted: 11,
            avgTimeOnPage: 1.67,
          },
          {
            id: '3',
            businessName: "Rocco's Taco's",
            city: 'Los Angeles',
            state: 'CA',
            propertyInvitations: 13,
            declines: 9,
            messages: 12,
            qfpSubmitted: 3,
            avgTimeOnPage: 3.22,
          },
        ];

        setLocationMetrics(mockLocations);

        // Extract unique locations
        const uniqueLocations = [...new Set(mockLocations.map(l => `${l.city}, ${l.state}`))];
        setLocations(uniqueLocations);

        // Mock broker performance data
        const mockBrokers: BrokerPerformance[] = [
          { id: '1', name: 'Sarah Johnson', deals: 12, responseRate: 95, avgDeal: 250000 },
          { id: '2', name: 'Michael Thompson', deals: 20, responseRate: 90, avgDeal: 300000 },
          { id: '3', name: 'James Smith', deals: 10, responseRate: 80, avgDeal: 150000 },
        ];

        setBrokerPerformance(mockBrokers);

      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedBusiness, selectedLocation, dateRange]);

  // Filter and sort locations
  const filteredLocations = locationMetrics
    .filter(location => {
      if (selectedLocation && `${location.city}, ${location.state}` !== selectedLocation) return false;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortColumn as keyof LocationMetrics] as number;
      const bValue = b[sortColumn as keyof LocationMetrics] as number;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Handle download
  const handleDownload = () => {
    const headers = ['Business', 'Location', 'Property Invitations', 'Declines', 'Messages', 'QFPs Submitted', 'Avg. Time (mins)'];
    const rows = filteredLocations.map(l => [
      l.businessName,
      `${l.city}, ${l.state}`,
      l.propertyInvitations,
      l.declines,
      l.messages,
      l.qfpSubmitted,
      l.avgTimeOnPage,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return value.toString();
  };

  if (loading) {
    return (
      <div className={styles.metricsPage}>
        <TopNavigation />
        <main className={styles.content}>
          <LoadingSpinner size="large" centered />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.metricsPage}>
      <TopNavigation />

      <main className={styles.content}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.headerRow}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>View locations listing metrics</h1>
              <p className={styles.subtitle}>Manage your space requirements and track proposals</p>
            </div>
            <button className={styles.manageButton} onClick={() => navigate('/dashboard')}>
              <span className={styles.manageIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </span>
              <span>Manage Businesses</span>
            </button>
          </div>

          {/* Summary Card */}
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Total Location Performance Summary</h2>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Invites</span>
                <span className={styles.summaryValue}>{summaryMetrics.totalInvites}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Declines</span>
                <span className={styles.summaryValue}>{summaryMetrics.totalDeclines}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Messages</span>
                <span className={styles.summaryValue}>{summaryMetrics.totalMessages}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total QFP Sent</span>
                <span className={styles.summaryValue}>{summaryMetrics.totalQfpSent}</span>
              </div>
            </div>
          </div>

          {/* Filters and Table Card */}
          <div className={styles.tableCard}>
            {/* Filters Row */}
            <div className={styles.filtersRow}>
              <div className={styles.filtersLeft}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Select a Business</label>
                  <select
                    className={styles.filterSelect}
                    value={selectedBusiness}
                    onChange={(e) => setSelectedBusiness(e.target.value)}
                  >
                    <option value="all">All Businesses</option>
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Date Range</label>
                  <select
                    className={styles.filterSelect}
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Locations</label>
                  <select
                    className={styles.filterSelect}
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    <option value="">Select One</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.filtersRight}>
                <div className={styles.viewToggle}>
                  <button
                    className={`${styles.toggleButton} ${viewMode === 'table' ? styles.toggleActive : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="3" y1="15" x2="21" y2="15" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                    Table
                  </button>
                  <button
                    className={`${styles.toggleButton} ${viewMode === 'graph' ? styles.toggleActive : ''}`}
                    onClick={() => setViewMode('graph')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    Graph
                  </button>
                </div>

                <button className={styles.downloadButton} onClick={handleDownload}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
              </div>
            </div>

            {/* Table View */}
            {viewMode === 'table' ? (
              <table className={styles.metricsTable}>
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Location</th>
                    <th onClick={() => handleSort('propertyInvitations')} className={styles.sortableHeader}>
                      Property Invitations
                      {sortColumn === 'propertyInvitations' && (
                        <span className={styles.sortArrow}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('declines')} className={styles.sortableHeader}>
                      Declines
                      {sortColumn === 'declines' && (
                        <span className={styles.sortArrow}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('messages')} className={styles.sortableHeader}>
                      Messages
                      {sortColumn === 'messages' && (
                        <span className={styles.sortArrow}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('qfpSubmitted')} className={styles.sortableHeader}>
                      QFP's Submitted
                      {sortColumn === 'qfpSubmitted' && (
                        <span className={styles.sortArrow}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th onClick={() => handleSort('avgTimeOnPage')} className={styles.sortableHeader}>
                      Avg. time on page (Mins)
                      {sortColumn === 'avgTimeOnPage' && (
                        <span className={styles.sortArrow}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map(location => (
                    <tr key={location.id}>
                      <td>
                        <div className={styles.businessCell}>
                          <div className={styles.businessAvatar}>
                            {location.businessLogo ? (
                              <img src={location.businessLogo} alt="" />
                            ) : (
                              <span className={styles.avatarPlaceholder}></span>
                            )}
                          </div>
                          <span>{location.businessName}</span>
                        </div>
                      </td>
                      <td>{location.city}</td>
                      <td>{location.propertyInvitations}</td>
                      <td>{location.declines}</td>
                      <td>{location.messages}</td>
                      <td>{location.qfpSubmitted}</td>
                      <td>{location.avgTimeOnPage}</td>
                      <td>
                        <button className={styles.actionsButton}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="6" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="18" r="2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* Graph View */
              <div className={styles.locationCardsGrid}>
                {filteredLocations.map(location => (
                  <div key={location.id} className={styles.locationCard}>
                    <div className={styles.locationHeader}>
                      <h3 className={styles.locationCity}>{location.city}</h3>
                      <span className={styles.locationBusiness}>{location.businessName}</span>
                    </div>
                    <div className={styles.locationContent}>
                      <div className={styles.chartLegend}>
                        <div className={styles.legendRow}>
                          <span className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }}></span>
                          <span className={styles.legendText}>Property Invitations ({location.propertyInvitations})</span>
                        </div>
                        <div className={styles.legendRow}>
                          <span className={styles.legendDot} style={{ backgroundColor: '#14b8a6' }}></span>
                          <span className={styles.legendText}>QFP's Submitted ({location.qfpSubmitted})</span>
                        </div>
                        <div className={styles.legendRow}>
                          <span className={styles.legendDot} style={{ backgroundColor: '#1e40af' }}></span>
                          <span className={styles.legendText}>Messages ({location.messages})</span>
                        </div>
                        <div className={styles.legendRow}>
                          <span className={styles.legendDot} style={{ backgroundColor: '#d1d5db' }}></span>
                          <span className={styles.legendText}>Declines ({location.declines})</span>
                        </div>
                      </div>
                      <DonutChart
                        totalViews={350}
                        propertyInvitations={location.propertyInvitations}
                        qfpSubmitted={location.qfpSubmitted}
                        messages={location.messages}
                        declines={location.declines}
                      />
                    </div>
                    <div className={styles.locationFooter}>
                      <span className={styles.footerStat}>{location.avgTimeOnPage} Mins (avg. time on page)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Performing Brokers */}
          <div className={styles.brokersCard}>
            <h2 className={styles.brokersTitle}>Top Performing Brokers</h2>
            <div className={styles.brokersList}>
              {brokerPerformance.map(broker => (
                <div key={broker.id} className={styles.brokerRow}>
                  <div className={styles.brokerInfo}>
                    <div className={styles.brokerAvatar}>
                      {broker.avatar ? (
                        <img src={broker.avatar} alt="" />
                      ) : (
                        <span className={styles.brokerAvatarPlaceholder}></span>
                      )}
                    </div>
                    <div className={styles.brokerDetails}>
                      <span className={styles.brokerName}>{broker.name}</span>
                      <span className={styles.brokerStats}>
                        {broker.deals} deals - {broker.responseRate}% response
                      </span>
                    </div>
                  </div>
                  <div className={styles.brokerDeal}>
                    <span className={styles.dealValue}>{formatCurrency(broker.avgDeal)}</span>
                    <span className={styles.dealLabel}>Avg. Deal</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MetricsDashboard;
