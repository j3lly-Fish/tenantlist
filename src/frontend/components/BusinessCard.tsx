import React from 'react';
import { Business } from '../../types';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { MetricBadge } from './MetricBadge';
import { ThreeDotsMenu } from './ThreeDotsMenu';
import { WarningBanner } from './WarningBanner';
import styles from './BusinessCard.module.css';

interface BusinessCardProps {
  business: Business;
  onEdit?: (businessId: string) => void;
  onDelete?: (businessId: string) => void;
  onViewPerformance?: (businessId: string) => void;
  onManageLocations?: (businessId: string) => void;
  onToggleStealthMode?: (businessId: string) => void;
  onClick?: (businessId: string) => void;
  userTier?: string;
}

/**
 * BusinessCard Component
 *
 * Displays business information with:
 * - Cover image as full-bleed card background (when available)
 * - Logo overlay in bottom-left corner (when cover image present)
 * - Status badge overlay in top-right (when cover image present)
 * - Gradient overlay for text readability (when cover image present)
 * - Fallback to standard layout when no cover image
 * - Business name and category badge
 * - Three metric badges (Listings, States, Invites)
 * - Three-dot menu (Stealth mode, Edit, Delete)
 * - Warning banner for unverified businesses
 * - Action buttons (View Performance, Add Locations)
 *
 * Layout matches Figma/DemandCRE-design specifications
 */
export const BusinessCard: React.FC<BusinessCardProps> = React.memo(({
  business,
  onEdit,
  onDelete,
  onViewPerformance,
  onManageLocations,
  onToggleStealthMode,
  onClick,
  userTier = 'starter',
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(business.id);
    }
  };

  const handleButtonClick = (
    e: React.MouseEvent,
    handler?: (businessId: string) => void
  ) => {
    e.stopPropagation();
    if (handler) {
      handler(business.id);
    }
  };

  // Default placeholder SVG for businesses without logos
  const defaultLogoSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-size='40' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3E${business.name.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
  const logoUrl = business.logo_url || defaultLogoSvg;

  // Check if cover image is available
  const hasCoverImage = Boolean(business.cover_image_url);

  return (
    <article
      className={`${styles.businessCard} ${hasCoverImage ? styles.hasCoverImage : ''}`}
      onClick={handleCardClick}
      role="article"
      aria-label={`Business: ${business.name}`}
    >
      {/* Three-dot menu - always in top-right corner */}
      <ThreeDotsMenu
        businessId={business.id}
        businessName={business.name}
        stealthModeEnabled={business.stealth_mode_enabled}
        onToggleStealthMode={onToggleStealthMode}
        onEdit={onEdit}
        onDelete={onDelete}
        userTier={userTier}
      />

      {/* Cover Image Layout (when cover image is available) */}
      {hasCoverImage ? (
        <div className={styles.coverImageContainer} data-testid="cover-image-container">
          {/* Cover image as background */}
          <img
            src={business.cover_image_url!}
            alt={`${business.name} cover`}
            className={styles.coverImage}
            data-testid="cover-image"
            loading="lazy"
            onError={(e) => {
              // Hide the cover image container on error, fall back to standard layout
              const container = (e.target as HTMLImageElement).closest(`.${styles.coverImageContainer}`);
              if (container) {
                container.remove();
              }
            }}
          />

          {/* Gradient overlay for text readability */}
          <div className={styles.gradientOverlay} data-testid="gradient-overlay" />

          {/* Logo overlay in bottom-left corner */}
          <div className={styles.logoOverlay} data-testid="logo-overlay">
            <img
              src={logoUrl}
              alt={`${business.name} logo`}
              className={styles.overlayLogo}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultLogoSvg;
              }}
            />
          </div>

          {/* Status badge overlay in top-right corner */}
          <div className={styles.statusOverlay} data-testid="status-overlay">
            <StatusBadge status={business.status} />
          </div>
        </div>
      ) : (
        <>
          {/* Standard Layout (no cover image) */}
          <div className={styles.logoContainer}>
            <img
              src={logoUrl}
              alt={`${business.name} logo`}
              className={styles.logo}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultLogoSvg;
              }}
            />
          </div>

          {/* Status badge in standard position */}
          <div className={styles.statusContainer}>
            <StatusBadge status={business.status} />
          </div>
        </>
      )}

      {/* Business name and category */}
      <div className={styles.cardHeader}>
        <h3 className={styles.businessName}>{business.name}</h3>
        <CategoryBadge category={business.category} />
      </div>

      {/* Metric badges row */}
      <div className={styles.metrics}>
        <MetricBadge
          label="Listings"
          value={business.listingsCount || 0}
        />
        <MetricBadge
          label="States"
          value={business.statesCount || 0}
        />
        <MetricBadge
          label="Invites"
          value={business.invitesCount || 0}
        />
      </div>

      {/* Warning banner for unverified businesses */}
      {!business.is_verified && (
        <WarningBanner
          message="Business visibility is restricted until verification is complete"
          variant="warning"
        />
      )}

      {/* Action buttons */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionButton} ${styles.primary}`}
          onClick={(e) => handleButtonClick(e, onViewPerformance)}
          aria-label={`View performance for ${business.name}`}
        >
          View Performance
        </button>
        <button
          className={`${styles.actionButton} ${styles.secondary}`}
          onClick={(e) => handleButtonClick(e, onManageLocations)}
          aria-label={`Add locations for ${business.name}`}
        >
          Add Locations
        </button>
      </div>
    </article>
  );
});

BusinessCard.displayName = 'BusinessCard';
