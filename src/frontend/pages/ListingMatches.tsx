import React, { useState, useEffect, useRef } from 'react';
import { TopNavigation } from '@components/TopNavigation';
import { TenantSidebar } from '@components/TenantSidebar';
import { LoadingSpinner } from '@components/LoadingSpinner';
import { GoogleMapViewDirect as GoogleMapView, MapLocation } from '@components/GoogleMapViewDirect';
import styles from './ListingMatches.module.css';

interface Business {
  id: string;
  name: string;
}

interface DemandListing {
  id: string;
  location_name: string;
  city: string;
  state: string;
}

interface PropertyMatch {
  id: string;
  property_name: string;
  address: string;
  city: string;
  state: string;
  sqft: number;
  suite: string;
  match_score: number;
  availability: string;
  listing_id: string;
  latitude?: number;
  longitude?: number;
}

const ListingMatches: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [demandListings, setDemandListings] = useState<DemandListing[]>([]);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [propertyMatches, setPropertyMatches] = useState<PropertyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Filter states
  const [propertyNameFilter, setPropertyNameFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [minSqft, setMinSqft] = useState('');
  const [maxSqft, setMaxSqft] = useState('');
  const [matchScoreFilter, setMatchScoreFilter] = useState('');
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load businesses
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const response = await fetch('/api/users/businesses', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setBusinesses(data.data.businesses || []);
        }
      } catch (error) {
        console.error('Failed to load businesses:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBusinesses();
  }, []);

  // Load demand listings when business is selected
  useEffect(() => {
    if (!selectedBusiness) {
      setDemandListings([]);
      setSelectedListings([]);
      return;
    }

    const loadListings = async () => {
      try {
        const response = await fetch(`/api/businesses/${selectedBusiness}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          const listings = data.data.demand_listings || [];
          setDemandListings(listings);
          // Auto-select all listings
          setSelectedListings(listings.map((l: DemandListing) => l.id));
        }
      } catch (error) {
        console.error('Failed to load listings:', error);
      }
    };
    loadListings();
  }, [selectedBusiness]);

  // Load property matches when listings are selected
  useEffect(() => {
    if (selectedListings.length === 0) {
      setPropertyMatches([]);
      return;
    }

    const loadMatches = async () => {
      try {
        // For now, return empty array - backend endpoint needs to be created
        setPropertyMatches([]);
      } catch (error) {
        console.error('Failed to load property matches:', error);
      }
    };
    loadMatches();
  }, [selectedListings]);

  const handleListingToggle = (listingId: string) => {
    setSelectedListings(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBusinessDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedBusinessData = businesses.find(b => b.id === selectedBusiness);

  if (loading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.listingMatches}>
      <TopNavigation tier="Free Plan" />

      <div className={styles.layoutContainer}>
        <aside className={styles.sidebar}>
          <TenantSidebar />
        </aside>

        <main className={styles.content}>
          <div className={styles.matchesView}>
            {/* Header with business selector */}
            <div className={styles.header}>
              <div className={styles.businessInfo}>
                <div className={styles.businessAvatar}>
                  {selectedBusinessData ? selectedBusinessData.name.charAt(0).toUpperCase() : 'B'}
                </div>
                <div>
                  <h1>{selectedBusinessData ? selectedBusinessData.name : 'Select your business'}</h1>
                  {selectedBusinessData && demandListings.length > 0 && (
                    <p className={styles.listingLocations}>
                      {demandListings.map(l => `${l.city}, ${l.state}`).join(' • ')}
                    </p>
                  )}
                  {!selectedBusinessData && <p className={styles.subtitle}>Select Listings</p>}
                </div>
              </div>

              <div className={styles.headerActions}>
                <div className={styles.businessSelectorDropdown} ref={dropdownRef}>
                  <button
                    className={styles.selectBusinessButton}
                    onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                  >
                    Select Business
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {showBusinessDropdown && (
                    <div className={styles.businessDropdownContent}>
                      {businesses.map((business) => (
                        <div
                          key={business.id}
                          className={styles.businessDropdownItem}
                          onClick={() => {
                            setSelectedBusiness(business.id);
                            setShowBusinessDropdown(false);
                          }}
                        >
                          <div className={styles.businessDropdownAvatar}>
                            {business.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{business.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedBusinessData && demandListings.length > 1 && (
                  <div className={styles.listingNamesDropdown}>
                    <button className={styles.dropdownButton}>
                      Listing Names
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <div className={styles.dropdownContent}>
                      {demandListings.map((listing) => (
                        <label key={listing.id} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={selectedListings.includes(listing.id)}
                            onChange={() => handleListingToggle(listing.id)}
                          />
                          <span>{listing.location_name || `${listing.city}, ${listing.state}`}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

              {/* Property Bids Section */}
              <div className={styles.propertyBids}>
                <h2>Property Bids ({propertyMatches.length})</h2>

                {/* Filters */}
                <div className={styles.filters}>
                  <select className={styles.filterSelect}>
                    <option value="">Property Name - Select</option>
                  </select>
                  <select className={styles.filterSelect}>
                    <option value="">City - Select</option>
                  </select>
                  <select className={styles.filterSelect}>
                    <option value="">State - Select</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Min Sq Ft"
                    className={styles.filterInput}
                    value={minSqft}
                    onChange={(e) => setMinSqft(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max Sq Ft"
                    className={styles.filterInput}
                    value={maxSqft}
                    onChange={(e) => setMaxSqft(e.target.value)}
                  />
                  <select className={styles.filterSelect}>
                    <option value="">Match Score - Select</option>
                  </select>

                  <div className={styles.viewToggle}>
                    <button
                      className={viewMode === 'table' ? styles.active : ''}
                      onClick={() => setViewMode('table')}
                    >
                      Table
                    </button>
                    <button
                      className={viewMode === 'card' ? styles.active : ''}
                      onClick={() => setViewMode('card')}
                    >
                      Card
                    </button>
                  </div>
                </div>

                {/* Map View */}
                <div className={styles.mapContainer}>
                  <GoogleMapView
                    center={{ lat: 39.8283, lng: -98.5795 }}
                    zoom={4}
                    locations={propertyMatches.map(property => ({
                      lat: property.latitude || 39.8283,
                      lng: property.longitude || -98.5795,
                      title: property.property_name,
                      description: `${property.city}, ${property.state} - ${property.match_score}% match`
                    }))}
                    height="400px"
                    width="100%"
                  />
                </div>

                {/* Property Matches List */}
                {propertyMatches.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No property matches found</p>
                    <p className={styles.emptySubtext}>
                      Property matches will appear here when landlords or brokers send proposals to your listings
                    </p>
                  </div>
                ) : viewMode === 'table' ? (
                  <div className={styles.tableContainer}>
                    <table className={styles.matchesTable}>
                      <thead>
                        <tr>
                          <th>Property Name</th>
                          <th>Address</th>
                          <th>City</th>
                          <th>State</th>
                          <th>Sq Ft</th>
                          <th>Suite</th>
                          <th>Match</th>
                          <th>Availability</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {propertyMatches.map((property) => (
                          <tr key={property.id}>
                            <td>{property.property_name}</td>
                            <td>{property.address}</td>
                            <td>{property.city}</td>
                            <td>{property.state}</td>
                            <td>{property.sqft.toLocaleString()}</td>
                            <td>{property.suite}</td>
                            <td>
                              <span className={styles.matchScore}>{property.match_score}%</span>
                            </td>
                            <td>
                              <span className={`${styles.availabilityBadge} ${styles[property.availability.toLowerCase()]}`}>
                                {property.availability}
                              </span>
                            </td>
                            <td>
                              <button className={styles.actionButton}>⋮</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.cardGrid}>
                    {propertyMatches.map((property) => (
                      <div key={property.id} className={styles.propertyCard}>
                        <div className={styles.cardImage}>
                          <div className={styles.imagePlaceholder}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className={styles.matchBadge}>{property.match_score}%</div>
                        </div>
                        <div className={styles.cardContent}>
                          <h3>{property.property_name}</h3>
                          <p className={styles.address}>{property.address}</p>
                          <div className={styles.cardDetails}>
                            <div>
                              <span className={styles.label}>Suite</span>
                              <span className={styles.value}>{property.suite}</span>
                            </div>
                            <div>
                              <span className={styles.label}>Sq Ft</span>
                              <span className={styles.value}>{property.sqft.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className={styles.label}>Availability</span>
                              <span className={`${styles.availabilityBadge} ${styles[property.availability.toLowerCase()]}`}>
                                {property.availability}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </main>
      </div>
    </div>
  );
};

export default ListingMatches;
