import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { LoadingSpinner } from '@components/LoadingSpinner';
import { DemandListingModal } from '@components/DemandListingModal';
import { useAuth } from '@contexts/AuthContext';
import { getMatchesForDemandListing } from '@utils/apiClient';
import { Business, DemandListing, BusinessMetrics } from '@types';
import styles from './BusinessDetail.module.css';

interface MetricsData {
  totalViews: number;
  totalClicks: number;
  totalInvites: number;
  totalMessages: number;
  totalDeclined: number;
  totalQfps: number;
  metricsHistory: BusinessMetrics[];
}

/**
 * BusinessDetail Page
 *
 * Shows a specific business with its demand listings (locations of interest)
 * - Business info header
 * - "Add Locations" button to create new demand listings
 * - List of all demand listings for this business
 * - Empty state when no locations exist
 */
const BusinessDetail: React.FC = () => {
  const { id: businessId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [demandListings, setDemandListings] = useState<DemandListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDemandListingModal, setShowDemandListingModal] = useState(false);
  const [editingListing, setEditingListing] = useState<DemandListing | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  // View mode and menu state
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Metrics modal state
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Match scores per listing (listingId -> best match percentage)
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});

  // Get unique cities and states for filter dropdowns
  const uniqueCities = [...new Set(demandListings.map(l => l.city))].sort();
  const uniqueStates = [...new Set(demandListings.map(l => l.state))].sort();

  // Filter locations based on current filters
  const filteredListings = demandListings.filter(listing => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      listing.city.toLowerCase().includes(searchLower) ||
      listing.state.toLowerCase().includes(searchLower) ||
      (listing.title && listing.title.toLowerCase().includes(searchLower)) ||
      (listing.location_name && listing.location_name.toLowerCase().includes(searchLower)) ||
      (listing.address && listing.address.toLowerCase().includes(searchLower)) ||
      (listing.asset_type && listing.asset_type.toLowerCase().includes(searchLower));

    const matchesStatus = !statusFilter || listing.status === statusFilter;
    const matchesCity = !cityFilter || listing.city === cityFilter;
    const matchesState = !stateFilter || listing.state === stateFilter;

    return matchesSearch && matchesStatus && matchesCity && matchesState;
  });

  // Load business and demand listings
  useEffect(() => {
    const loadBusinessData = async () => {
      if (!businessId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch business details and demand listings
        const response = await fetch(`/api/businesses/${businessId}`, {
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to load business');
        }

        setBusiness(data.data.business);
        setDemandListings(data.data.demandListings || []);
      } catch (err: any) {
        console.error('Failed to load business:', err);
        setError(err.message || 'Failed to load business');
      } finally {
        setLoading(false);
      }
    };

    loadBusinessData();
  }, [businessId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  // Fetch match scores for each demand listing
  useEffect(() => {
    const fetchMatchScores = async () => {
      if (demandListings.length === 0) return;

      const scores: Record<string, number> = {};

      await Promise.all(
        demandListings.map(async (listing) => {
          try {
            const { matches } = await getMatchesForDemandListing(listing.id, { limit: 1 });
            if (matches.length > 0) {
              // Use the best match score (first one is highest)
              scores[listing.id] = Math.round(matches[0].match_score);
            }
          } catch (err) {
            console.error(`Failed to fetch matches for listing ${listing.id}:`, err);
          }
        })
      );

      setMatchScores(scores);
    };

    fetchMatchScores();
  }, [demandListings]);

  // Load business metrics
  const loadMetrics = async () => {
    if (!businessId) return;

    try {
      setMetricsLoading(true);
      const response = await fetch(`/api/businesses/${businessId}/metrics`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMetricsData(data.data);
        setShowMetricsModal(true);
      } else {
        alert(data.error?.message || 'Failed to load metrics');
      }
    } catch (err: any) {
      console.error('Failed to load metrics:', err);
      alert('Failed to load metrics');
    } finally {
      setMetricsLoading(false);
    }
  };

  // Menu action handlers
  const handleViewInvitations = (listingId: string) => {
    setOpenMenuId(null);
    // For now, show a message - property invitations feature coming later
    alert('Property Invitations - This feature will show broker invitations for this location. Coming soon!');
  };

  const handleEditListing = (listingId: string) => {
    setOpenMenuId(null);
    const listing = demandListings.find(l => l.id === listingId);
    if (listing) {
      setEditingListing(listing);
      setShowDemandListingModal(true);
    }
  };

  const handleToggleStealthMode = async (listingId: string) => {
    setOpenMenuId(null);
    const listing = demandListings.find(l => l.id === listingId);
    if (!listing) return;

    // Toggle the current stealth mode state
    const currentStealthMode = (listing as any).stealth_mode || false;
    const newStealthMode = !currentStealthMode;

    try {
      const response = await fetch(`/api/demand-listings/${listingId}/stealth`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: newStealthMode }),
      });

      if (response.ok) {
        // Update the local state
        setDemandListings(prev =>
          prev.map(l =>
            l.id === listingId ? { ...l, stealth_mode: newStealthMode } as DemandListing : l
          )
        );
        alert(`Stealth mode ${newStealthMode ? 'enabled' : 'disabled'} for this location.`);
      } else {
        const data = await response.json();
        alert(data.error?.message || 'Failed to toggle stealth mode');
      }
    } catch (err) {
      console.error('Failed to toggle stealth mode:', err);
      alert('Failed to toggle stealth mode');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    setOpenMenuId(null);
    if (!window.confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/demand-listings/${listingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setDemandListings(prev => prev.filter(l => l.id !== listingId));
      } else {
        alert('Failed to delete location');
      }
    } catch (err) {
      console.error('Failed to delete listing:', err);
      alert('Failed to delete location');
    }
  };

  /**
   * Handle demand listing created or updated
   * Reloads the demand listings
   */
  const handleListingCreated = useCallback(async () => {
    setShowDemandListingModal(false);
    setEditingListing(null);

    // Reload demand listings
    if (!businessId) return;

    try {
      const response = await fetch(`/api/businesses/${businessId}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setDemandListings(data.data.demandListings || []);
      }
    } catch (err) {
      console.error('Failed to reload listings:', err);
    }
  }, [businessId]);

  if (loading) {
    return (
      <div className={styles.businessDetail}>
        <TopNavigation />
        <main className={styles.content}>
          <LoadingSpinner size="large" centered />
        </main>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className={styles.businessDetail}>
        <TopNavigation />
        <main className={styles.content}>
          <div className={styles.errorState}>
            <h2>Error Loading Business</h2>
            <p>{error || 'Business not found'}</p>
            <button
              className={styles.backButton}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Default placeholder SVG for businesses without logos
  const defaultLogoSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-size='40' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3E${business.name.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  const logoUrl = business.logo_url || defaultLogoSvg;

  return (
    <div className={styles.businessDetail}>
      <TopNavigation />

      <main className={styles.content}>
        <div className={styles.container}>
          {/* Back button */}
          <button
            className={styles.backLink}
            onClick={() => navigate('/dashboard')}
          >
            ← Back to All Listings
          </button>

          {/* Business header */}
          <div className={styles.businessHeader}>
            <div className={styles.businessInfo}>
              <img
                src={logoUrl}
                alt={business.name}
                className={styles.businessLogo}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultLogoSvg;
                }}
              />
              <div>
                <h1 className={styles.businessName}>{business.name}</h1>
                <p className={styles.businessSubtitle}>
                  Manage your space requirements and track proposals
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className={styles.headerActions}>
              <button
                className={styles.headerActionButton}
                onClick={() => {
                  alert('Invite Brokers feature coming soon');
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Invite Brokers</span>
              </button>

              <button
                className={styles.headerActionButton}
                onClick={loadMetrics}
                disabled={metricsLoading}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
                <span>{metricsLoading ? 'Loading...' : 'Review Metrics'}</span>
              </button>

              <button
                className={styles.headerActionButton}
                onClick={() => setShowDemandListingModal(true)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Add Location</span>
              </button>
            </div>
          </div>

          {/* Locations section */}
          <div className={styles.locationsSection}>
            <div className={styles.locationsSectionHeader}>
              <h2 className={styles.sectionTitle}>
                Locations of Interest ({filteredListings.length})
              </h2>
            </div>

            {/* Filters */}
            <div className={styles.filtersBar}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Search</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Name, address, sqft, etc."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Status</label>
                <select
                  className={styles.filterSelect}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>City</label>
                <select
                  className={styles.filterSelect}
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  <option value="">Select</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>State</label>
                <select
                  className={styles.filterSelect}
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                >
                  <option value="">Select</option>
                  {uniqueStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewButton} ${viewMode === 'table' ? styles.viewButtonActive : ''}`}
                  onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                >
                  {viewMode === 'table' ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                      </svg>
                      Card
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="4" />
                        <rect x="3" y="10" width="18" height="4" />
                        <rect x="3" y="17" width="18" height="4" />
                      </svg>
                      Table
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Table View - with map above */}
            {viewMode === 'table' && (
              <div className={styles.tableViewContainer}>
                {/* Full-width map */}
                <div className={styles.tableMapContainer}>
                  <div className={styles.mapPlaceholder}>
                    <span className={styles.mapPlaceholderText}>United States</span>
                    <p className={styles.mapPlaceholderSubtext}>Google Maps integration coming soon</p>
                  </div>
                </div>

                {/* Table below map */}
                <div className={styles.tableContainer}>
                  {filteredListings.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyText}>No locations found.</p>
                    </div>
                  ) : (
                    <table className={styles.locationsTable}>
                    <thead>
                      <tr>
                        <th>Listing Name</th>
                        <th>Address</th>
                        <th>City</th>
                        <th>State</th>
                        <th>Sq ft</th>
                        <th>Monthly Budget</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredListings.map((listing) => (
                        <tr key={listing.id}>
                          <td>{listing.title || `${listing.city} Area`}</td>
                          <td>{listing.address || '-'}</td>
                          <td>{listing.city}</td>
                          <td>{listing.state}</td>
                          <td>{listing.sqft_min?.toLocaleString()} - {listing.sqft_max?.toLocaleString()}</td>
                          <td>
                            {listing.budget_min && listing.budget_max
                              ? `$${listing.budget_min.toLocaleString()} - $${listing.budget_max.toLocaleString()}`
                              : '-'}
                          </td>
                          <td>
                            <div className={styles.tableActions}>
                              <div className={styles.menuContainer}>
                                <button
                                  className={styles.tableMenuButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === listing.id ? null : listing.id);
                                  }}
                                  aria-label="More options"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="5" cy="12" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="19" cy="12" r="2" />
                                  </svg>
                                </button>
                                {openMenuId === listing.id && (
                                  <div className={styles.dropdownMenu}>
                                    <button
                                      className={styles.menuItem}
                                      onClick={() => handleViewInvitations(listing.id)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                      </svg>
                                      View Property Invitations
                                    </button>
                                    <button
                                      className={styles.menuItem}
                                      onClick={() => handleEditListing(listing.id)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                      Edit Location
                                    </button>
                                    <button
                                      className={styles.menuItem}
                                      onClick={() => handleToggleStealthMode(listing.id)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                      </svg>
                                      Stealth Mode
                                    </button>
                                    <div className={styles.menuDivider} />
                                    <button
                                      className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                      onClick={() => handleDeleteListing(listing.id)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                      Delete Location
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Card View - with map on left, cards on right */}
            {viewMode === 'card' && (
              <div className={styles.locationsContent}>
                {/* Map on left */}
                <div className={styles.mapContainer}>
                  <div className={styles.mapPlaceholder}>
                    <span className={styles.mapPlaceholderText}>United States</span>
                    <p className={styles.mapPlaceholderSubtext}>Google Maps integration coming soon</p>
                  </div>
                </div>

                {/* Cards on right */}
                <div className={styles.locationsListContainer}>
                  {filteredListings.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9ca3af"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <p className={styles.emptyText}>
                        This business doesn't have any locations yet. Add a location to make it visible to landlords.
                      </p>
                    </div>
                  ) : (
                    <div className={styles.locationsList}>
                      {filteredListings.map((listing) => (
                        <div key={listing.id} className={styles.locationCard}>
                          {/* Card Header */}
                          <div className={styles.cardHeader}>
                            <div className={styles.cardTitleRow}>
                              <h3 className={styles.cardTitle}>
                                {listing.title || `${listing.city} Area`}
                              </h3>
                              {matchScores[listing.id] !== undefined && (
                                <span className={styles.matchBadge}>
                                  {matchScores[listing.id]}% match
                                </span>
                              )}
                            </div>
                            <div className={styles.cardActions}>
                              <button className={styles.iconButton} aria-label="Notifications">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                              </button>
                              <div className={styles.menuContainer}>
                                <button
                                  className={styles.iconButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === listing.id ? null : listing.id);
                                  }}
                                  aria-label="More options"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="5" r="1.5" />
                                    <circle cx="12" cy="12" r="1.5" />
                                    <circle cx="12" cy="19" r="1.5" />
                                  </svg>
                                </button>
                                {openMenuId === listing.id && (
                                  <div className={styles.dropdownMenu}>
                                    <button
                                      className={styles.menuItem}
                                      onClick={() => handleViewInvitations(listing.id)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                      </svg>
                                      View Property Invitations
                                    </button>
                                    <button
                                      className={styles.menuItem}
                                      onClick={() => handleEditListing(listing.id)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                      Edit Location Listing
                                    </button>
                                    <button
                                      className={styles.menuItem}
                                      onClick={() => handleToggleStealthMode(listing.id)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                      </svg>
                                      Stealth Mode
                                    </button>
                                    <div className={styles.menuDivider} />
                                    <button
                                      className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                      onClick={() => handleDeleteListing(listing.id)}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                      Delete Location
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card Meta Row */}
                          <div className={styles.cardMetaRow}>
                            <span className={styles.metaItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                              </svg>
                              {listing.asset_type || 'Retail'}
                            </span>
                            <span className={styles.metaItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16v16H4z"/>
                                <path d="M4 12h16M12 4v16"/>
                              </svg>
                              {listing.sqft_min?.toLocaleString()} - {listing.sqft_max?.toLocaleString()} sqft
                            </span>
                          </div>

                          {/* Cities Tags */}
                          <div className={styles.citiesList}>
                            <span className={styles.cityTag}>{listing.city}, {listing.state}</span>
                          </div>

                          {/* Invite Broker Row */}
                          <div className={styles.inviteBrokerRow}>
                            <span className={styles.brokerIcon}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                              </svg>
                            </span>
                            <span className={styles.inviteBrokerText}>Invite Broker</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Demand Listing Modal */}
      {businessId && (
        <DemandListingModal
          isOpen={showDemandListingModal}
          onClose={() => {
            setShowDemandListingModal(false);
            setEditingListing(null);
          }}
          businessId={businessId}
          businessName={business.name}
          onListingCreated={handleListingCreated}
          editListing={editingListing ? {
            id: editingListing.id,
            title: editingListing.title,
            description: editingListing.description,
            city: editingListing.city,
            state: editingListing.state,
            sqft_min: editingListing.sqft_min,
            sqft_max: editingListing.sqft_max,
            budget_min: editingListing.budget_min,
            budget_max: editingListing.budget_max,
            duration_type: editingListing.duration_type,
            start_date: editingListing.start_date,
            asset_type: editingListing.asset_type,
            lot_size: editingListing.lot_size,
            is_corporate_location: editingListing.is_corporate_location,
            additional_features: editingListing.additional_features,
          } : null}
        />
      )}

      {/* Metrics Modal */}
      {showMetricsModal && metricsData && (
        <div className={styles.modalOverlay} onClick={() => setShowMetricsModal(false)}>
          <div className={styles.metricsModal} onClick={e => e.stopPropagation()}>
            <div className={styles.metricsModalHeader}>
              <h2>Business Performance Metrics</h2>
              <button
                className={styles.modalCloseButton}
                onClick={() => setShowMetricsModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.metricsContent}>
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>{metricsData.totalViews}</div>
                  <div className={styles.metricLabel}>Total Views</div>
                  <div className={styles.metricDescription}>Landlord profile views</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>{metricsData.totalClicks}</div>
                  <div className={styles.metricLabel}>Total Clicks</div>
                  <div className={styles.metricDescription}>Listing interactions</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>{metricsData.totalInvites}</div>
                  <div className={styles.metricLabel}>Property Invites</div>
                  <div className={styles.metricDescription}>Invitations received</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>{metricsData.totalMessages}</div>
                  <div className={styles.metricLabel}>Messages</div>
                  <div className={styles.metricDescription}>Conversations started</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>{metricsData.totalDeclined}</div>
                  <div className={styles.metricLabel}>Declined</div>
                  <div className={styles.metricDescription}>Properties passed</div>
                </div>
                <div className={styles.metricCard}>
                  <div className={styles.metricValue}>{metricsData.totalQfps}</div>
                  <div className={styles.metricLabel}>QFPs Submitted</div>
                  <div className={styles.metricDescription}>Qualified facility profiles</div>
                </div>
              </div>

              {metricsData.metricsHistory.length === 0 && (
                <div className={styles.metricsEmptyState}>
                  <p>No metrics data available yet.</p>
                  <p className={styles.metricsEmptyHint}>
                    Metrics will appear here once landlords start viewing your listings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessDetail;
