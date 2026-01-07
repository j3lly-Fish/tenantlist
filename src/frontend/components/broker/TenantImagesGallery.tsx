import React, { useState } from 'react';
import styles from './TenantImagesGallery.module.css';

interface TenantImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface TenantImagesGalleryProps {
  images: TenantImage[];
  tenantName: string;
}

/**
 * TenantImagesGallery Component
 *
 * Displays image gallery in 2x3 grid with lightbox/modal for full view
 */
export const TenantImagesGallery: React.FC<TenantImagesGalleryProps> = ({
  images,
  tenantName,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  // Sort images by display_order
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);

  // Show first 6 images in grid
  const gridImages = sortedImages.slice(0, 6);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'ArrowLeft') goToPrevious();
  };

  return (
    <>
      <section className={styles.gallerySection}>
        <h2 className={styles.sectionTitle}>Images</h2>
        <div className={styles.gallery}>
          {gridImages.map((image, index) => (
            <div
              key={image.id}
              className={styles.imageCard}
              onClick={() => openLightbox(index)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openLightbox(index);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View image ${index + 1} of ${images.length}`}
            >
              <img
                src={image.image_url}
                alt={`${tenantName} - Image ${index + 1}`}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="16" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                }}
              />
              {index === 5 && images.length > 6 && (
                <div className={styles.moreOverlay}>
                  <span>+{images.length - 6} more</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className={styles.lightbox}
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeButton}
              onClick={closeLightbox}
              aria-label="Close gallery"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M20 8L12 16L20 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className={styles.imageWrapper}>
              <img
                src={sortedImages[currentImageIndex].image_url}
                alt={`${tenantName} - Image ${currentImageIndex + 1}`}
                className={styles.lightboxImage}
              />
              <div className={styles.imageCounter}>
                {currentImageIndex + 1} / {sortedImages.length}
              </div>
            </div>

            <button
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={goToNext}
              aria-label="Next image"
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M12 8L20 16L12 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
