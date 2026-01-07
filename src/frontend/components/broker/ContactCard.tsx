import React from 'react';
import styles from './ContactCard.module.css';

interface ContactCardProps {
  contactName: string;
  contactCompany: string;
  contactAvatar?: string;
  onSendMessage: () => void;
  onSubmitProperty: () => void;
}

/**
 * ContactCard Component
 *
 * Displays contact information with action buttons
 */
export const ContactCard: React.FC<ContactCardProps> = ({
  contactName,
  contactCompany,
  contactAvatar,
  onSendMessage,
  onSubmitProperty,
}) => {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={styles.contactCard}>
      <h3 className={styles.title}>Contact Listing</h3>

      <div className={styles.contactInfo}>
        <div className={styles.avatar}>
          {contactAvatar ? (
            <img src={contactAvatar} alt={contactName} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {getInitials(contactName)}
            </div>
          )}
        </div>
        <div className={styles.details}>
          <p className={styles.name}>{contactName}</p>
          <p className={styles.company}>{contactCompany}</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={onSendMessage} className={styles.sendMessageButton}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 3L18 10L2 17V11L13 10L2 9V3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          Send Message
        </button>

        <button onClick={onSubmitProperty} className={styles.submitPropertyButton}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2L2 7V17C2 17.5304 2.21071 18.0391 2.58579 18.4142C2.96086 18.7893 3.46957 19 4 19H16C16.5304 19 17.0391 18.7893 17.4142 18.4142C17.7893 18.0391 18 17.5304 18 17V7L10 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M7 19V10H13V19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Submit Property
        </button>
      </div>
    </div>
  );
};
