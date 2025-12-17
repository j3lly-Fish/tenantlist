import React, { useState } from 'react';
import { Business } from '../../types';
import styles from './DeleteBusinessModal.module.css';

interface DeleteBusinessModalProps {
  isOpen: boolean;
  business: Business | null;
  onClose: () => void;
  onConfirm: (businessId: string) => Promise<void>;
}

export const DeleteBusinessModal: React.FC<DeleteBusinessModalProps> = ({
  isOpen,
  business,
  onClose,
  onConfirm,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !business) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(business.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete business');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.warningIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className={styles.modalTitle}>Delete Business</h2>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.message}>
            Are you sure you want to delete <strong>{business.name}</strong>?
          </p>
          <p className={styles.warning}>
            This action cannot be undone. All associated demand listings, metrics, and invites will also be permanently deleted.
          </p>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onClose}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={styles.deleteButton}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Business'}
          </button>
        </div>
      </div>
    </div>
  );
};
