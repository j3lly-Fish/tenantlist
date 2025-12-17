import React from 'react';
import styles from './CategoryBadge.module.css';

interface CategoryBadgeProps {
  category: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  return (
    <span
      className={styles.categoryBadge}
      role="text"
      aria-label={`Category: ${category}`}
    >
      {category}
    </span>
  );
};
