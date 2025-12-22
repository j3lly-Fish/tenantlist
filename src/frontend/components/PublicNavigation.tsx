import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PublicNavigation.module.css';

interface PublicNavigationProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

/**
 * PublicNavigation Component
 *
 * Public-facing navigation header for the landing page
 * - Displays logo on the left (links to home)
 * - Shows navigation links in the center: "How It Works", "Pricing"
 * - Displays auth buttons on the right: "Sign In" (text), "Get Started" (primary)
 * - Sticky positioning at top of page
 * - Responsive mobile hamburger menu
 *
 * Layout: [Logo] [Nav Links] [Sign In] [Get Started]
 */
export const PublicNavigation: React.FC<PublicNavigationProps> = ({
  onSignIn,
  onGetStarted,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignIn = () => {
    setIsMobileMenuOpen(false);
    onSignIn?.();
  };

  const handleGetStarted = () => {
    setIsMobileMenuOpen(false);
    onGetStarted?.();
  };

  return (
    <nav className={styles.publicNavigation} role="navigation" aria-label="Public navigation">
      <div className={styles.container}>
        {/* Left section: Logo */}
        <div className={styles.leftSection}>
          <Link to="/" className={styles.logo} aria-label="zyx logo - Go to home">
            <span className={styles.brandName}>zyx</span>
          </Link>
        </div>

        {/* Center section: Navigation links (desktop) */}
        <div className={styles.centerSection}>
          <a href="#how-it-works" className={styles.navLink}>
            How It Works
          </a>
          <a href="#pricing" className={styles.navLink}>
            Pricing
          </a>
        </div>

        {/* Right section: Auth buttons (desktop) */}
        <div className={styles.rightSection}>
          <button
            type="button"
            className={styles.signInButton}
            onClick={handleSignIn}
          >
            Sign In
          </button>
          <button
            type="button"
            className={styles.getStartedButton}
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className={styles.mobileMenuToggle}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </div>

      {/* Mobile navigation */}
      <div
        className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.open : ''}`}
        data-testid="mobile-nav"
      >
        <a href="#how-it-works" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
          How It Works
        </a>
        <a href="#pricing" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
          Pricing
        </a>
        <div className={styles.mobileAuthButtons}>
          <button
            type="button"
            className={styles.signInButton}
            onClick={handleSignIn}
          >
            Sign In
          </button>
          <button
            type="button"
            className={styles.getStartedButton}
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};
