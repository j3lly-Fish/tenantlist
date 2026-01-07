import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { BrokerSidebar } from '@components/broker/BrokerSidebar';
import { BusinessProfileSelector } from '@components/broker/BusinessProfileSelector';
import { BusinessProfileModal } from '@components/broker/BusinessProfileModal';
import { BusinessProfileProvider } from '@contexts/BusinessProfileContext';
import styles from './BrokerLayout.module.css';

/**
 * BrokerLayout Component
 *
 * Three-column layout wrapper for all broker dashboard pages
 * - TopNavigation: Logo, tabs, notifications, profile (full width top)
 * - Left Sidebar: Navigation menu (250px fixed width)
 * - Main Content: Page content (flex-grow)
 * - Right Sidebar: Business profile selector (350px)
 *
 * Features:
 * - Sticky sidebar navigation
 * - Responsive design: collapse sidebar on mobile (<768px)
 * - Scrollable main content area
 * - Design tokens from design-tokens.css
 * - Business profile context provider wrapping entire layout
 *
 * Updated in Task Group 6:
 * - Added BusinessProfileSelector in right sidebar
 * - Added BusinessProfileProvider context wrapper
 * - Added BusinessProfileModal integration
 */
export const BrokerLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCreateProfileClick = () => {
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
    <BusinessProfileProvider>
      <div className={styles.brokerLayout}>
        {/* Top Navigation - Full width */}
        <TopNavigation tier="Broker" />

        {/* Main container with sidebar and content */}
        <div className={styles.container}>
          {/* Mobile hamburger menu */}
          <button
            className={styles.hamburger}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar navigation"
            aria-expanded={isSidebarOpen}
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>

          {/* Sidebar overlay for mobile */}
          {isSidebarOpen && (
            <div
              className={styles.sidebarOverlay}
              onClick={toggleSidebar}
              aria-hidden="true"
            />
          )}

          {/* Left Sidebar - 250px */}
          <aside
            className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}
          >
            <BrokerSidebar onNavigate={() => setIsSidebarOpen(false)} />
          </aside>

          {/* Main Content Area - Flex grow */}
          <main className={styles.mainContent}>
            <Outlet />
          </main>

          {/* Right Sidebar - Business Profile Selector */}
          <BusinessProfileSelector onCreateClick={handleCreateProfileClick} />
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
    </BusinessProfileProvider>
  );
};
