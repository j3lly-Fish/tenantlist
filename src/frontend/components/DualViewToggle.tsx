import React from 'react';
import styles from './DualViewToggle.module.css';

export type ViewMode = 'demands' | 'properties';

interface DualViewToggleProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  demandsCount?: number;
  propertiesCount?: number;
}

/**
 * DualViewToggle Component
 *
 * Segmented control for switching between Tenant Demands and Property Listings views
 * - Displays active state with slide indicator
 * - Shows counts for each view
 * - Keyboard accessible
 * - Follows Figma design system (SF Pro, design tokens)
 *
 * @param activeView - Currently active view ('demands' | 'properties')
 * @param onViewChange - Callback when view changes
 * @param demandsCount - Optional count of tenant demands
 * @param propertiesCount - Optional count of property listings
 */
export const DualViewToggle: React.FC<DualViewToggleProps> = ({
  activeView,
  onViewChange,
  demandsCount,
  propertiesCount,
}) => {
  return (
    <div className={styles.toggleContainer} role="tablist" aria-label="View selector">
      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'demands'}
        aria-controls="demands-panel"
        className={`${styles.toggleButton} ${activeView === 'demands' ? styles.active : ''}`}
        onClick={() => onViewChange('demands')}
      >
        <span className={styles.toggleLabel}>Tenant Demands</span>
        {demandsCount !== undefined && (
          <span className={styles.toggleCount}>({demandsCount})</span>
        )}
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeView === 'properties'}
        aria-controls="properties-panel"
        className={`${styles.toggleButton} ${activeView === 'properties' ? styles.active : ''}`}
        onClick={() => onViewChange('properties')}
      >
        <span className={styles.toggleLabel}>Property Listings</span>
        {propertiesCount !== undefined && (
          <span className={styles.toggleCount}>({propertiesCount})</span>
        )}
      </button>

      <div
        className={styles.activeIndicator}
        style={{ transform: activeView === 'properties' ? 'translateX(100%)' : 'translateX(0)' }}
        aria-hidden="true"
      />
    </div>
  );
};
