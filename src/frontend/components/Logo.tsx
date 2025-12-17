import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

/**
 * Logo Component
 *
 * Displays the "zyx" brand name
 * Links to the /dashboard route
 * Typography matches Figma design
 */
export const Logo: React.FC = () => {
  return (
    <Link to="/dashboard" className={styles.logo} aria-label="zyx logo - Go to dashboard">
      <span className={styles.brandName}>zyx</span>
    </Link>
  );
};
