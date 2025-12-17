import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import styles from './ProfileDropdown.module.css';

/**
 * ProfileDropdown Component
 *
 * Settings icon button that opens a dropdown menu
 * - Dropdown menu items: Go to Profile, Settings, Logout
 * - Closes on outside click
 * - Navigates to appropriate routes
 * - Integrates with AuthContext for logout functionality
 */
export const ProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  const handleLogoutClick = async () => {
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user) return '?';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  return (
    <div className={styles.profileDropdown} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={toggleDropdown}
        aria-label="Profile menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Settings icon */}
        <svg
          className={styles.icon}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.1667 12.5C16.0557 12.7513 16.0226 13.0301 16.0717 13.3006C16.1209 13.5711 16.2501 13.8203 16.4417 14.0167L16.4917 14.0667C16.6463 14.2211 16.7692 14.4049 16.8532 14.6075C16.9373 14.8101 16.9808 15.0275 16.9808 15.2472C16.9808 15.4668 16.9373 15.6842 16.8532 15.8868C16.7692 16.0894 16.6463 16.2732 16.4917 16.4277C16.3372 16.5822 16.1534 16.7051 15.9508 16.7892C15.7482 16.8732 15.5308 16.9167 15.3111 16.9167C15.0915 16.9167 14.8741 16.8732 14.6715 16.7892C14.4689 16.7051 14.2851 16.5822 14.1306 16.4277L14.0806 16.3777C13.8842 16.1861 13.635 16.0569 13.3645 16.0077C13.094 15.9586 12.8152 15.9917 12.5639 16.1027C12.3173 16.2083 12.1063 16.3839 11.9561 16.6082C11.8059 16.8326 11.7226 17.0961 11.7167 17.3667V17.5C11.7167 17.9421 11.5411 18.3659 11.2285 18.6785C10.9159 18.9911 10.4921 19.1667 10.05 19.1667C9.60791 19.1667 9.18408 18.9911 8.87152 18.6785C8.55896 18.3659 8.38333 17.9421 8.38333 17.5V17.425C8.37201 17.1464 8.27967 16.8769 8.11727 16.6504C7.95487 16.4238 7.72973 16.2497 7.46944 16.15C7.21815 16.039 6.9393 16.0059 6.66881 16.055C6.39832 16.1042 6.14906 16.2334 5.95278 16.425L5.90278 16.475C5.74828 16.6295 5.56449 16.7524 5.36189 16.8365C5.15928 16.9205 4.94189 16.964 4.72222 16.964C4.50255 16.964 4.28516 16.9205 4.08256 16.8365C3.87995 16.7524 3.69616 16.6295 3.54167 16.475C3.38714 16.3205 3.26425 16.1367 3.18019 15.9341C3.09613 15.7315 3.05264 15.5141 3.05264 15.2944C3.05264 15.0748 3.09613 14.8574 3.18019 14.6548C3.26425 14.4522 3.38714 14.2684 3.54167 14.1139L3.59167 14.0639C3.78325 13.8676 3.91243 13.6184 3.96158 13.3479C4.01074 13.0774 3.97765 12.7985 3.86667 12.5472C3.76128 12.3006 3.58567 12.0896 3.36132 11.9394C3.13696 11.7892 2.87346 11.7059 2.60278 11.7L2.43333 11.7C1.99125 11.7 1.56742 11.5244 1.25486 11.2118C0.942301 10.8993 0.766668 10.4754 0.766668 10.0333C0.766668 9.59125 0.942301 9.16742 1.25486 8.85486C1.56742 8.54229 1.99125 8.36667 2.43333 8.36667H2.50833C2.78687 8.35535 3.05642 8.26301 3.28296 8.10061C3.50951 7.9382 3.68359 7.71307 3.78333 7.45278C3.89432 7.20149 3.9274 6.92264 3.87825 6.65215C3.8291 6.38166 3.69991 6.1324 3.50833 5.93611L3.45833 5.88611C3.30381 5.73162 3.18092 5.54783 3.09686 5.34522C3.0128 5.14262 2.9693 4.92523 2.9693 4.70556C2.9693 4.48589 3.0128 4.26849 3.09686 4.06589C3.18092 3.86329 3.30381 3.67949 3.45833 3.525C3.61283 3.37047 3.79662 3.24758 3.99922 3.16352C4.20183 3.07946 4.41922 3.03597 4.63889 3.03597C4.85856 3.03597 5.07595 3.07946 5.27856 3.16352C5.48116 3.24758 5.66495 3.37047 5.81944 3.525L5.86944 3.575C6.06573 3.76658 6.31499 3.89576 6.58548 3.94492C6.85597 3.99407 7.13482 3.96098 7.38611 3.85H7.45C7.69657 3.74461 7.90759 3.569 8.05778 3.34465C8.20797 3.1203 8.29129 2.85679 8.29722 2.58611V2.43333C8.29722 1.99125 8.47285 1.56742 8.78541 1.25486C9.09797 0.942301 9.5218 0.766668 9.96389 0.766668C10.406 0.766668 10.8298 0.942301 11.1424 1.25486C11.4549 1.56742 11.6306 1.99125 11.6306 2.43333V2.50833C11.6365 2.77902 11.7198 3.04253 11.87 3.26688C12.0202 3.49123 12.2312 3.66684 12.4778 3.77222C12.7291 3.88321 13.0079 3.91629 13.2784 3.86714C13.5489 3.81799 13.7982 3.6888 13.9944 3.49722L14.0444 3.44722C14.1989 3.2927 14.3827 3.16981 14.5853 3.08575C14.7879 3.00169 15.0053 2.95819 15.225 2.95819C15.4447 2.95819 15.6621 3.00169 15.8647 3.08575C16.0673 3.16981 16.2511 3.2927 16.4056 3.44722C16.5601 3.60172 16.683 3.78551 16.7671 3.98811C16.8511 4.19072 16.8946 4.40811 16.8946 4.62778C16.8946 4.84745 16.8511 5.06484 16.7671 5.26744C16.683 5.47005 16.5601 5.65384 16.4056 5.80833L16.3556 5.85833C16.164 6.05462 16.0348 6.30388 15.9856 6.57437C15.9365 6.84486 15.9696 7.12371 16.0806 7.375V7.43889C16.186 7.68547 16.3616 7.89649 16.5859 8.04668C16.8103 8.19687 17.0738 8.28019 17.3444 8.28611H17.5C17.9421 8.28611 18.3659 8.46175 18.6785 8.77431C18.9911 9.08686 19.1667 9.5107 19.1667 9.95278C19.1667 10.3949 18.9911 10.8187 18.6785 11.1313C18.3659 11.4438 17.9421 11.6194 17.5 11.6194H17.425C17.1543 11.6254 16.8908 11.7087 16.6665 11.8589C16.4421 12.0091 16.2665 12.2201 16.1611 12.4667V12.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* User avatar with initials */}
        <div className={styles.avatar}>{getUserInitials()}</div>
      </button>

      {isOpen && (
        <div className={styles.menu} role="menu">
          <button
            className={styles.menuItem}
            onClick={handleProfileClick}
            role="menuitem"
          >
            <span className={styles.menuItemIcon}>👤</span>
            Go to Profile
          </button>
          <button
            className={styles.menuItem}
            onClick={handleSettingsClick}
            role="menuitem"
          >
            <span className={styles.menuItemIcon}>⚙️</span>
            Settings
          </button>
          <hr className={styles.divider} />
          <button
            className={styles.menuItem}
            onClick={handleLogoutClick}
            role="menuitem"
          >
            <span className={styles.menuItemIcon}>🚪</span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};
