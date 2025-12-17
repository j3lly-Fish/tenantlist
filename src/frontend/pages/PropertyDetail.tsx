import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { LoadingSpinner } from '@components/LoadingSpinner';
import { PropertyListingModal } from '@components/PropertyListingModal';
import { useAuth } from '@contexts/AuthContext';
import {
  getPropertyListing,
  updatePropertyListing,
  updatePropertyListingStatus,
  deletePropertyListing,
} from '@utils/apiClient';
import { PropertyListing, PropertyListingStatus, PropertyType } from '@types';
import styles from './PropertyDetail.module.css';

/**
 * PropertyDetail Page
 *
 * Shows a specific property listing with all details:
 * - Property header with photo and basic info
 * - Status badge and key metrics
 * - Full property details (location, features, pricing)
 * - Contact information
 * - Action buttons (edit, update status, delete)
 */
const PropertyDetail: React.FC = () => {
  const { id: propertyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load property data
  useEffect(() => {
    const loadProperty = async () => {
      if (!propertyId) return;

      try {
        setLoading(true);
        setError(null);

        const data = await getPropertyListing(propertyId);
        setProperty(data.listing);
      } catch (err: any) {
        console.error('Failed to load property:', err);
        setError(err.message || 'Failed to load property');
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [propertyId]);

  // Format helpers
  const formatPrice = (price: number | null): string => {
    if (!price) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatSqft = (sqft: number): string => {
    return new Intl.NumberFormat('en-US').format(sqft) + ' SF';
  };

  const formatPropertyType = (type: PropertyType): string => {
    const typeLabels: Record<PropertyType, string> = {
      [PropertyType.RETAIL]: 'Retail',
      [PropertyType.RESTAURANT]: 'Restaurant',
      [PropertyType.OFFICE]: 'Office',
      [PropertyType.INDUSTRIAL]: 'Industrial',
      [PropertyType.WAREHOUSE]: 'Warehouse',
      [PropertyType.MEDICAL]: 'Medical',
      [PropertyType.FLEX]: 'Flex',
      [PropertyType.LAND]: 'Land',
      [PropertyType.OTHER]: 'Other',
    };
    return typeLabels[type] || type;
  };

  const formatStatus = (status: PropertyListingStatus): { label: string; className: string } => {
    const statusConfig: Record<PropertyListingStatus, { label: string; className: string }> = {
      [PropertyListingStatus.ACTIVE]: { label: 'Active', className: styles.statusActive },
      [PropertyListingStatus.PENDING]: { label: 'Pending', className: styles.statusPending },
      [PropertyListingStatus.LEASED]: { label: 'Leased', className: styles.statusLeased },
      [PropertyListingStatus.OFF_MARKET]: { label: 'Off Market', className: styles.statusOffMarket },
    };
    return statusConfig[status] || { label: status, className: '' };
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!property || !propertyId) return;

    const statusOptions: PropertyListingStatus[] = [
      PropertyListingStatus.ACTIVE,
      PropertyListingStatus.PENDING,
      PropertyListingStatus.LEASED,
      PropertyListingStatus.OFF_MARKET,
    ];

    const statusLabels: Record<PropertyListingStatus, string> = {
      [PropertyListingStatus.ACTIVE]: 'Active',
      [PropertyListingStatus.PENDING]: 'Pending',
      [PropertyListingStatus.LEASED]: 'Leased',
      [PropertyListingStatus.OFF_MARKET]: 'Off Market',
    };

    const currentIndex = statusOptions.indexOf(property.status);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    const newStatus = statusOptions[nextIndex];

    if (!window.confirm(`Change status from "${statusLabels[property.status]}" to "${statusLabels[newStatus]}"?`)) {
      return;
    }

    try {
      const result = await updatePropertyListingStatus(propertyId, newStatus);
      setProperty(result.listing);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert(err.message || 'Failed to update status');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!propertyId) return;

    if (!window.confirm('Are you sure you want to delete this property listing? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePropertyListing(propertyId);
      navigate('/properties');
    } catch (err: any) {
      console.error('Failed to delete property:', err);
      alert(err.message || 'Failed to delete property');
    }
  };

  // Handle edit save - called after modal saves the listing
  const handleEditSave = async () => {
    if (!propertyId) return;

    try {
      // Refresh the property data
      const result = await getPropertyListing(propertyId);
      setProperty(result.listing);
      setShowEditModal(false);
    } catch (err: any) {
      console.error('Failed to refresh property:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.propertyDetail}>
        <TopNavigation />
        <main className={styles.content}>
          <LoadingSpinner size="large" centered />
        </main>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className={styles.propertyDetail}>
        <TopNavigation />
        <main className={styles.content}>
          <div className={styles.errorState}>
            <h2>Error Loading Property</h2>
            <p>{error || 'Property not found'}</p>
            <button
              className={styles.backButton}
              onClick={() => navigate('/properties')}
            >
              Back to Properties
            </button>
          </div>
        </main>
      </div>
    );
  }

  const defaultPhotoUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23e5e7eb'/%3E%3Ctext x='400' y='200' font-family='Arial, sans-serif' font-size='64' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3E🏢%3C/text%3E%3C/svg%3E`;
  const photoUrl = property.photos?.[0]?.url || defaultPhotoUrl;
  const statusInfo = formatStatus(property.status);

  return (
    <div className={styles.propertyDetail}>
      <TopNavigation />

      <main className={styles.content}>
        <div className={styles.container}>
          {/* Back link */}
          <button
            className={styles.backLink}
            onClick={() => navigate('/properties')}
          >
            ← Back to All Properties
          </button>

          {/* Property header */}
          <div className={styles.propertyHeader}>
            {/* Photo section */}
            <div className={styles.photoSection}>
              <img
                src={photoUrl}
                alt={property.title}
                className={styles.mainPhoto}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultPhotoUrl;
                }}
              />
              <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            </div>

            {/* Info section */}
            <div className={styles.infoSection}>
              <div className={styles.titleRow}>
                <h1 className={styles.propertyTitle}>{property.title}</h1>
                <span className={styles.typeBadge}>
                  {formatPropertyType(property.property_type)}
                </span>
              </div>

              <p className={styles.location}>
                📍 {property.address}, {property.city}, {property.state} {property.zip_code}
              </p>

              <div className={styles.keyMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{formatSqft(property.sqft)}</span>
                  <span className={styles.metricLabel}>Size</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricValue}>{formatPrice(property.asking_price)}</span>
                  <span className={styles.metricLabel}>Asking Price</span>
                </div>
                {property.price_per_sqft && (
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>${property.price_per_sqft}/SF</span>
                    <span className={styles.metricLabel}>Price per SF</span>
                  </div>
                )}
              </div>

              {/* Performance metrics */}
              <div className={styles.performanceMetrics}>
                <div className={styles.performanceMetric}>
                  <span className={styles.performanceValue}>{property.viewsCount || 0}</span>
                  <span className={styles.performanceLabel}>Views</span>
                </div>
                <div className={styles.performanceMetric}>
                  <span className={styles.performanceValue}>{property.inquiriesCount || 0}</span>
                  <span className={styles.performanceLabel}>Inquiries</span>
                </div>
                <div className={styles.performanceMetric}>
                  <span className={styles.performanceValue}>{property.matchesCount || 0}</span>
                  <span className={styles.performanceLabel}>Matches</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className={styles.actions}>
                <button
                  className={`${styles.actionButton} ${styles.primary}`}
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Listing
                </button>
                <button
                  className={`${styles.actionButton} ${styles.secondary}`}
                  onClick={handleUpdateStatus}
                >
                  Update Status
                </button>
                <button
                  className={`${styles.actionButton} ${styles.danger}`}
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Details sections */}
          <div className={styles.detailsGrid}>
            {/* Description */}
            {property.description && (
              <div className={styles.detailCard}>
                <h2 className={styles.cardTitle}>Description</h2>
                <p className={styles.description}>{property.description}</p>
              </div>
            )}

            {/* Property Details */}
            <div className={styles.detailCard}>
              <h2 className={styles.cardTitle}>Property Details</h2>
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Property Type</span>
                  <span className={styles.detailValue}>{formatPropertyType(property.property_type)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Total Size</span>
                  <span className={styles.detailValue}>{formatSqft(property.sqft)}</span>
                </div>
                {property.lot_size && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Lot Size</span>
                    <span className={styles.detailValue}>{property.lot_size.toLocaleString()} SF</span>
                  </div>
                )}
                {property.year_built && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Year Built</span>
                    <span className={styles.detailValue}>{property.year_built}</span>
                  </div>
                )}
                {property.floors && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Floors</span>
                    <span className={styles.detailValue}>{property.floors}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lease Terms */}
            <div className={styles.detailCard}>
              <h2 className={styles.cardTitle}>Lease Terms</h2>
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Asking Price</span>
                  <span className={styles.detailValue}>{formatPrice(property.asking_price)}</span>
                </div>
                {property.price_per_sqft && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Price per SF</span>
                    <span className={styles.detailValue}>${property.price_per_sqft}/SF</span>
                  </div>
                )}
                {property.lease_type && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Lease Type</span>
                    <span className={styles.detailValue}>{property.lease_type}</span>
                  </div>
                )}
                {property.cam_charges && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>CAM Charges</span>
                    <span className={styles.detailValue}>${property.cam_charges}/SF</span>
                  </div>
                )}
                {property.available_date && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Available Date</span>
                    <span className={styles.detailValue}>{new Date(property.available_date).toLocaleDateString()}</span>
                  </div>
                )}
                {property.min_lease_term && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Min Lease Term</span>
                    <span className={styles.detailValue}>{property.min_lease_term}</span>
                  </div>
                )}
                {property.max_lease_term && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Max Lease Term</span>
                    <span className={styles.detailValue}>{property.max_lease_term}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className={styles.detailCard}>
                <h2 className={styles.cardTitle}>Amenities</h2>
                <div className={styles.tagsList}>
                  {property.amenities.map((amenity, index) => (
                    <span key={index} className={styles.tag}>{amenity}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            {property.highlights && property.highlights.length > 0 && (
              <div className={styles.detailCard}>
                <h2 className={styles.cardTitle}>Highlights</h2>
                <div className={styles.tagsList}>
                  {property.highlights.map((highlight, index) => (
                    <span key={index} className={styles.highlightTag}>{highlight}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            {(property.contact_name || property.contact_email || property.contact_phone) && (
              <div className={styles.detailCard}>
                <h2 className={styles.cardTitle}>Contact Information</h2>
                <div className={styles.detailsList}>
                  {property.contact_name && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Contact Name</span>
                      <span className={styles.detailValue}>{property.contact_name}</span>
                    </div>
                  )}
                  {property.contact_email && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Email</span>
                      <span className={styles.detailValue}>
                        <a href={`mailto:${property.contact_email}`}>{property.contact_email}</a>
                      </span>
                    </div>
                  )}
                  {property.contact_phone && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Phone</span>
                      <span className={styles.detailValue}>
                        <a href={`tel:${property.contact_phone}`}>{property.contact_phone}</a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <PropertyListingModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onListingCreated={handleEditSave}
        editListing={property}
      />
    </div>
  );
};

export default PropertyDetail;
