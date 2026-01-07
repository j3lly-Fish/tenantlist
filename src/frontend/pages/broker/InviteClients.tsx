import React from 'react';
import styles from './InviteClients.module.css';

/**
 * InviteClients Page (Broker Dashboard)
 *
 * Client invitation system showing:
 * - Form to invite new clients via email
 * - List of pending invitations
 * - Invitation status tracking
 * - Bulk invitation functionality
 *
 * Future Implementation (Phase 5):
 * - Email invitation system
 * - Invitation templates
 * - Status tracking (sent, opened, accepted)
 * - Bulk invite via CSV upload
 */
export const InviteClients: React.FC = () => {
  return (
    <div className={styles.inviteClients}>
      <header className={styles.header}>
        <h1 className={styles.title}>Invite Clients</h1>
        <p className={styles.subtitle}>
          Send invitations to potential clients and track their status
        </p>
      </header>

      <div className={styles.content}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>✉️</div>
          <h2 className={styles.placeholderTitle}>Client Invitations</h2>
          <p className={styles.placeholderText}>
            This page will provide an email invitation system for onboarding new clients,
            with status tracking and bulk invitation features. Coming soon in Phase 5.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InviteClients;
