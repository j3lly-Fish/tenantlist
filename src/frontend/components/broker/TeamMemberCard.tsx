import React from 'react';
import styles from './TeamMemberCard.module.css';

export interface TeamMember {
  id: string;
  name: string;
  location: string;
  role: 'broker' | 'admin' | 'manager' | 'viewer';
  email: string;
}

interface TeamMemberCardProps {
  member: TeamMember;
  onUpdate: (updatedMember: Partial<TeamMember>) => void;
  onRemove: () => void;
}

const ROLE_OPTIONS = [
  { value: 'broker', label: 'Broker' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'viewer', label: 'Viewer' },
];

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, onUpdate, onRemove }) => {
  return (
    <div className={styles.card}>
      {/* Avatar Placeholder */}
      <div className={styles.avatar}>
        <span className={styles.avatarText}>
          {member.name ? member.name.charAt(0).toUpperCase() : '?'}
        </span>
      </div>

      {/* Member Info */}
      <div className={styles.info}>
        <div className={styles.formGroup}>
          <input
            type="text"
            className={styles.input}
            value={member.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Name"
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="email"
            className={styles.input}
            value={member.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            placeholder="Email address"
            required
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.formGroup}>
            <input
              type="text"
              className={styles.input}
              value={member.location}
              onChange={(e) => onUpdate({ location: e.target.value })}
              placeholder="Location (optional)"
            />
          </div>

          <div className={styles.formGroup}>
            <select
              className={styles.select}
              value={member.role}
              onChange={(e) =>
                onUpdate({ role: e.target.value as TeamMember['role'] })
              }
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        className={styles.removeButton}
        onClick={onRemove}
        aria-label="Remove team member"
      >
        &times;
      </button>
    </div>
  );
};
