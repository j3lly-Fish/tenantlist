import React, { useState, useEffect, useRef } from 'react';
import { Business } from '../../types';
import styles from './EditBusinessModal.module.css';

interface EditBusinessModalProps {
  isOpen: boolean;
  business: Business | null;
  onClose: () => void;
  onSave: (businessId: string, data: Partial<Business>) => Promise<void>;
}

// Reusable DropZone component for file uploads
interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
}

const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  accept,
  multiple = false,
  children,
  className = '',
  activeClassName = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(multiple ? files : [files[0]]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div
      className={`${className} ${isDragging ? activeClassName : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {children}
    </div>
  );
};

export const EditBusinessModal: React.FC<EditBusinessModalProps> = ({
  isOpen,
  business,
  onClose,
  onSave,
}) => {
  // Active tab state
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'documents'>('basic');

  // Form state - Basic Info
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState('');

  // Form state - Media
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Form state - Documents
  const [publicDocuments, setPublicDocuments] = useState<Array<{ name: string; url: string; size?: number }>>([]);
  const [privateCredentials, setPrivateCredentials] = useState<Array<{ name: string; url: string; size?: number }>>([]);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form when business changes
  useEffect(() => {
    if (business) {
      setName(business.name || '');
      setCategory(business.category || '');
      setLogoPreview(business.logo_url || null);
      setWebsite(business.website_url || '');
      setInstagram(business.instagram_url || '');
      setLinkedin(business.linkedin_url || '');
      setEmail(business.email || '');
      setPhone(business.phone || '');
      setLocations(business.locations || []);
      setCoverImageUrl(business.cover_image_url || null);
      setDescription(business.description || '');
      setGalleryImages(business.gallery_images || []);
      setPublicDocuments(business.public_documents || []);
      setPrivateCredentials(business.private_credentials || []);
      setErrors({});
      setActiveTab('basic');
    }
  }, [business]);

  if (!isOpen || !business) return null;

  const industryOptions = [
    { value: 'food_beverage', label: 'Food & Beverage' },
    { value: 'retail', label: 'Retail' },
    { value: 'office', label: 'Office' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'beauty_wellness', label: 'Beauty & Wellness' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'financial_services', label: 'Financial Services' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Business name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Business name must be less than 100 characters';
    }

    if (!category) {
      newErrors.category = 'Please select an industry';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle logo upload
  const handleLogoUpload = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, general: 'Please select a JPG, PNG, GIF, or WebP image' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, general: 'Logo must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
      setErrors((prev) => ({ ...prev, general: '' }));
    };
    reader.readAsDataURL(file);
  };

  // Handle cover image upload
  const handleCoverUpload = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, general: 'Please select a JPG, PNG, GIF, or WebP image' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, general: 'Cover image must be less than 10MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImageUrl(reader.result as string);
      setErrors((prev) => ({ ...prev, general: '' }));
    };
    reader.readAsDataURL(file);
  };

  // Handle gallery image upload
  const handleGalleryUpload = (files: File[]) => {
    if (galleryImages.length >= 6) {
      setErrors({ ...errors, general: 'Maximum 6 gallery images allowed' });
      return;
    }

    const file = files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, general: 'Please select a JPG, PNG, GIF, or WebP image' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, general: 'Gallery images must be less than 10MB each' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGalleryImages((prev) => [...prev, reader.result as string]);
      setErrors((prev) => ({ ...prev, general: '' }));
    };
    reader.readAsDataURL(file);
  };

  // Handle document upload
  const handleDocumentUpload = (files: File[], isPrivate: boolean) => {
    const file = files[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, general: 'Please select a PDF, JPG, or PNG file' });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrors({ ...errors, general: 'Documents must be less than 25MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const doc = { name: file.name, url: reader.result as string, size: file.size };
      if (isPrivate) {
        setPrivateCredentials((prev) => [...prev, doc]);
      } else {
        setPublicDocuments((prev) => [...prev, doc]);
      }
      setErrors((prev) => ({ ...prev, general: '' }));
    };
    reader.readAsDataURL(file);
  };

  // Add location
  const handleAddLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations((prev) => [...prev, newLocation.trim()]);
      setNewLocation('');
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setActiveTab('basic');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await onSave(business.id, {
        name: name.trim(),
        category,
        logo_url: logoPreview,
        website_url: website.trim() || null,
        instagram_url: instagram.trim() || null,
        linkedin_url: linkedin.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        locations,
        cover_image_url: coverImageUrl,
        description: description.trim() || null,
        gallery_images: galleryImages,
        public_documents: publicDocuments,
        private_credentials: privateCredentials,
      });
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred while updating business' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Edit Business Profile</h2>
            <p className={styles.modalSubtitle}>Update your business information</p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'basic' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'media' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('media')}
          >
            Media
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'documents' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          {/* Error message */}
          {errors.general && (
            <div className={styles.errorMessage} role="alert">
              {errors.general}
            </div>
          )}

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className={styles.tabContent}>
              {/* Logo Section */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Business Logo</label>
                <div className={styles.logoSection}>
                  <DropZone
                    onFilesSelected={handleLogoUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className={styles.logoDropZone}
                    activeClassName={styles.dropZoneActive}
                  >
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo" className={styles.logoImage} />
                        <button
                          type="button"
                          className={styles.removeImageButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogoPreview(null);
                          }}
                        >
                          &times;
                        </button>
                      </>
                    ) : (
                      <div className={styles.logoPlaceholder}>
                        <span className={styles.placeholderIcon}>+</span>
                        <span className={styles.placeholderText}>Upload Logo</span>
                      </div>
                    )}
                  </DropZone>
                </div>
              </div>

              {/* Business Name */}
              <div className={styles.formGroup}>
                <label htmlFor="edit-business-name" className={styles.label}>
                  Business Name <span className={styles.required}>*</span>
                </label>
                <input
                  id="edit-business-name"
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter business name"
                  maxLength={100}
                />
                {errors.name && <p className={styles.errorText}>{errors.name}</p>}
              </div>

              {/* Industry/Category */}
              <div className={styles.formGroup}>
                <label htmlFor="edit-category" className={styles.label}>
                  Industry <span className={styles.required}>*</span>
                </label>
                <select
                  id="edit-category"
                  className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select industry</option>
                  {industryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className={styles.errorText}>{errors.category}</p>}
              </div>

              {/* Locations */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Target Locations</label>
                <div className={styles.locationInputRow}>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                    className={styles.input}
                    placeholder="Add city or region"
                  />
                  <button
                    type="button"
                    onClick={handleAddLocation}
                    className={styles.addButton}
                    disabled={!newLocation.trim()}
                  >
                    Add
                  </button>
                </div>
                {locations.length > 0 && (
                  <div className={styles.locationTags}>
                    {locations.map((loc) => (
                      <span key={loc} className={styles.locationTag}>
                        {loc}
                        <button
                          type="button"
                          onClick={() => setLocations((prev) => prev.filter((l) => l !== loc))}
                          className={styles.removeTagButton}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className={styles.fieldRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="business@example.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={styles.input}
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={styles.input}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Instagram</label>
                  <input
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className={styles.input}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>LinkedIn</label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className={styles.input}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className={styles.tabContent}>
              {/* Cover Image */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Cover Image</label>
                <p className={styles.hint}>This image will be displayed at the top of your profile</p>
                <DropZone
                  onFilesSelected={handleCoverUpload}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className={styles.coverDropZone}
                  activeClassName={styles.dropZoneActive}
                >
                  {coverImageUrl ? (
                    <div className={styles.coverPreview}>
                      <img src={coverImageUrl} alt="Cover" className={styles.coverImage} />
                      <button
                        type="button"
                        className={styles.removeCoverButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverImageUrl(null);
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <div className={styles.coverPlaceholder}>
                      <span className={styles.placeholderIcon}>🖼️</span>
                      <span className={styles.placeholderText}>Click or drag to upload cover image</span>
                      <span className={styles.placeholderHint}>Recommended: 1200x400px</span>
                    </div>
                  )}
                </DropZone>
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Business Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.textarea}
                  rows={4}
                  placeholder="Tell landlords about your business..."
                  maxLength={1000}
                />
                <span className={styles.charCount}>{description.length}/1000</span>
              </div>

              {/* Gallery */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Photo Gallery</label>
                <p className={styles.hint}>Add up to 6 photos of your business</p>
                <div className={styles.galleryGrid}>
                  {galleryImages.map((img, index) => (
                    <div key={index} className={styles.galleryItem}>
                      <img src={img} alt={`Gallery ${index + 1}`} className={styles.galleryImage} />
                      <button
                        type="button"
                        className={styles.removeGalleryButton}
                        onClick={() => setGalleryImages((prev) => prev.filter((_, i) => i !== index))}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {galleryImages.length < 6 && (
                    <DropZone
                      onFilesSelected={handleGalleryUpload}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className={styles.galleryPlaceholder}
                      activeClassName={styles.dropZoneActive}
                    >
                      <span className={styles.galleryPlaceholderIcon}>+</span>
                      <span className={styles.galleryPlaceholderText}>Add Photo</span>
                    </DropZone>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className={styles.tabContent}>
              {/* Public Documents */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Public Documents</label>
                <p className={styles.hint}>Documents visible to landlords (e.g., leasing flyer, floor plans)</p>
                {publicDocuments.length > 0 && (
                  <div className={styles.documentList}>
                    {publicDocuments.map((doc, index) => (
                      <div key={index} className={styles.documentItem}>
                        <span className={styles.documentIcon}>📄</span>
                        <div className={styles.documentInfo}>
                          <span className={styles.documentName}>{doc.name}</span>
                          {doc.size && <span className={styles.documentSize}>{formatFileSize(doc.size)}</span>}
                        </div>
                        <button
                          type="button"
                          className={styles.removeDocButton}
                          onClick={() => setPublicDocuments((prev) => prev.filter((_, i) => i !== index))}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <DropZone
                  onFilesSelected={(files) => handleDocumentUpload(files, false)}
                  accept="application/pdf,image/jpeg,image/png"
                  className={styles.documentDropZone}
                  activeClassName={styles.dropZoneActive}
                >
                  <span className={styles.uploadIcon}>+</span>
                  <span className={styles.uploadText}>Add Document</span>
                  <span className={styles.uploadHint}>PDF, JPG, PNG up to 25MB</span>
                </DropZone>
              </div>

              {/* Private Credentials */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Private Credentials</label>
                <p className={styles.hint}>Confidential documents only shared with verified landlords</p>
                {privateCredentials.length > 0 && (
                  <div className={styles.documentList}>
                    {privateCredentials.map((doc, index) => (
                      <div key={index} className={styles.documentItem}>
                        <span className={styles.documentIcon}>🔒</span>
                        <div className={styles.documentInfo}>
                          <span className={styles.documentName}>{doc.name}</span>
                          {doc.size && <span className={styles.documentSize}>{formatFileSize(doc.size)}</span>}
                        </div>
                        <button
                          type="button"
                          className={styles.removeDocButton}
                          onClick={() => setPrivateCredentials((prev) => prev.filter((_, i) => i !== index))}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <DropZone
                  onFilesSelected={(files) => handleDocumentUpload(files, true)}
                  accept="application/pdf,image/jpeg,image/png"
                  className={styles.documentDropZone}
                  activeClassName={styles.dropZoneActive}
                >
                  <span className={styles.uploadIcon}>+</span>
                  <span className={styles.uploadText}>Add Credential</span>
                  <span className={styles.uploadHint}>PDF, JPG, PNG up to 25MB</span>
                </DropZone>

                <div className={styles.credentialSuggestions}>
                  <p className={styles.suggestionsTitle}>Suggested documents:</p>
                  <ul className={styles.suggestionsList}>
                    <li>Business licenses & permits</li>
                    <li>Financial statements</li>
                    <li>Insurance certificates</li>
                    <li>Letters of intent</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
