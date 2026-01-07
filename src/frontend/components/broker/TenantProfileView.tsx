import React from 'react';
import { TenantAboutSection } from './TenantAboutSection';
import { TenantImagesGallery } from './TenantImagesGallery';
import { TenantDocumentsSection } from './TenantDocumentsSection';
import { TenantLocationsSection } from './TenantLocationsSection';
import styles from './TenantProfileView.module.css';
import { TenantProfileWithDetails } from '../../pages/broker/TenantProfile';

interface TenantProfileViewProps {
  profile: TenantProfileWithDetails;
}

/**
 * TenantProfileView Component
 *
 * Displays full tenant profile with:
 * - Hero section (cover, logo, name, rating, social links)
 * - About section
 * - Images gallery
 * - Documents section
 * - Locations section with map
 */
export const TenantProfileView: React.FC<TenantProfileViewProps> = ({ profile }) => {
  const formatRating = (rating: number): string => {
    return rating.toFixed(1);
  };

  return (
    <div className={styles.profileView}>
      {/* Hero Section */}
      <div className={styles.hero}>
        {/* Cover Image */}
        <div className={styles.coverImage}>
          {profile.cover_image_url ? (
            <img src={profile.cover_image_url} alt={`${profile.display_name} cover`} />
          ) : (
            <div className={styles.coverPlaceholder} />
          )}
        </div>

        {/* Logo and Info */}
        <div className={styles.heroContent}>
          <div className={styles.logoContainer}>
            <div className={styles.logoWrapper}>
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={`${profile.display_name} logo`}
                  className={styles.logo}
                />
              ) : (
                <div className={styles.logoPlaceholder}>
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              {profile.is_verified && (
                <div className={styles.verifiedBadge} aria-label="Verified tenant">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="12" fill="#1DA1F2" />
                    <path
                      d="M10.5 14.5L8 12L7 13L10.5 16.5L17 10L16 9L10.5 14.5Z"
                      fill="white"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className={styles.heroInfo}>
            <h1 className={styles.companyName}>{profile.display_name}</h1>

            {profile.category && (
              <p className={styles.category}>{profile.category}</p>
            )}

            {/* Rating */}
            <div className={styles.rating}>
              <span className={styles.ratingValue}>
                {formatRating(profile.rating)}
              </span>
              <svg
                className={styles.starIcon}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M10 0L12.9389 6.90983L20 8.09017L15 13.2361L16.1803 20.5L10 16.9098L3.81966 20.5L5 13.2361L0 8.09017L7.06107 6.90983L10 0Z"
                  fill="#FBBF24"
                />
              </svg>
              <span className={styles.reviewCount}>
                ({profile.review_count} {profile.review_count === 1 ? 'Review' : 'Reviews'})
              </span>
            </div>

            {/* Social Links */}
            <div className={styles.socialLinks}>
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  aria-label="Visit website"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM16.5 7H13.938C13.698 5.847 13.32 4.773 12.825 3.812C14.494 4.444 15.854 5.565 16.5 7ZM10 2C10.81 3.113 11.438 4.42 11.838 6H8.162C8.562 4.42 9.19 3.113 10 2ZM2.26 12C2.09 11.36 2 10.69 2 10C2 9.31 2.09 8.64 2.26 8H5.64C5.56 8.66 5.5 9.32 5.5 10C5.5 10.68 5.56 11.34 5.64 12H2.26ZM3.5 14H6.062C6.302 15.153 6.68 16.227 7.175 17.188C5.506 16.556 4.146 15.435 3.5 14ZM6.062 6H3.5C4.146 4.565 5.506 3.444 7.175 2.812C6.68 3.773 6.302 4.847 6.062 6ZM10 18C9.19 16.887 8.562 15.58 8.162 14H11.838C11.438 15.58 10.81 16.887 10 18ZM12.2 12H7.8C7.71 11.34 7.65 10.68 7.65 10C7.65 9.32 7.71 8.66 7.8 8H12.2C12.29 8.66 12.35 9.32 12.35 10C12.35 10.68 12.29 11.34 12.2 12ZM12.825 17.188C13.32 16.227 13.698 15.153 13.938 14H16.5C15.854 15.435 14.494 16.556 12.825 17.188ZM14.36 12C14.44 11.34 14.5 10.68 14.5 10C14.5 9.32 14.44 8.66 14.36 8H17.74C17.91 8.64 18 9.31 18 10C18 10.69 17.91 11.36 17.74 12H14.36Z"
                      fill="currentColor"
                    />
                  </svg>
                  Website
                </a>
              )}
              {profile.instagram_url && (
                <a
                  href={profile.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  aria-label="Visit Instagram"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 0C7.284 0 6.944 0.012 5.877 0.06C4.812 0.108 4.086 0.278 3.45 0.525C2.792 0.779 2.234 1.123 1.678 1.678C1.123 2.234 0.779 2.792 0.525 3.45C0.278 4.086 0.108 4.812 0.06 5.877C0.012 6.944 0 7.284 0 10C0 12.716 0.012 13.056 0.06 14.123C0.108 15.188 0.278 15.914 0.525 16.55C0.779 17.208 1.123 17.766 1.678 18.322C2.234 18.877 2.792 19.221 3.45 19.475C4.086 19.722 4.812 19.892 5.877 19.94C6.944 19.988 7.284 20 10 20C12.716 20 13.056 19.988 14.123 19.94C15.188 19.892 15.914 19.722 16.55 19.475C17.208 19.221 17.766 18.877 18.322 18.322C18.877 17.766 19.221 17.208 19.475 16.55C19.722 15.914 19.892 15.188 19.94 14.123C19.988 13.056 20 12.716 20 10C20 7.284 19.988 6.944 19.94 5.877C19.892 4.812 19.722 4.086 19.475 3.45C19.221 2.792 18.877 2.234 18.322 1.678C17.766 1.123 17.208 0.779 16.55 0.525C15.914 0.278 15.188 0.108 14.123 0.06C13.056 0.012 12.716 0 10 0ZM10 1.802C12.67 1.802 12.987 1.812 14.041 1.86C15.016 1.904 15.546 2.067 15.898 2.204C16.365 2.386 16.698 2.602 17.048 2.952C17.398 3.302 17.614 3.635 17.796 4.102C17.933 4.454 18.096 4.984 18.14 5.959C18.188 7.013 18.198 7.33 18.198 10C18.198 12.67 18.188 12.987 18.14 14.041C18.096 15.016 17.933 15.546 17.796 15.898C17.614 16.365 17.398 16.698 17.048 17.048C16.698 17.398 16.365 17.614 15.898 17.796C15.546 17.933 15.016 18.096 14.041 18.14C12.987 18.188 12.67 18.198 10 18.198C7.33 18.198 7.013 18.188 5.959 18.14C4.984 18.096 4.454 17.933 4.102 17.796C3.635 17.614 3.302 17.398 2.952 17.048C2.602 16.698 2.386 16.365 2.204 15.898C2.067 15.546 1.904 15.016 1.86 14.041C1.812 12.987 1.802 12.67 1.802 10C1.802 7.33 1.812 7.013 1.86 5.959C1.904 4.984 2.067 4.454 2.204 4.102C2.386 3.635 2.602 3.302 2.952 2.952C3.302 2.602 3.635 2.386 4.102 2.204C4.454 2.067 4.984 1.904 5.959 1.86C7.013 1.812 7.33 1.802 10 1.802Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10 13.333C8.159 13.333 6.667 11.841 6.667 10C6.667 8.159 8.159 6.667 10 6.667C11.841 6.667 13.333 8.159 13.333 10C13.333 11.841 11.841 13.333 10 13.333ZM10 4.865C7.164 4.865 4.865 7.164 4.865 10C4.865 12.836 7.164 15.135 10 15.135C12.836 15.135 15.135 12.836 15.135 10C15.135 7.164 12.836 4.865 10 4.865Z"
                      fill="currentColor"
                    />
                    <path
                      d="M16.538 4.662C16.538 5.324 16.001 5.861 15.339 5.861C14.677 5.861 14.14 5.324 14.14 4.662C14.14 4 14.677 3.463 15.339 3.463C16.001 3.463 16.538 4 16.538 4.662Z"
                      fill="currentColor"
                    />
                  </svg>
                  Instagram
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  aria-label="Visit LinkedIn"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M18.519 0H1.476C0.66 0 0 0.645 0 1.441V18.553C0 19.349 0.66 20 1.476 20H18.519C19.336 20 20 19.349 20 18.553V1.441C20 0.645 19.336 0 18.519 0ZM5.934 17.002H2.967V7.485H5.934V17.002ZM4.451 6.197C3.497 6.197 2.723 5.423 2.723 4.469C2.723 3.515 3.497 2.741 4.451 2.741C5.405 2.741 6.179 3.515 6.179 4.469C6.179 5.423 5.405 6.197 4.451 6.197ZM17.037 17.002H14.071V12.399C14.071 11.291 14.051 9.87 12.535 9.87C10.999 9.87 10.763 11.076 10.763 12.319V17.002H7.797V7.485H10.644V8.782H10.681C11.077 8.024 12.058 7.222 13.538 7.222C16.541 7.222 17.037 9.229 17.037 11.81V17.002Z"
                      fill="currentColor"
                    />
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className={styles.sections}>
        <TenantAboutSection about={profile.about} />
        <TenantImagesGallery images={profile.images} tenantName={profile.display_name} />
        <TenantDocumentsSection documents={profile.documents} />
        <TenantLocationsSection locations={profile.locations} />
      </div>
    </div>
  );
};
