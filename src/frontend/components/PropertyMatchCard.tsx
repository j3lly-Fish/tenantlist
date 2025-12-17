import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PropertyMatchWithProperty, PropertyType } from '@types';
import styles from './PropertyMatchCard.module.css';

interface PropertyMatchCardProps {
  match: PropertyMatchWithProperty;
  onSave?: (matchId: string) => void;
  onDismiss?: (matchId: string) => void;
  showMatchDetails?: boolean;
}

/**
 * PropertyMatchCard Component
 * Displays a property match with score, details, and actions
 */
export const PropertyMatchCard: React.FC<PropertyMatchCardProps> = ({
  match,
  onSave,
  onDismiss,
  showMatchDetails = true,
}) => {
  const navigate = useNavigate();
  const { property } = match;

  // Get match score category
  const getScoreCategory = (score: number): 'excellent' | 'good' | 'fair' | 'low' => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'low';
  };

  // Format price
  const formatPrice = (price: number | null): string => {
    if (!price) return 'Contact for price';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format sqft
  const formatSqft = (sqft: number): string => {
    return new Intl.NumberFormat('en-US').format(sqft) + ' SF';
  };

  // Get property type display name
  const getPropertyTypeDisplay = (type: PropertyType): string => {
    const typeMap: Record<string, string> = {
      retail: 'Retail',
      restaurant: 'Restaurant',
      office: 'Office',
      industrial: 'Industrial',
      warehouse: 'Warehouse',
      medical: 'Medical',
      flex: 'Flex',
      land: 'Land',
      other: 'Other',
    };
    return typeMap[type] || type;
  };

  // Get first photo URL
  const getPhotoUrl = (): string | null => {
    if (!property.photos || property.photos.length === 0) return null;
    return property.photos[0].url;
  };

  const scoreCategory = getScoreCategory(match.match_score);
  const photoUrl = getPhotoUrl();

  // Handle view property
  const handleViewProperty = () => {
    navigate(`/property/${property.id}`);
  };

  // Get match criteria tags
  const getMatchCriteriaTags = () => {
    const tags: Array<{ label: string; status: 'match' | 'partial' | 'noMatch' }> = [];
    const details = match.match_details;

    if (details.location_match) {
      if (details.location_match.same_city) {
        tags.push({ label: 'Same City', status: 'match' });
      } else if (details.location_match.same_state) {
        tags.push({ label: 'Same State', status: 'partial' });
      }
    }

    if (details.sqft_match) {
      if (details.sqft_match.in_range) {
        tags.push({ label: 'Size Match', status: 'match' });
      } else if (match.sqft_score >= 50) {
        tags.push({ label: 'Size Close', status: 'partial' });
      }
    }

    if (details.price_match) {
      if (details.price_match.in_range) {
        tags.push({ label: 'In Budget', status: 'match' });
      } else if (match.price_score >= 50) {
        tags.push({ label: 'Near Budget', status: 'partial' });
      }
    }

    if (details.asset_type_match) {
      if (details.asset_type_match.is_exact_match) {
        tags.push({ label: 'Type Match', status: 'match' });
      } else if (match.asset_type_score >= 50) {
        tags.push({ label: 'Similar Type', status: 'partial' });
      }
    }

    return tags;
  };

  return (
    <div className={styles.matchCard}>
      {/* Match score badge */}
      <div className={`${styles.matchBadge} ${styles[scoreCategory]}`}>
        <svg className={styles.matchIcon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        {Math.round(match.match_score)}% Match
      </div>

      {/* Action buttons */}
      <div className={styles.actionButtons}>
        {onSave && (
          <button
            className={`${styles.actionButton} ${match.is_saved ? styles.saved : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSave(match.id);
            }}
            aria-label={match.is_saved ? 'Remove from saved' : 'Save property'}
            title={match.is_saved ? 'Remove from saved' : 'Save property'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={match.is_saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
      </div>

      {/* Property image */}
      <div className={styles.imageContainer}>
        {photoUrl ? (
          <img src={photoUrl} alt={property.title} className={styles.propertyImage} />
        ) : (
          <div className={styles.noImage}>
            <svg className={styles.noImageIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>No image</span>
          </div>
        )}
        {match.is_viewed && (
          <div className={styles.viewedBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Viewed
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <span className={styles.propertyType}>
          {getPropertyTypeDisplay(property.property_type)}
        </span>

        <h3 className={styles.title}>{property.title}</h3>

        <div className={styles.location}>
          <svg className={styles.locationIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {property.city}, {property.state}
        </div>

        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Size</span>
            <span className={styles.detailValue}>{formatSqft(property.sqft)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Price</span>
            <span className={styles.detailValue}>{formatPrice(property.asking_price)}</span>
          </div>
        </div>

        {/* Match details */}
        {showMatchDetails && (
          <div className={styles.matchDetails}>
            <p className={styles.matchDetailsTitle}>Why it matches</p>
            <div className={styles.matchCriteria}>
              {getMatchCriteriaTags().map((tag, index) => (
                <span key={index} className={`${styles.criteriaTag} ${styles[tag.status]}`}>
                  {tag.status === 'match' ? (
                    <svg className={styles.criteriaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : tag.status === 'partial' ? (
                    <svg className={styles.criteriaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14" />
                    </svg>
                  ) : (
                    <svg className={styles.criteriaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.viewButton} onClick={handleViewProperty}>
          View Property
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        {onDismiss && (
          <button
            className={styles.dismissButton}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(match.id);
            }}
          >
            Not interested
          </button>
        )}
      </div>
    </div>
  );
};

export default PropertyMatchCard;
