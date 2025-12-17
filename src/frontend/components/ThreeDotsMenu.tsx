import React, { useState, useRef, useEffect } from 'react';
import styles from './ThreeDotsMenu.module.css';

interface ThreeDotsMenuProps {
  businessId: string;
  businessName: string;
  stealthModeEnabled: boolean;
  onToggleStealthMode?: (businessId: string) => void;
  onEdit?: (businessId: string) => void;
  onDelete?: (businessId: string) => void;
  userTier?: string;
}

/**
 * ThreeDotsMenu Component
 *
 * Three-dot icon button with dropdown menu for business actions
 * - Stealth mode toggle (disabled for non-Enterprise tiers)
 * - Edit Business
 * - Delete Business
 *
 * Features:
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click outside to close
 * - event.stopPropagation to prevent card click
 * - Positioned in top-right corner of parent card
 */
export const ThreeDotsMenu: React.FC<ThreeDotsMenuProps> = ({
  businessId,
  businessName,
  stealthModeEnabled,
  onToggleStealthMode,
  onEdit,
  onDelete,
  userTier = 'starter',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isEnterpriseUser = userTier === 'enterprise';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, 2));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        handleMenuAction(focusedIndex);
        break;
    }
  };

  const handleMenuAction = (index: number) => {
    switch (index) {
      case 0:
        if (isEnterpriseUser && onToggleStealthMode) {
          onToggleStealthMode(businessId);
        }
        break;
      case 1:
        if (onEdit) {
          onEdit(businessId);
        }
        break;
      case 2:
        if (onDelete) {
          onDelete(businessId);
        }
        break;
    }
    setIsOpen(false);
  };

  const handleToggleMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleStealthModeClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isEnterpriseUser && onToggleStealthMode) {
      onToggleStealthMode(businessId);
      setIsOpen(false);
    }
  };

  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onEdit) {
      onEdit(businessId);
      setIsOpen(false);
    }
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(businessId);
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.threeDotsMenu} ref={menuRef} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        className={styles.menuButton}
        onClick={handleToggleMenu}
        aria-label={`Actions for ${businessName}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className={styles.dotsIcon}>⋮</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu">
          <button
            className={`${styles.menuItem} ${!isEnterpriseUser ? styles.disabled : ''} ${
              focusedIndex === 0 ? styles.focused : ''
            }`}
            onClick={handleStealthModeClick}
            disabled={!isEnterpriseUser}
            role="menuitem"
            aria-label={`Stealth mode ${stealthModeEnabled ? 'enabled' : 'disabled'}`}
            title={!isEnterpriseUser ? 'Enterprise feature' : ''}
          >
            <input
              type="checkbox"
              checked={stealthModeEnabled}
              disabled={!isEnterpriseUser}
              onChange={() => {}}
              onClick={(e) => e.stopPropagation()}
              aria-hidden="true"
            />
            <span>Stealth mode</span>
            {!isEnterpriseUser && <span className={styles.badge}>Enterprise</span>}
          </button>

          <button
            className={`${styles.menuItem} ${focusedIndex === 1 ? styles.focused : ''}`}
            onClick={handleEditClick}
            role="menuitem"
            aria-label={`Edit ${businessName}`}
          >
            Edit Business
          </button>

          <button
            className={`${styles.menuItem} ${styles.danger} ${
              focusedIndex === 2 ? styles.focused : ''
            }`}
            onClick={handleDeleteClick}
            role="menuitem"
            aria-label={`Delete ${businessName}`}
          >
            Delete Business
          </button>
        </div>
      )}
    </div>
  );
};
