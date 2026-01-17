import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Business } from '@types';
import { getBusiness, updateBusiness, searchBrokers, inviteBrokers } from '@utils/apiClient';
import styles from './PublicProfileEdit.module.css';

interface BrokerSearchResult {
  id: string;
  name: string;
  email: string;
  company_name?: string;
  photo_url?: string;
}

/**
 * PublicProfileEdit Page
 *
 * Shows the business profile as it will appear to brokers/landlords
 * with inline editing capabilities for each section.
 * Includes integrated broker invitation functionality.
 */
const PublicProfileEdit: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Business data
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states for each section
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  // Form values
  const [aboutText, setAboutText] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Array<{ name: string; url: string; size?: number }>>([]);

  // Location fields
  const [locationData, setLocationData] = useState({
    asset: '',
    monthly_budget: { min: 0, max: 0 },
    target_move_date: '',
    sqft: { min: 0, max: 0 },
  });

  // Broker invitation
  const [searchQuery, setSearchQuery] = useState('');
  const [brokerSearchResults, setBrokerSearchResults] = useState<BrokerSearchResult[]>([]);
  const [invitedBrokers, setInvitedBrokers] = useState<BrokerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Load business data
  useEffect(() => {
    const loadBusiness = async () => {
      if (!businessId) return;

      try {
        setLoading(true);
        const data = await getBusiness(businessId);
        setBusiness(data);

        // Initialize form values
        setAboutText(data.description || '');
        setCoverImage(data.cover_image_url || null);
        setLogoImage(data.logo_url || null);
        setGalleryImages(data.gallery_images || []);
        setDocuments(data.public_documents || []);
      } catch (error) {
        console.error('Failed to load business:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [businessId]);

  // Search brokers with debounce
  useEffect(() => {
    const searchBrokersDebounced = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setBrokerSearchResults([]);
        return;
      }

      try {
        setSearching(true);
        const results = await searchBrokers(searchQuery);
        setBrokerSearchResults(results);
      } catch (error) {
        console.error('Broker search failed:', error);
        setBrokerSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchBrokersDebounced);
  }, [searchQuery]);

  // Handle back navigation
  const handleBack = () => {
    navigate(`/business/${businessId}`);
  };

  // Save about section
  const handleSaveAbout = async () => {
    if (!businessId) return;

    try {
      await updateBusiness(businessId, {
        description: aboutText,
      });
      setEditingAbout(false);
    } catch (error) {
      console.error('Failed to update about section:', error);
    }
  };

  // Handle cover image upload
  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setCoverImage(base64);

      try {
        await updateBusiness(businessId, {
          cover_image_url: base64,
        });
      } catch (error) {
        console.error('Failed to update cover image:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle logo upload
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setLogoImage(base64);

      try {
        await updateBusiness(businessId, {
          logo_url: base64,
        });
      } catch (error) {
        console.error('Failed to update logo:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle gallery image upload
  const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const newImages = [...galleryImages, base64];
      setGalleryImages(newImages);

      try {
        await updateBusiness(businessId, {
          gallery_images: newImages,
        });
      } catch (error) {
        console.error('Failed to add gallery image:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle remove gallery image
  const handleRemoveGalleryImage = async (index: number) => {
    if (!businessId) return;

    const newImages = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(newImages);

    try {
      await updateBusiness(businessId, {
        gallery_images: newImages,
      });
    } catch (error) {
      console.error('Failed to remove gallery image:', error);
    }
  };

  // Handle document upload
  const handleAddDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const newDoc = {
        name: file.name,
        url: base64,
        size: file.size,
      };
      const newDocuments = [...documents, newDoc];
      setDocuments(newDocuments);

      try {
        await updateBusiness(businessId, {
          public_documents: newDocuments,
        });
      } catch (error) {
        console.error('Failed to add document:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle remove document
  const handleRemoveDocument = async (index: number) => {
    if (!businessId) return;

    const newDocuments = documents.filter((_, i) => i !== index);
    setDocuments(newDocuments);

    try {
      await updateBusiness(businessId, {
        public_documents: newDocuments,
      });
    } catch (error) {
      console.error('Failed to remove document:', error);
    }
  };

  // Handle save location
  const handleSaveLocation = async () => {
    if (!businessId) return;

    try {
      // Update location data (this would typically update a demand listing)
      // For now, we'll just close the edit mode
      setEditingLocation(false);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  // Handle add broker to invite list
  const handleAddBroker = (broker: BrokerSearchResult) => {
    if (!invitedBrokers.find(b => b.id === broker.id)) {
      setInvitedBrokers([...invitedBrokers, broker]);
    }
    setBrokerSearchResults([]);
    setSearchQuery('');
  };

  // Handle remove broker from invite list
  const handleRemoveBroker = (brokerId: string) => {
    setInvitedBrokers(invitedBrokers.filter(b => b.id !== brokerId));
  };

  // Handle send invitations
  const handleSendInvitations = async () => {
    if (!businessId || invitedBrokers.length === 0) return;

    try {
      const brokerIds = invitedBrokers.map(b => b.id);
      await inviteBrokers(businessId, brokerIds);
      setInvitedBrokers([]);
      alert('Invitations sent successfully!');
    } catch (error) {
      console.error('Failed to send invitations:', error);
      alert('Failed to send invitations. Please try again.');
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading business profile...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Business not found</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button onClick={handleBack} className={styles.backButton}>
            <span className={styles.backIcon}>←</span>
            Back
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className={styles.profileContent}>
        <div className={styles.profileCard}>
          {/* Header Image */}
          <div
            className={styles.headerSection}
            style={coverImage ? { backgroundImage: `url(${coverImage})` } : {}}
          >
            {!coverImage && (
              <div className={styles.headerImagePlaceholder}>
                Upload a cover image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className={styles.hiddenFileInput}
              id="cover-image-upload"
            />
            <label htmlFor="cover-image-upload" className={styles.headerEditButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              Edit Cover
            </label>
          </div>

          {/* Business Info */}
          <div className={styles.businessInfo}>
            <div className={styles.logoContainer}>
              {logoImage ? (
                <img src={logoImage} alt={business.name} className={styles.logo} />
              ) : (
                <div className={styles.logoPlaceholder}>
                  {getInitials(business.name)}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className={styles.hiddenFileInput}
                id="logo-upload"
              />
              <label htmlFor="logo-upload" className={styles.logoEditButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </label>
            </div>

            <div className={styles.businessDetails}>
              <h1 className={styles.businessName}>{business.name}</h1>
              <div className={styles.businessMeta}>
                <div className={styles.metaItem}>
                  <span>📍</span>
                  <span>{business.category}</span>
                </div>
                <div className={styles.metaItem}>
                  <span>💳</span>
                  <span>Verified</span>
                </div>
                <div className={styles.metaItem}>
                  <span>📅</span>
                  <span>40,000 SQF</span>
                </div>
                <div className={styles.ratingContainer}>
                  <span className={styles.rating}>4.5 ⭐</span>
                  <span className={styles.ratingCount}>(25k reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>About</h2>
              {!editingAbout && (
                <button
                  onClick={() => setEditingAbout(true)}
                  className={styles.editButton}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </button>
              )}
            </div>
            {editingAbout ? (
              <>
                <textarea
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  className={styles.aboutTextarea}
                  placeholder="Describe your business..."
                  maxLength={1000}
                />
                <div className={styles.locationActions}>
                  <button
                    onClick={() => {
                      setAboutText(business.description || '');
                      setEditingAbout(false);
                    }}
                    className={`${styles.actionButton} ${styles.cancelButton}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAbout}
                    className={`${styles.actionButton} ${styles.saveButton}`}
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.sectionContent}>
                {aboutText || (
                  <span className={styles.emptyState}>
                    No description yet. Click edit to add one.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Images Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Images</h2>
            </div>
            <div className={styles.imagesGrid}>
              {galleryImages.map((image, index) => (
                <div key={index} className={styles.imageCard}>
                  <img src={image} alt={`Gallery ${index + 1}`} />
                  <div className={styles.imageOverlay}>
                    <button
                      onClick={() => handleRemoveGalleryImage(index)}
                      className={styles.imageDeleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {galleryImages.length < 6 && (
                <label className={styles.addImageCard}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddGalleryImage}
                    className={styles.hiddenFileInput}
                  />
                  <div className={styles.addImageIcon}>📷</div>
                  <div className={styles.addImageText}>Add Image</div>
                </label>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Documents</h2>
            </div>
            <div className={styles.documentsList}>
              {documents.map((doc, index) => (
                <div key={index} className={styles.documentItem}>
                  <div className={styles.documentIcon}>📄</div>
                  <div className={styles.documentInfo}>
                    <div className={styles.documentName}>{doc.name}</div>
                    <div className={styles.documentSize}>{formatFileSize(doc.size)}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveDocument(index)}
                    className={styles.documentDeleteButton}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label className={styles.addDocumentButton}>
                <input
                  type="file"
                  onChange={handleAddDocument}
                  className={styles.hiddenFileInput}
                />
                + Add Document
              </label>
            </div>
          </div>

          {/* Location Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Location</h2>
              {!editingLocation && (
                <button
                  onClick={() => setEditingLocation(true)}
                  className={styles.editButton}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </button>
              )}
            </div>
            <div className={styles.locationMap}>
              {/* Google Maps would go here */}
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                Map View
              </div>
            </div>
            {editingLocation ? (
              <>
                <div className={styles.locationGrid}>
                  <div className={styles.locationField}>
                    <label className={styles.locationLabel}>Asset</label>
                    <select
                      value={locationData.asset}
                      onChange={(e) => setLocationData({ ...locationData, asset: e.target.value })}
                      className={styles.locationSelect}
                    >
                      <option value="">Select asset type</option>
                      <option value="office">Office</option>
                      <option value="retail">Retail</option>
                      <option value="industrial">Industrial</option>
                    </select>
                  </div>
                  <div className={styles.locationField}>
                    <label className={styles.locationLabel}>Monthly Budget</label>
                    <input
                      type="text"
                      value={`$${locationData.monthly_budget.min} - $${locationData.monthly_budget.max}`}
                      className={styles.locationInput}
                      readOnly
                    />
                  </div>
                  <div className={styles.locationField}>
                    <label className={styles.locationLabel}>Preferred Lease Term</label>
                    <input
                      type="text"
                      placeholder="3-5 Years"
                      className={styles.locationInput}
                    />
                  </div>
                  <div className={styles.locationField}>
                    <label className={styles.locationLabel}>Ideal Sq Ft (acres)</label>
                    <input
                      type="text"
                      value={`${locationData.sqft.min} - ${locationData.sqft.max}`}
                      className={styles.locationInput}
                      readOnly
                    />
                  </div>
                  <div className={styles.locationField}>
                    <label className={styles.locationLabel}>Target Move In Date</label>
                    <input
                      type="date"
                      value={locationData.target_move_date}
                      onChange={(e) => setLocationData({ ...locationData, target_move_date: e.target.value })}
                      className={styles.locationInput}
                    />
                  </div>
                  <div className={styles.locationField}>
                    <label className={styles.locationLabel}>Lot size Sq Ft (acres)</label>
                    <input
                      type="text"
                      placeholder="Min - Max"
                      className={styles.locationInput}
                    />
                  </div>
                </div>
                <div className={styles.locationActions}>
                  <button
                    onClick={() => setEditingLocation(false)}
                    className={`${styles.actionButton} ${styles.cancelButton}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveLocation}
                    className={`${styles.actionButton} ${styles.saveButton}`}
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.locationGrid}>
                <div className={styles.locationField}>
                  <span className={styles.locationLabel}>Asset</span>
                  <span className={styles.locationValue}>{locationData.asset || 'Not set'}</span>
                </div>
                <div className={styles.locationField}>
                  <span className={styles.locationLabel}>Monthly Budget</span>
                  <span className={styles.locationValue}>
                    ${locationData.monthly_budget.min} - ${locationData.monthly_budget.max}
                  </span>
                </div>
                <div className={styles.locationField}>
                  <span className={styles.locationLabel}>Preferred Lease Term</span>
                  <span className={styles.locationValue}>3-5 Years</span>
                </div>
                <div className={styles.locationField}>
                  <span className={styles.locationLabel}>Ideal Sq Ft</span>
                  <span className={styles.locationValue}>
                    {locationData.sqft.min} - {locationData.sqft.max}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Invite Team Members Section */}
          <div className={`${styles.section} ${styles.inviteSection}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Invite team members</h2>
            </div>
            <div className={styles.searchContainer}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find brokers, managers, landlords and more"
                className={styles.searchInput}
              />
              <span className={styles.searchIcon}>🔍</span>

              {/* Search results dropdown */}
              {searchQuery.trim().length >= 2 && (
                <div className={styles.searchResults}>
                  {searching ? (
                    <div className={styles.searchLoading}>Searching...</div>
                  ) : brokerSearchResults.length > 0 ? (
                    brokerSearchResults.map((broker) => (
                      <div
                        key={broker.id}
                        onClick={() => handleAddBroker(broker)}
                        className={styles.searchResultItem}
                      >
                        <div className={styles.searchResultAvatar}>
                          {broker.photo_url ? (
                            <img src={broker.photo_url} alt={broker.name} />
                          ) : (
                            getInitials(broker.name)
                          )}
                        </div>
                        <div className={styles.searchResultInfo}>
                          <div className={styles.searchResultName}>{broker.name}</div>
                          <div className={styles.searchResultEmail}>{broker.email}</div>
                          {broker.company_name && (
                            <div className={styles.searchResultCompany}>{broker.company_name}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.searchNoResults}>
                      No brokers found. Try a different search term.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.invitedList}>
              {/* Invite placeholder card */}
              <div
                className={styles.invitePlaceholder}
                onClick={() => searchInputRef.current?.focus()}
              >
                <div className={styles.placeholderAvatar}>
                  <div className={styles.placeholderIcon}>+</div>
                </div>
                <div className={styles.placeholderText}>Invite Team</div>
                <div className={styles.placeholderRole}>Select role</div>
              </div>

              {/* Invited brokers */}
              {invitedBrokers.map((broker) => (
                <div key={broker.id} className={styles.invitedMember}>
                  <div className={styles.memberAvatar}>
                    {broker.photo_url ? (
                      <img src={broker.photo_url} alt={broker.name} />
                    ) : (
                      getInitials(broker.name)
                    )}
                    <button
                      onClick={() => handleRemoveBroker(broker.id)}
                      className={styles.removeBadge}
                    >
                      ✕
                    </button>
                  </div>
                  <div className={styles.memberName}>{broker.name}</div>
                  <div className={styles.memberRole}>Broker</div>
                </div>
              ))}
            </div>
            {invitedBrokers.length > 0 && (
              <div className={styles.locationActions} style={{ marginTop: '16px' }}>
                <button
                  onClick={handleSendInvitations}
                  className={`${styles.actionButton} ${styles.saveButton}`}
                >
                  Send Invitations
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfileEdit;
