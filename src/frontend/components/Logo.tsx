import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

/**
 * Logo Component
 *
 * Displays the "waltre" brand name with search icon
 * Links to the /dashboard route
 * Typography matches Figma design
 */
export const Logo: React.FC = () => {
  return (
    <Link to="/dashboard" className={styles.logo} aria-label="waltre logo - Go to dashboard">
      <span className={styles.brandName}>waltre 🔍</span>
    </Link>
  );
};
