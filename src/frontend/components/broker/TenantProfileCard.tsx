import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TenantProfileCard.module.css';

/**
 * TenantProfileCard Component
 *
 * Grid item showing tenant profile summary.
 * Features:
 * - Circular logo with verified badge overlay
 * - Company name (heading)
 * - Category subtitle
 * - Star rating with review count
 * - Location (city, state)
 * - Hover effect with subtle shadow
 * - Click navigates to full profile page
 */

export interface TenantProfile {
  id: string;
  display_name: string;
  logo_url?: string | null;
  category?: string | null;
  rating: number;
  review_count: number;
  is_verified: boolean;
  // Location is typically from first associated location
  city?: string;
  state?: string;
}

interface TenantProfileCardProps {
  tenant: TenantProfile;
  onClick?: (tenantId: string) => void;
}

export const TenantProfileCard: React.FC<TenantProfileCardProps> = ({
  tenant,
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(tenant.id);
    } else {
      navigate(`/broker/tenant-profile/${tenant.id}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Get initials for logo fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Default placeholder for tenants without logos
  const defaultLogoUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23e5e7eb'/%3E%3Ctext x='60' y='60' font-family='Arial, sans-serif' font-size='40' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3E${getInitials(tenant.display_name)}%3C/text%3E%3C/svg%3E`;
  const logoUrl = tenant.logo_url || defaultLogoUrl;

  // Format rating for display
  const formatRating = (rating: number): string => {
    return rating.toFixed(1);
  };

  return (
    <article
      className={styles.tenantCard}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`View profile for ${tenant.display_name}`}
    >
      {/* Logo with verified badge */}
      <div className={styles.logoContainer}>
        <img
          src={logoUrl}
          alt={`${tenant.display_name} logo`}
          className={styles.logo}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultLogoUrl;
          }}
        />
        {tenant.is_verified && (
          <div className={styles.verifiedBadge} aria-label="Verified tenant">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="12" fill="#1DA1F2" />
              <path
                d="M10.5 14.5L8 12L7 13L10.5 16.5L17 10L16 9L10.5 14.5Z"
                fill="white"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Company info */}
      <div className={styles.content}>
        {/* Company name */}
        <h3 className={styles.companyName}>{tenant.display_name}</h3>

        {/* Category */}
        {tenant.category && (
          <p className={styles.category}>{tenant.category}</p>
        )}

        {/* Rating */}
        <div className={styles.rating}>
          <span className={styles.ratingValue}>
            {formatRating(tenant.rating)}
          </span>
          <svg
            className={styles.starIcon}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8 0L10.163 5.018L16 5.819L12 9.708L12.944 15.5L8 12.764L3.056 15.5L4 9.708L0 5.819L5.837 5.018L8 0Z"
              fill="#FBBF24"
            />
          </svg>
          <span className={styles.reviewCount}>
            ({tenant.review_count} {tenant.review_count === 1 ? 'Review' : 'Reviews'})
          </span>
        </div>

        {/* Location */}
        {(tenant.city || tenant.state) && (
          <div className={styles.location}>
            <svg
              className={styles.locationIcon}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M7 0C4.23858 0 2 2.23858 2 5C2 8.5 7 14 7 14C7 14 12 8.5 12 5C12 2.23858 9.76142 0 7 0ZM7 7C5.89543 7 5 6.10457 5 5C5 3.89543 5.89543 3 7 3C8.10457 3 9 3.89543 9 5C9 6.10457 8.10457 7 7 7Z"
                fill="currentColor"
              />
            </svg>
            <span className={styles.locationText}>
              {tenant.city && tenant.state
                ? `${tenant.city}, ${tenant.state}`
                : tenant.city || tenant.state}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
