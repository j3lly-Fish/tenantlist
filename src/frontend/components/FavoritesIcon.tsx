import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './FavoritesIcon.module.css';

/**
 * FavoritesIcon Component
 *
 * Heart icon button for accessing favorites/saved items
 * - Navigates to /favorites on click
 * - Active state when on favorites page
 * - Consistent styling with other navigation icons
 */
export const FavoritesIcon: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith('/favorites');

  const handleClick = () => {
    navigate('/favorites');
  };

  return (
    <button
      className={`${styles.favoritesIcon} ${isActive ? styles.active : ''}`}
      onClick={handleClick}
      aria-label="Favorites"
      data-testid="favorites-icon"
    >
      {/* Heart icon */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20.84 4.61C20.3292 4.09924 19.7228 3.69397 19.0554 3.41708C18.3879 3.14019 17.6725 2.99725 16.95 2.99725C16.2275 2.99725 15.5121 3.14019 14.8446 3.41708C14.1772 3.69397 13.5708 4.09924 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99779 7.05 2.99779C5.59096 2.99779 4.19169 3.57831 3.16 4.61C2.1283 5.6417 1.54778 7.04097 1.54778 8.5C1.54778 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.3508 11.8792 21.756 11.2728 22.0329 10.6054C22.3098 9.93789 22.4528 9.22249 22.4528 8.5C22.4528 7.77751 22.3098 7.0621 22.0329 6.39464C21.756 5.72718 21.3508 5.12075 20.84 4.61Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
