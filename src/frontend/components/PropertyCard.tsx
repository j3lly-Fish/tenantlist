import React from 'react';
import { PropertyListing, PropertyListingStatus, PropertyType } from '../../types';
import { MetricBadge } from './MetricBadge';
import { ThreeDotsMenu } from './ThreeDotsMenu';
import styles from './PropertyCard.module.css';

interface PropertyCardProps {
  property: PropertyListing;
  onEdit?: (propertyId: string) => void;
  onDelete?: (propertyId: string) => void;
  onViewDetails?: (propertyId: string) => void;
  onUpdateStatus?: (propertyId: string) => void;
  onClick?: (propertyId: string) => void;
  onMarkAsFeatured?: (propertyId: string) => void;
  onDuplicate?: (propertyId: string) => void;
  onDownloadReport?: (propertyId: string) => void;
}

/**
 * PropertyCard Component
 *
 * Displays property listing information with:
 * - Property photo (with fallback)
 * - Title, type badge, and status badge
 * - Activity indicator badges (New, Hot, Updated)
 * - Location (city, state)
 * - Key metrics (sqft, price)
 * - Performance metrics (days on market)
 * - Three metric badges (Views, Inquiries, Matches)
 * - Three-dot menu (Edit, Update Status, Delete, Mark as Featured, Duplicate, Download Report)
 * - Action buttons (View Details)
 */
export const PropertyCard: React.FC<PropertyCardProps> = React.memo(({
  property,
  onEdit,
  onDelete,
  onViewDetails,
  onUpdateStatus,
  onClick,
  onMarkAsFeatured,
  onDuplicate,
  onDownloadReport,
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(property.id);
    }
  };

  const handleButtonClick = (
    e: React.MouseEvent,
    handler?: (propertyId: string) => void
  ) => {
    e.stopPropagation();
    if (handler) {
      handler(property.id);
    }
  };

  // Default placeholder for properties without photos
  const defaultPhotoUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3Ctext x='200' y='150' font-family='Arial, sans-serif' font-size='48' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3E🏢%3C/text%3E%3C/svg%3E`;
  const photoUrl = property.photos?.[0]?.url || defaultPhotoUrl;

  // Format property type for display
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

  // Format status for display
  const formatStatus = (status: PropertyListingStatus): { label: string; className: string } => {
    const statusConfig: Record<PropertyListingStatus, { label: string; className: string }> = {
      [PropertyListingStatus.ACTIVE]: { label: 'Active', className: styles.statusActive },
      [PropertyListingStatus.PENDING]: { label: 'Pending', className: styles.statusPending },
      [PropertyListingStatus.LEASED]: { label: 'Leased', className: styles.statusLeased },
      [PropertyListingStatus.OFF_MARKET]: { label: 'Off Market', className: styles.statusOffMarket },
    };
    return statusConfig[status] || { label: status, className: '' };
  };

  // Format price for display
  const formatPrice = (price: number | null): string => {
    if (!price) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format sqft for display
  const formatSqft = (sqft: number): string => {
    return new Intl.NumberFormat('en-US').format(sqft) + ' SF';
  };

  // Activity Badge Logic
  const isNew = (): boolean => {
    const createdDate = new Date(property.created_at);
    const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated < 7;
  };

  const isHot = (): boolean => {
    return property.inquiry_count > 10;
  };

  const isRecentlyUpdated = (): boolean => {
    const createdDate = new Date(property.created_at);
    const updatedDate = new Date(property.updated_at);
    const hoursSinceUpdate = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60);
    // Show "Updated" badge if updated within last 24 hours AND updated_at != created_at
    return hoursSinceUpdate < 24 && updatedDate.getTime() !== createdDate.getTime();
  };

  const showDaysOnMarket = (): boolean => {
    return property.status === PropertyListingStatus.ACTIVE && property.days_on_market !== null;
  };

  const statusInfo = formatStatus(property.status);

  // Menu items for the three-dot menu
  const menuItems = [
    ...(onEdit ? [{ label: 'Edit Listing', onClick: () => onEdit(property.id) }] : []),
    ...(onUpdateStatus ? [{ label: 'Update Status', onClick: () => onUpdateStatus(property.id) }] : []),
    ...(onMarkAsFeatured ? [{ label: 'Mark as Featured', onClick: () => onMarkAsFeatured(property.id) }] : []),
    ...(onDuplicate ? [{ label: 'Duplicate Listing', onClick: () => onDuplicate(property.id) }] : []),
    ...(onDownloadReport ? [{ label: 'Download Report', onClick: () => onDownloadReport(property.id) }] : []),
    ...(onDelete ? [{ label: 'Delete', onClick: () => onDelete(property.id), variant: 'danger' as const }] : []),
  ];

  return (
    <article
      className={styles.propertyCard}
      onClick={handleCardClick}
      role="article"
      aria-label={`Property: ${property.title}`}
    >
      {/* Three-dot menu in top-right corner */}
      {menuItems.length > 0 && (
        <div className={styles.menuContainer}>
          <ThreeDotsMenu
            businessId={property.id}
            businessName={property.title}
            stealthModeEnabled={false}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}

      {/* Property photo */}
      <div className={styles.photoContainer}>
        <img
          src={photoUrl}
          alt={property.title}
          className={styles.photo}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultPhotoUrl;
          }}
        />
        <span className={`${styles.statusBadge} ${statusInfo.className}`}>
          {statusInfo.label}
        </span>

        {/* Activity badges container */}
        <div className={styles.activityBadgesContainer}>
          {isNew() && (
            <span className={`${styles.activityBadge} ${styles.badgeNew}`}>
              New
            </span>
          )}
          {isHot() && (
            <span className={`${styles.activityBadge} ${styles.badgeHot}`}>
              Hot
            </span>
          )}
          {isRecentlyUpdated() && (
            <span className={`${styles.activityBadge} ${styles.badgeUpdated}`}>
              Updated
            </span>
          )}
        </div>
      </div>

      {/* Property info */}
      <div className={styles.cardContent}>
        {/* Title and type */}
        <div className={styles.cardHeader}>
          <h3 className={styles.propertyTitle}>{property.title}</h3>
          <span className={styles.typeBadge}>
            {formatPropertyType(property.property_type)}
          </span>
        </div>

        {/* Location */}
        <p className={styles.location}>
          {property.city}, {property.state}
        </p>

        {/* Key details */}
        <div className={styles.details}>
          <span className={styles.sqft}>{formatSqft(property.sqft)}</span>
          <span className={styles.divider}>•</span>
          <span className={styles.price}>{formatPrice(property.asking_price)}</span>
        </div>

        {/* Performance metrics - Days on market */}
        {showDaysOnMarket() && (
          <div className={styles.performanceMetrics}>
            <span className={styles.daysOnMarketBadge}>
              📅 {property.days_on_market} days on market
            </span>
          </div>
        )}

        {/* Metric badges row */}
        <div className={styles.metrics}>
          <MetricBadge
            label="Views"
            value={property.viewsCount || 0}
          />
          <MetricBadge
            label="Inquiries"
            value={property.inquiriesCount || 0}
          />
          <MetricBadge
            label="Matches"
            value={property.matchesCount || 0}
          />
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            className={`${styles.actionButton} ${styles.primary}`}
            onClick={(e) => handleButtonClick(e, onViewDetails)}
            aria-label={`View details for ${property.title}`}
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
});

PropertyCard.displayName = 'PropertyCard';
