import React from 'react';
import { GoogleMapView, MapLocation } from '@components/GoogleMapView';
import styles from './TenantLocationsSection.module.css';

interface TenantLocation {
  id: string;
  location_name: string;
  city?: string | null;
  state?: string | null;
  asset_type?: string | null;
  sqft_min?: number | null;
  sqft_max?: number | null;
  preferred_lease_term?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface TenantLocationsSectionProps {
  locations: TenantLocation[];
}

/**
 * TenantLocationsSection Component
 *
 * Displays locations with map and details
 */
export const TenantLocationsSection: React.FC<TenantLocationsSectionProps> = ({
  locations,
}) => {
  if (!locations || locations.length === 0) {
    return null;
  }

  const formatSqft = (min?: number | null, max?: number | null): string => {
    if (min && max) {
      return `${min.toLocaleString()} - ${max.toLocaleString()} sqft`;
    } else if (min) {
      return `${min.toLocaleString()}+ sqft`;
    } else if (max) {
      return `Up to ${max.toLocaleString()} sqft`;
    }
    return 'N/A';
  };

  return (
    <section className={styles.locationsSection}>
      <h2 className={styles.sectionTitle}>Locations</h2>

      {/* Map with tenant locations */}
      <div className={styles.mapContainer}>
        <GoogleMapView
          center={{ lat: 39.8283, lng: -98.5795 }}
          zoom={4}
          locations={locations
            .filter(location => location.latitude && location.longitude)
            .map(location => ({
              lat: location.latitude!,
              lng: location.longitude!,
              title: location.location_name,
              description: location.city && location.state
                ? `${location.city}, ${location.state}`
                : location.city || location.state || 'Location'
            }))}
          height="400px"
          width="100%"
        />
      </div>

      {/* Locations List */}
      <div className={styles.locationsList}>
        {locations.map((location) => (
          <div key={location.id} className={styles.locationCard}>
            <div className={styles.locationHeader}>
              <div className={styles.locationIcon}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 0C6.134 0 3 3.134 3 7C3 12.25 10 20 10 20C10 20 17 12.25 17 7C17 3.134 13.866 0 10 0ZM10 9.5C8.619 9.5 7.5 8.381 7.5 7C7.5 5.619 8.619 4.5 10 4.5C11.381 4.5 12.5 5.619 12.5 7C12.5 8.381 11.381 9.5 10 9.5Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className={styles.locationTitle}>
                <h3 className={styles.locationName}>{location.location_name}</h3>
                {(location.city || location.state) && (
                  <p className={styles.locationAddress}>
                    {location.city && location.state
                      ? `${location.city}, ${location.state}`
                      : location.city || location.state}
                  </p>
                )}
              </div>
            </div>

            <div className={styles.locationDetails}>
              {location.asset_type && (
                <div className={styles.detailItem}>
                  <label>Asset Type:</label>
                  <span>{location.asset_type}</span>
                </div>
              )}

              <div className={styles.detailItem}>
                <label>Square Feet:</label>
                <span>{formatSqft(location.sqft_min, location.sqft_max)}</span>
              </div>

              {location.preferred_lease_term && (
                <div className={styles.detailItem}>
                  <label>Preferred Lease Term:</label>
                  <span>{location.preferred_lease_term}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
