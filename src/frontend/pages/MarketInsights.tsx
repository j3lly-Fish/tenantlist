import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TopNavigation } from '@components/TopNavigation';
import { getMarketInsights } from '@utils/apiClient';
import { MarketInsightsData } from '@types';
import styles from './MarketInsights.module.css';

// Chart colors
const COLORS = {
  primary: '#000000',
  retail: '#3b82f6',
  office: '#10b981',
  industrial: '#f59e0b',
  overall: '#6366f1',
  secondary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
};

/**
 * MarketInsights Page
 * Displays market analytics with charts and KPIs
 */
const MarketInsights: React.FC = () => {
  const [data, setData] = useState<MarketInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const insights = await getMarketInsights();
      setData(insights);
    } catch (err: any) {
      console.error('Failed to fetch market insights:', err);
      setError(err.message || 'Failed to load market insights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format percentage change with arrow
  const formatChange = (change: number, inverse: boolean = false) => {
    const isPositive = inverse ? change < 0 : change > 0;
    const className = isPositive
      ? styles.positive
      : change === 0
      ? styles.neutral
      : styles.negative;

    return (
      <span className={`${styles.kpiChange} ${className}`}>
        {change > 0 ? (
          <svg className={styles.changeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        ) : change < 0 ? (
          <svg className={styles.changeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : null}
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <TopNavigation />
        <main className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Loading market insights...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className={styles.pageContainer}>
        <TopNavigation />
        <main className={styles.mainContent}>
          <div className={styles.errorContainer}>
            <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h2 className={styles.errorTitle}>Unable to load market insights</h2>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryButton} onClick={fetchData}>
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Format vacancy trends for the chart
  const vacancyChartData = data.vacancyTrends.map((d) => ({
    ...d,
    date: formatDate(d.date),
  }));

  return (
    <div className={styles.pageContainer}>
      <TopNavigation />
      <main className={styles.mainContent}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Market Insights</h1>
            <span className={styles.lastUpdated}>
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            Aggregate market data and trends across commercial real estate sectors
          </p>
        </header>

        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Active Listings</div>
            <div className={styles.kpiValue}>
              {data.overview.totalActiveListings.toLocaleString()}
            </div>
            {formatChange(data.overview.totalActiveListingsChange)}
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Avg. Vacancy Rate</div>
            <div className={styles.kpiValue}>{data.overview.averageVacancyRate}%</div>
            {formatChange(data.overview.averageVacancyRateChange, true)}
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Active Demand</div>
            <div className={styles.kpiValue}>
              {data.overview.totalDemandListings.toLocaleString()}
            </div>
            {formatChange(data.overview.totalDemandListingsChange)}
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Avg. Match Rate</div>
            <div className={styles.kpiValue}>{data.overview.averageMatchRate}%</div>
            {formatChange(data.overview.averageMatchRateChange)}
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsSection}>
          {/* Vacancy Trends Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Vacancy Rate Trends</h3>
                <p className={styles.chartSubtitle}>12-month vacancy rates by asset type</p>
              </div>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vacancyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, '']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="retail"
                    name="Retail"
                    stroke={COLORS.retail}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="office"
                    name="Office"
                    stroke={COLORS.office}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="industrial"
                    name="Industrial"
                    stroke={COLORS.industrial}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="overall"
                    name="Overall"
                    stroke={COLORS.overall}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Demand by Industry Pie Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Demand by Industry</h3>
                <p className={styles.chartSubtitle}>Active tenant requirements</p>
              </div>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.demandByIndustry as any[]}
                    dataKey="count"
                    nameKey="industry"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {data.demandByIndustry.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.secondary[index % COLORS.secondary.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} listings`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          {/* Absorption by Asset Type */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Net Absorption by Asset Type</h3>
                <p className={styles.chartSubtitle}>Square footage absorbed (leased)</p>
              </div>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.absorptionByType}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    tickFormatter={(value) =>
                      value >= 1000000
                        ? `${(value / 1000000).toFixed(1)}M`
                        : value >= 1000
                        ? `${(value / 1000).toFixed(0)}K`
                        : value.toString()
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="assetType"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    width={75}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toLocaleString()} SF`,
                      'Absorption',
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="absorption" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Demand by State */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Demand by State</h3>
                <p className={styles.chartSubtitle}>Top 10 markets by tenant demand</p>
              </div>
            </div>
            <div className={styles.barList}>
              {data.demandByState.map((item, index) => (
                <div key={item.state} className={styles.barItem}>
                  <span className={styles.barLabel}>{item.state}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS.secondary[index % COLORS.secondary.length],
                      }}
                    />
                  </div>
                  <span className={styles.barValue}>{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketInsights;
