import React from 'react';
import { useToast, Toast as ToastType } from '@contexts/ToastContext';
import styles from './ToastContainer.module.css';

/**
 * Toast Component
 *
 * Displays a single toast notification with icon and message.
 */
const Toast: React.FC<{
  toast: ToastType;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
              fill="currentColor"
            />
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
              fill="currentColor"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
              fill="currentColor"
            />
          </svg>
        );
      case 'info':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z"
              fill="currentColor"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]}`}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className={styles.toastIcon}>{getIcon()}</div>
      <div className={styles.toastMessage}>{toast.message}</div>
      <button
        className={styles.toastClose}
        onClick={() => onRemove(toast.id)}
        aria-label="Close notification"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
};

/**
 * ToastContainer Component
 *
 * Renders all active toast notifications in a fixed container.
 * Positioned at top-right of viewport.
 */
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer} role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};
