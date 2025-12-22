import React, { useState, useRef, useEffect } from 'react';
import { FilterOption } from '../../types';
import styles from './FilterDropdown.module.css';

interface FilterDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

/**
 * FilterDropdown Component
 *
 * A dropdown component for filtering with:
 * - Filter icon in the button
 * - Selected option display
 * - Dropdown menu with options
 * - Keyboard navigation support
 * - Click outside to close
 */
export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  value,
  onChange,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || label;

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  return (
    <div
      className={styles.filterDropdown}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        className={styles.dropdownButton}
        onClick={handleToggle}
        aria-label={label}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        {/* Filter Icon */}
        <span className={styles.filterIcon} data-testid="filter-icon" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 3C1 2.44772 1.44772 2 2 2H14C14.5523 2 15 2.44772 15 3C15 3.55228 14.5523 4 14 4H2C1.44772 4 1 3.55228 1 3Z"
              fill="currentColor"
            />
            <path
              d="M3 8C3 7.44772 3.44772 7 4 7H12C12.5523 7 13 7.44772 13 8C13 8.55228 12.5523 9 12 9H4C3.44772 9 3 8.55228 3 8Z"
              fill="currentColor"
            />
            <path
              d="M5 13C5 12.4477 5.44772 12 6 12H10C10.5523 12 11 12.4477 11 13C11 13.5523 10.5523 14 10 14H6C5.44772 14 5 13.5523 5 13Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className={styles.buttonText}>{displayText}</span>
        <span className={styles.dropdownIcon} aria-hidden="true">
          {isOpen ? '\u25B2' : '\u25BC'}
        </span>
      </button>

      {isOpen && (
        <ul
          className={styles.dropdownMenu}
          role="listbox"
          aria-label={label}
        >
          {options.map((option) => (
            <li key={option.value} role="option" aria-selected={option.value === value}>
              <button
                className={`${styles.dropdownItem} ${
                  option.value === value ? styles.selected : ''
                }`}
                onClick={() => handleSelect(option.value)}
                type="button"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
