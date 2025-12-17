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
 * - Logo (lazy loaded with fallback)
 * - Business name and category badge
 * - Status badge
 * - Three metric badges (Listings, States, Invites)
 * - Three-dot menu (Stealth mode, Edit, Delete)
 * - Warning banner for unverified businesses
 * - Action buttons (View Performance, Manage Locations)
 *
 * Layout matches DemandCRE-design.pdf specifications
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

  return (
    <article
      className={styles.businessCard}
      onClick={handleCardClick}
      role="article"
      aria-label={`Business: ${business.name}`}
    >
      {/* Three-dot menu in top-right corner */}
      <ThreeDotsMenu
        businessId={business.id}
        businessName={business.name}
        stealthModeEnabled={business.stealth_mode_enabled}
        onToggleStealthMode={onToggleStealthMode}
        onEdit={onEdit}
        onDelete={onDelete}
        userTier={userTier}
      />

      {/* Business logo */}
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

      {/* Business name and category */}
      <div className={styles.cardHeader}>
        <h3 className={styles.businessName}>{business.name}</h3>
        <CategoryBadge category={business.category} />
      </div>

      {/* Status badge */}
      <div className={styles.statusContainer}>
        <StatusBadge status={business.status} />
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
          aria-label={`Manage locations for ${business.name}`}
        >
          Manage Locations
        </button>
      </div>
    </article>
  );
});

BusinessCard.displayName = 'BusinessCard';
