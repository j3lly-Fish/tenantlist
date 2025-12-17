import React, { useState } from 'react';
import styles from './LocationPreviewModal.module.css';

interface LocationPreviewData {
  businessName: string;
  city: string;
  state: string;
  assetType: string;
  sqftMin: string;
  sqftMax: string;
  lotSize: string;
  startDate: string;
  durationType: string;
  budgetMin: string;
  budgetMax: string;
  description: string;
  additionalFeatures: string[];
  isCorporateLocation: boolean;
}

interface LocationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onPost: () => void;
  isLoading: boolean;
  data: LocationPreviewData;
}

export const LocationPreviewModal: React.FC<LocationPreviewModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  onPost,
  isLoading,
  data,
}) => {
  const [stealthMode, setStealthMode] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format budget display
  const formatBudget = () => {
    if (data.budgetMin && data.budgetMax) {
      return `$${parseInt(data.budgetMin).toLocaleString()} - $${parseInt(data.budgetMax).toLocaleString()}`;
    } else if (data.budgetMin) {
      return `$${parseInt(data.budgetMin).toLocaleString()}+`;
    } else if (data.budgetMax) {
      return `Up to $${parseInt(data.budgetMax).toLocaleString()}`;
    }
    return 'Not specified';
  };

  // Format sqft display
  const formatSqft = () => {
    if (data.sqftMin && data.sqftMax) {
      return `${parseInt(data.sqftMin).toLocaleString()} - ${parseInt(data.sqftMax).toLocaleString()}`;
    }
    return 'Not specified';
  };

  // Format date display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not specified';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Placeholder images for gallery
  const placeholderImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=300&h=200&fit=crop',
  ];

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={styles.modalContainer}>
        {/* Header Image */}
        <div className={styles.headerImage}>
          <img
            src={placeholderImages[0]}
            alt="Location preview"
            className={styles.coverImage}
          />
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Business Info */}
          <div className={styles.businessHeader}>
            <div className={styles.businessAvatar}>
              {data.businessName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.businessInfo}>
              <h2 className={styles.businessName}>{data.businessName}</h2>
              <div className={styles.businessMeta}>
                <span className={styles.category}>{data.assetType}</span>
                <span className={styles.separator}>•</span>
                <span className={styles.employees}>24+</span>
              </div>
            </div>
            <div className={styles.socialLinks}>
              <button className={styles.socialButton} aria-label="Website">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </button>
              <button className={styles.socialButton} aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Description */}
          <p className={styles.description}>
            {data.description || `Looking for commercial space in ${data.city}, ${data.state}. Seeking ${formatSqft()} sqft for ${data.assetType.toLowerCase()} use.`}
          </p>

          {/* Image Gallery */}
          <div className={styles.imageGallery}>
            {placeholderImages.map((img, idx) => (
              <div key={idx} className={styles.galleryImage}>
                <img src={img} alt={`Preview ${idx + 1}`} />
              </div>
            ))}
          </div>

          {/* Documents Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Documents</h3>
            <div className={styles.documents}>
              <div className={styles.document}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Business</span>
              </div>
              <div className={styles.document}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>ExistingFloorPlans</span>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Location</h3>
            <div className={styles.locationContent}>
              <div className={styles.locationMap}>
                <div className={styles.mapPlaceholder}>
                  <span>Map</span>
                </div>
              </div>
              <div className={styles.locationList}>
                <div className={styles.locationItem}>
                  <span className={styles.locationDot}></span>
                  {data.city}, {data.state}
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Asset</span>
              <span className={styles.detailValue}>{data.assetType}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Sqft</span>
              <span className={styles.detailValue}>{formatSqft()}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Lot Size (Acres)</span>
              <span className={styles.detailValue}>{data.lotSize || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Target move-in date</span>
              <span className={styles.detailValue}>{formatDate(data.startDate)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Preferred Lease Term</span>
              <span className={styles.detailValue}>{data.durationType || 'Not specified'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Monthly Budget</span>
              <span className={styles.detailValue}>{formatBudget()}</span>
            </div>
          </div>

          {/* Additional Features */}
          {data.additionalFeatures.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Additional Features</h3>
              <div className={styles.featuresList}>
                {data.additionalFeatures.map((feature, idx) => (
                  <span key={idx} className={styles.featureTag}>
                    • {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Invite Team Members */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Invite team members</h3>
            <div className={styles.teamSection}>
              <div className={styles.searchInput}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Find brokers, managers, and more" />
              </div>
              <div className={styles.teamMembers}>
                <div className={styles.teamMember}>
                  <div className={styles.memberAvatar}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </div>
                  <span className={styles.memberName}>Invite Team</span>
                  <span className={styles.memberRole}>Select role</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stealth Mode */}
          <div className={styles.stealthSection}>
            <div className={styles.stealthHeader}>
              <div className={styles.stealthIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className={styles.stealthTitle}>Stealth Mode</span>
              <div className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={stealthMode}
                  onChange={(e) => setStealthMode(e.target.checked)}
                />
                <span className={styles.toggleSlider}></span>
              </div>
            </div>
            <p className={styles.stealthDescription}>
              For tenants who want to keep expansion plans confidential, hide your business name, links, socials, and images.
            </p>
            <p className={styles.stealthNote}>Make this location private</p>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onEdit}
              className={styles.editButton}
              disabled={isLoading}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onPost}
              className={styles.postButton}
              disabled={isLoading}
            >
              {isLoading ? 'Posting...' : 'Post Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
