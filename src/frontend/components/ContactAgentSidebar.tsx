import React from 'react';
import styles from './ContactAgentSidebar.module.css';

/**
 * Agent information for the sidebar
 */
export interface AgentInfo {
  name: string;
  company: string;
  photoUrl?: string | null;
  email?: string;
  phone?: string;
}

/**
 * Props for ContactAgentSidebar component
 */
export interface ContactAgentSidebarProps {
  agent: AgentInfo;
  onSendMessage: () => void;
  onSendQFP: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

/**
 * ContactAgentSidebar Component
 *
 * Displays agent contact information with action buttons.
 *
 * Features:
 * - Agent profile photo
 * - Agent name and company
 * - "Send Message" button (primary)
 * - "Send QFP" button (secondary)
 * - "Decline" button (tertiary/text)
 */
export const ContactAgentSidebar: React.FC<ContactAgentSidebarProps> = ({
  agent,
  onSendMessage,
  onSendQFP,
  onDecline,
  isLoading = false,
}) => {
  // Generate initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.contactSidebar}>
      {/* Agent Info */}
      <div className={styles.agentInfo}>
        {agent.photoUrl ? (
          <img
            src={agent.photoUrl}
            alt={agent.name}
            className={styles.agentPhoto}
          />
        ) : (
          <div className={styles.agentAvatar} data-testid="agent-avatar">
            {getInitials(agent.name)}
          </div>
        )}
        <div className={styles.agentDetails}>
          <h3 className={styles.agentName}>{agent.name}</h3>
          <p className={styles.agentCompany}>{agent.company}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onSendMessage}
          disabled={isLoading}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.buttonIcon}
          >
            <path
              d="M14 1H2C1.44772 1 1 1.44772 1 2V11C1 11.5523 1.44772 12 2 12H5L8 15L11 12H14C14.5523 12 15 11.5523 15 11V2C15 1.44772 14.5523 1 14 1Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Send Message
        </button>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onSendQFP}
          disabled={isLoading}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.buttonIcon}
          >
            <path
              d="M13 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 5H11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M5 8H11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M5 11H8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Send QFP
        </button>

        <button
          type="button"
          className={styles.textButton}
          onClick={onDecline}
          disabled={isLoading}
        >
          Decline
        </button>
      </div>

      {/* Optional Contact Info */}
      {(agent.email || agent.phone) && (
        <div className={styles.contactDetails}>
          {agent.email && (
            <a href={`mailto:${agent.email}`} className={styles.contactLink}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 3.5L7 7.5L13 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="1"
                  y="2"
                  width="12"
                  height="10"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              {agent.email}
            </a>
          )}
          {agent.phone && (
            <a href={`tel:${agent.phone}`} className={styles.contactLink}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.5 10.5V12C12.5 12.5523 12.0523 13 11.5 13C6.25329 13 2 8.74671 2 3.5C2 2.94772 2.44772 2.5 3 2.5H4.5C4.77614 2.5 5 2.72386 5 3V5C5 5.27614 4.77614 5.5 4.5 5.5H4C4 8.26142 6.23858 10.5 9 10.5V10C9 9.72386 9.22386 9.5 9.5 9.5H11.5C12.0523 9.5 12.5 9.94772 12.5 10.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {agent.phone}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactAgentSidebar;
