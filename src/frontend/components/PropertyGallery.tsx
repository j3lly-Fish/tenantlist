import React, { useState } from 'react';
import styles from './PropertyGallery.module.css';

/**
 * Image/Video item for the gallery
 */
export interface GalleryItem {
  url: string;
  caption?: string;
  isVideo?: boolean;
  thumbnailUrl?: string;
}

/**
 * Props for PropertyGallery component
 */
export interface PropertyGalleryProps {
  items: GalleryItem[];
  propertyTitle: string;
}

/**
 * Play icon overlay for video thumbnails
 */
const PlayIcon: React.FC = () => (
  <div className={styles.playIconOverlay} data-testid="play-icon">
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="24" fill="rgba(0, 0, 0, 0.6)" />
      <path
        d="M32 24L20 32V16L32 24Z"
        fill="white"
      />
    </svg>
  </div>
);

/**
 * PropertyGallery Component
 *
 * Displays a property image gallery with a large hero image and thumbnail row.
 *
 * Features:
 * - Large hero image (main view)
 * - 4 thumbnails below hero
 * - Click thumbnail to change hero image
 * - Video support with play icon overlay
 * - "+N" indicator for additional images beyond 4
 */
export const PropertyGallery: React.FC<PropertyGalleryProps> = ({
  items,
  propertyTitle,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Default placeholder image
  const defaultPhotoUrl = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='%23e5e7eb'/%3E%3Ctext x='400' y='200' font-family='Arial, sans-serif' font-size='64' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3E🏢%3C/text%3E%3C/svg%3E`;

  // If no items, show placeholder
  if (!items || items.length === 0) {
    return (
      <div className={styles.propertyGallery}>
        <div className={styles.heroContainer}>
          <img
            src={defaultPhotoUrl}
            alt={propertyTitle}
            className={styles.heroImage}
          />
        </div>
      </div>
    );
  }

  const selectedItem = items[selectedIndex];
  const displayedThumbnails = items.slice(0, 4);
  const additionalCount = items.length > 4 ? items.length - 4 : 0;

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = defaultPhotoUrl;
  };

  return (
    <div className={styles.propertyGallery}>
      {/* Hero Image */}
      <div className={styles.heroContainer}>
        {selectedItem.isVideo ? (
          <div className={styles.videoContainer}>
            <video
              src={selectedItem.url}
              poster={selectedItem.thumbnailUrl}
              controls
              className={styles.heroVideo}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <img
            src={selectedItem.url}
            alt={selectedItem.caption || `${propertyTitle} - Image ${selectedIndex + 1}`}
            className={styles.heroImage}
            onError={handleImageError}
          />
        )}
        {selectedItem.caption && (
          <div className={styles.heroCaption}>{selectedItem.caption}</div>
        )}
      </div>

      {/* Thumbnail Row */}
      {items.length > 1 && (
        <div className={styles.thumbnailRow}>
          {displayedThumbnails.map((item, index) => (
            <button
              key={index}
              className={`${styles.thumbnailButton} ${
                index === selectedIndex ? styles.thumbnailActive : ''
              }`}
              onClick={() => handleThumbnailClick(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : 'false'}
            >
              <img
                src={item.isVideo ? (item.thumbnailUrl || item.url) : item.url}
                alt={item.caption || `Thumbnail ${index + 1}`}
                className={styles.thumbnailImage}
                onError={handleImageError}
              />
              {item.isVideo && <PlayIcon />}
              {/* Show +N indicator on the last visible thumbnail if there are more images */}
              {index === 3 && additionalCount > 0 && (
                <div className={styles.moreIndicator} data-testid="more-indicator">
                  +{additionalCount}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyGallery;
