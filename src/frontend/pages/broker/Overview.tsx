import React, { useState } from 'react';
import styles from './Overview.module.css';
import { BusinessStatsCard } from '@components/broker/BusinessStatsCard';
import { BusinessProfileSelector } from '@components/broker/BusinessProfileSelector';
import { BusinessProfileModal } from '@components/broker/BusinessProfileModal';

/**
 * Overview Page (Broker Dashboard)
 *
 * Main landing page for broker dashboard showing:
 * - Business profile statistics (offices, agents, tenants, properties)
 * - Right sidebar with business profile selector
 * - Create new business profile modal
 *
 * Updated in Task Group 6:
 * - Integrated BusinessStatsCard component
 * - Integrated BusinessProfileSelector component
 * - Added BusinessProfileModal integration
 */
export const Overview: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalSuccess = () => {
    // Profile created successfully - modal will close and selector will refresh
    console.log('Business profile created successfully');
  };

  return (
    <div className={styles.overview}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Overview</h1>
        <p className={styles.subtitle}>
          Monitor your performance and track key metrics
        </p>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {/* Business Statistics Card */}
        <BusinessStatsCard />

        {/* Additional content can be added here in future phases */}
      </div>

      {/* Business Profile Modal */}
      {isModalOpen && (
        <BusinessProfileModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default Overview;
