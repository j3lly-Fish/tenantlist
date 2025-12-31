import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { LoadingSpinner } from '@components/LoadingSpinner';
import { PropertyListingModal } from '@components/PropertyListingModal';
import { PropertyGallery, GalleryItem } from '@components/PropertyGallery';
import { ContactAgentSidebar, AgentInfo } from '@components/ContactAgentSidebar';
import { DocumentationSection, Document, DEFAULT_DOCUMENTS } from '@components/DocumentationSection';
import { QFPModal } from '@components/QFPModal';
import { useAuth } from '@contexts/AuthContext';
import {
  getPropertyListing,
  updatePropertyListingStatus,
  deletePropertyListing,
  getBusinesses,
} from '@utils/apiClient';
import { PropertyListing, PropertyListingStatus, PropertyType, Business } from '@types';
import styles from './PropertyDetail.module.css';

/**
 * PropertyDetail Page
 *
 * Shows a specific property listing with all details:
 * - Property gallery with hero image and thumbnails
 * - Status badge and key metrics
 * - Full property details (location, features, pricing)
 * - Contact agent sidebar with action buttons
 * - Documentation section with PDF links
 * - Amenities displayed as checkmark list in two columns
 * - QFP Modal for sending proposals
 */
const PropertyDetail: React.FC = () => {
  const { id: propertyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQFPModal, setShowQFPModal] = useState(false);

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

  // Load user's businesses for QFP modal
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const response = await getBusinesses();
        setBusinesses(response.businesses || []);
      } catch (err) {
        console.error('Failed to load businesses:', err);
      }
    };

    if (user) {
      loadBusinesses();
    }
  }, [user]);

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
      navigate('/landlord-dashboard');
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

  // Handle Send Message
  const handleSendMessage = () => {
    // Navigate to messages or open a message compose modal
    navigate('/messages');
  };

  // Handle Send QFP
  const handleSendQFP = () => {
    setShowQFPModal(true);
  };

  // Handle Decline
  const handleDecline = () => {
    // In a real app, this would send a decline notification
    if (window.confirm('Are you sure you want to decline this property?')) {
      navigate('/landlord-dashboard');
    }
  };

  // Handle QFP Submit
  const handleQFPSubmit = (data: any) => {
    console.log('QFP submitted:', data);
    // In a real app, this would send the QFP to the server
    alert('QFP sent successfully!');
    setShowQFPModal(false);
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
              onClick={() => navigate('/landlord-dashboard')}
            >
              Back to Properties
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Transform property photos to gallery items
  const galleryItems: GalleryItem[] = property.photos?.map((photo) => ({
    url: photo.url,
    caption: photo.caption,
    isVideo: photo.url.includes('.mp4') || photo.url.includes('.webm'),
  })) || [];

  // Get documents from property or use defaults for demo
  const documents: Document[] = property.documents?.map((doc) => ({
    name: doc.name,
    url: doc.url,
  })) || DEFAULT_DOCUMENTS;

  // Get agent info from property contact details
  const agentInfo: AgentInfo = {
    name: property.contact_name || 'Property Agent',
    company: 'Commercial Real Estate', // Could come from user profile
    email: property.contact_email || undefined,
    phone: property.contact_phone || undefined,
  };

  // Broker info for QFP modal
  const brokerInfo = {
    name: property.contact_name || 'Property Agent',
    company: 'Commercial Real Estate',
    email: property.contact_email || 'contact@example.com',
    phone: property.contact_phone || '(555) 555-5555',
  };

  const statusInfo = formatStatus(property.status);

  return (
    <div className={styles.propertyDetail}>
      <TopNavigation />

      <main className={styles.content}>
        <div className={styles.container}>
          {/* Back link */}
          <button
            className={styles.backLink}
            onClick={() => navigate('/landlord-dashboard')}
          >
            Back to All Properties
          </button>

          {/* Main content layout - Gallery + Sidebar */}
          <div className={styles.mainLayout}>
            {/* Left column - Gallery and Property Info */}
            <div className={styles.mainColumn}>
              {/* Property Gallery */}
              <PropertyGallery items={galleryItems} propertyTitle={property.title} />

              {/* Status badge */}
              <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                {statusInfo.label}
              </span>

              {/* Property Info Section */}
              <div className={styles.propertyInfoSection}>
                <div className={styles.titleRow}>
                  <h1 className={styles.propertyTitle}>{property.title}</h1>
                  <span className={styles.typeBadge}>
                    {formatPropertyType(property.property_type)}
                  </span>
                </div>

                <p className={styles.location}>
                  {property.address}, {property.city}, {property.state} {property.zip_code}
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

                {/* Action buttons for property owner */}
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

            {/* Right column - Contact Agent Sidebar */}
            <div className={styles.sidebarColumn}>
              <ContactAgentSidebar
                agent={agentInfo}
                onSendMessage={handleSendMessage}
                onSendQFP={handleSendQFP}
                onDecline={handleDecline}
              />
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

            {/* Documentation Section */}
            <DocumentationSection documents={documents} />

            {/* Amenities - Checkmark list with two-column layout */}
            {property.amenities && property.amenities.length > 0 && (
              <div className={styles.detailCard} data-testid="amenities-section">
                <h2 className={styles.cardTitle}>Amenities</h2>
                <div className={styles.amenitiesCheckmarkList}>
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className={styles.amenityCheckmarkItem}>
                      <span className={styles.checkmarkIcon} aria-hidden="true">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
                            fill="#22C55E"
                          />
                        </svg>
                      </span>
                      <span className={styles.amenityText}>{amenity}</span>
                    </div>
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

      {/* QFP Modal */}
      <QFPModal
        isOpen={showQFPModal}
        onClose={() => setShowQFPModal(false)}
        onSubmit={handleQFPSubmit}
        property={property}
        businesses={businesses}
        brokerInfo={brokerInfo}
      />
    </div>
  );
};

export default PropertyDetail;
