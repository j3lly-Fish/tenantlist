import React from 'react';
import styles from './TierBadge.module.css';

interface TierBadgeProps {
  tier: string; // e.g., "Free Plan", "Starter", "Pro"
}

/**
 * TierBadge Component
 *
 * Displays the user's subscription tier
 * - Shows tier name with appropriate styling
 * - Badge design matching Figma (pill-shaped)
 * - Different colors for different tiers
 */
export const TierBadge: React.FC<TierBadgeProps> = ({ tier }) => {
  // Determine tier class based on tier name
  const getTierClass = () => {
    const lowerTier = tier.toLowerCase();
    if (lowerTier.includes('free')) return styles.free;
    if (lowerTier.includes('starter')) return styles.starter;
    if (lowerTier.includes('pro')) return styles.pro;
    return styles.free; // Default to free styling
  };

  return (
    <div
      className={`${styles.tierBadge} ${getTierClass()}`}
      role="status"
      aria-label={`Current subscription tier: ${tier}`}
    >
      {tier}
    </div>
  );
};
