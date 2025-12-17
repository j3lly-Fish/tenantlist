import React, { useState, useRef } from 'react';
import styles from './BusinessProfileStep2Modal.module.css';

interface BusinessProfileStep2ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  businessId: string;
  businessName: string;
  onComplete: () => void;
}

// Reusable drag-and-drop upload component
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(multiple ? files : [files[0]]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(multiple ? files : [files[0]]);
    }
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`${className} ${isDragging ? activeClassName : ''}`}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
      {children}
    </div>
  );
};

export const BusinessProfileStep2Modal: React.FC<BusinessProfileStep2ModalProps> = ({
  isOpen,
  onClose,
  onBack,
  businessId,
  businessName,
  onComplete,
}) => {
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [leasingFlyer, setLeasingFlyer] = useState<File | null>(null);
  const [floorPlans, setFloorPlans] = useState<File | null>(null);
  const [uploadedCredentials, setUploadedCredentials] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Validate image file
  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return false;
    }
    if (file.size > maxSize) {
      return false;
    }
    return true;
  };

  // Validate document file
  const validateDocumentFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return false;
    }
    if (file.size > maxSize) {
      return false;
    }
    return true;
  };

  // Create preview for image file
  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle cover image selection
  const handleCoverImageSelect = async (files: File[]) => {
    const file = files[0];
    if (file && validateImageFile(file)) {
      setCoverImage(file);
      const preview = await createImagePreview(file);
      setCoverPreview(preview);
      setErrors((prev) => ({ ...prev, cover: '' }));
    } else {
      setErrors((prev) => ({ ...prev, cover: 'Please select a valid image (JPG, PNG, GIF, WebP, max 10MB)' }));
    }
  };

  // Handle gallery images selection
  const handleGalleryImagesSelect = async (files: File[]) => {
    const validFiles = files.filter(validateImageFile).slice(0, 6);

    if (validFiles.length === 0) {
      setErrors((prev) => ({ ...prev, gallery: 'Please select valid images (JPG, PNG, GIF, WebP, max 10MB)' }));
      return;
    }

    if (files.length > 6) {
      setErrors((prev) => ({ ...prev, gallery: 'Maximum 6 images allowed' }));
    } else {
      setErrors((prev) => ({ ...prev, gallery: '' }));
    }

    setGalleryImages(validFiles);

    // Create previews for all valid files
    const previews = await Promise.all(validFiles.map(createImagePreview));
    setGalleryPreviews(previews);
  };

  // Handle document selection (leasing flyer, floor plans)
  const handleDocumentSelect = (
    files: File[],
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    errorKey: string
  ) => {
    const file = files[0];
    if (file && validateDocumentFile(file)) {
      setter(file);
      setErrors((prev) => ({ ...prev, [errorKey]: '' }));
    } else {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: 'Please select a valid file (PDF, DOCX, JPG, PNG, max 10MB)',
      }));
    }
  };

  // Handle credentials upload
  const handleCredentialsSelect = (files: File[]) => {
    const validFiles = files.filter(validateDocumentFile);

    if (validFiles.length === 0) {
      setErrors((prev) => ({
        ...prev,
        credentials: 'Invalid file type. Please upload PDF, DOCX, JPG, or PNG files (max 10MB).',
      }));
      return;
    }

    setUploadedCredentials((prev) => [...prev, ...validFiles]);
    setErrors((prev) => ({ ...prev, credentials: '' }));
  };

  // Remove uploaded credential
  const handleRemoveCredential = (index: number) => {
    setUploadedCredentials((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove cover image
  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCoverImage(null);
    setCoverPreview(null);
  };

  // Remove gallery image
  const handleRemoveGalleryImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove document
  const handleRemoveDocument = (
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setter(null);
  };

  // Get file icon based on type
  const getFileIcon = (file: File): string => {
    if (file.type === 'application/pdf') return '📄';
    if (file.type.startsWith('image/')) return '🖼️';
    return '📎';
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setErrors({});

    try {
      // For now, just complete the flow
      // In production, you would upload files to S3 and save metadata to database

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onComplete();
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred while creating business profile' });
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
          <h2 className={styles.modalTitle}>Create Business Profile</h2>
          <p className={styles.modalSubtitle}>2 of 2: Basic Information</p>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          {/* Cover Image Section */}
          <div className={styles.coverSection}>
            <DropZone
              onFilesSelected={handleCoverImageSelect}
              accept="image/*"
              className={styles.coverUploadArea}
              activeClassName={styles.dropZoneActive}
            >
              {coverPreview ? (
                <div className={styles.coverImageContainer}>
                  <img src={coverPreview} alt="Cover" className={styles.coverImage} />
                  <button
                    type="button"
                    className={styles.removeImageButton}
                    onClick={handleRemoveCover}
                    aria-label="Remove cover image"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className={styles.coverPlaceholder}>
                  <div className={styles.placeholderIcon}>📸</div>
                  <p className={styles.placeholderText}>Drop image here or click to upload</p>
                  <p className={styles.placeholderHint}>JPG, PNG, GIF, WebP • Max 10MB</p>
                </div>
              )}
            </DropZone>
            {errors.cover && <p className={styles.errorText}>{errors.cover}</p>}

            <div className={styles.businessInfo}>
              <div className={styles.businessHeader}>
                <h3 className={styles.businessTitle}>{businessName}</h3>
                <div className={styles.businessRating}>
                  <span className={styles.stars}>★ 4.8</span>
                  <span className={styles.reviews}>54+</span>
                </div>
              </div>

              <div className={styles.socialIcons}>
                <button type="button" className={styles.socialIcon}>🌐</button>
                <button type="button" className={styles.socialIcon}>📷</button>
                <button type="button" className={styles.socialIcon}>💼</button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={styles.section}>
            <textarea
              className={styles.description}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inspired by a healthy, outdoor lifestyle, [Business] combines fresh, upscale street food with a coastal vibe in a relaxed environment. Our specialty cocktails are crafted from fresh... view more"
              rows={3}
            />
          </div>

          {/* Gallery Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Gallery Images</h3>
            <div className={styles.galleryGrid}>
              {galleryPreviews.map((preview, index) => (
                <div key={index} className={styles.galleryItem}>
                  <img src={preview} alt={`Gallery ${index + 1}`} className={styles.galleryImage} />
                  <button
                    type="button"
                    className={styles.removeGalleryButton}
                    onClick={(e) => handleRemoveGalleryImage(index, e)}
                    aria-label={`Remove gallery image ${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {galleryPreviews.length < 6 && (
                <DropZone
                  onFilesSelected={handleGalleryImagesSelect}
                  accept="image/*"
                  multiple
                  className={styles.galleryPlaceholder}
                  activeClassName={styles.dropZoneActive}
                >
                  <span className={styles.galleryPlaceholderIcon}>📷</span>
                  <span className={styles.galleryPlaceholderText}>
                    {galleryPreviews.length === 0 ? 'Add photos' : 'Add more'}
                  </span>
                </DropZone>
              )}
            </div>
            <p className={styles.galleryHint}>Up to 6 images • JPG, PNG, GIF, WebP • Max 10MB each</p>
            {errors.gallery && <p className={styles.errorText}>{errors.gallery}</p>}
          </div>

          {/* Documents (Public) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Documents (Public)</h3>
            <div className={styles.documentRow}>
              <DropZone
                onFilesSelected={(files) => handleDocumentSelect(files, setLeasingFlyer, 'leasingFlyer')}
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                className={`${styles.documentDropZone} ${leasingFlyer ? styles.documentUploaded : ''}`}
                activeClassName={styles.dropZoneActive}
              >
                {leasingFlyer ? (
                  <div className={styles.documentContent}>
                    <span className={styles.documentIcon}>📄</span>
                    <div className={styles.documentInfo}>
                      <span className={styles.documentName}>{leasingFlyer.name}</span>
                      <span className={styles.documentSize}>{formatFileSize(leasingFlyer.size)}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.removeDocButton}
                      onClick={(e) => handleRemoveDocument(setLeasingFlyer, e)}
                      aria-label="Remove leasing flyer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className={styles.documentPlaceholder}>
                    <span className={styles.documentIcon}>📄</span>
                    <span className={styles.documentLabel}>Leasing Flyer</span>
                    <span className={styles.documentHint}>Drop or click</span>
                  </div>
                )}
              </DropZone>
              {errors.leasingFlyer && <p className={styles.errorText}>{errors.leasingFlyer}</p>}

              <DropZone
                onFilesSelected={(files) => handleDocumentSelect(files, setFloorPlans, 'floorPlans')}
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                className={`${styles.documentDropZone} ${floorPlans ? styles.documentUploaded : ''}`}
                activeClassName={styles.dropZoneActive}
              >
                {floorPlans ? (
                  <div className={styles.documentContent}>
                    <span className={styles.documentIcon}>📐</span>
                    <div className={styles.documentInfo}>
                      <span className={styles.documentName}>{floorPlans.name}</span>
                      <span className={styles.documentSize}>{formatFileSize(floorPlans.size)}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.removeDocButton}
                      onClick={(e) => handleRemoveDocument(setFloorPlans, e)}
                      aria-label="Remove floor plans"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className={styles.documentPlaceholder}>
                    <span className={styles.documentIcon}>📐</span>
                    <span className={styles.documentLabel}>Floor Plans</span>
                    <span className={styles.documentHint}>Drop or click</span>
                  </div>
                )}
              </DropZone>
              {errors.floorPlans && <p className={styles.errorText}>{errors.floorPlans}</p>}
            </div>
          </div>

          {/* Upload Credentials (Private) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Upload Credentials (Private) 🔒</h3>
            <p className={styles.sectionDescription}>
              Verified tenants receive 2.4x more property submissions from landlords and brokers, as indicated
              by a verified badge. All information uploaded remains 100% private and is never shared without
              your consent.
            </p>

            {/* Drag and drop upload area for credentials */}
            <DropZone
              onFilesSelected={handleCredentialsSelect}
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              multiple
              className={styles.uploadArea}
              activeClassName={styles.uploadAreaDragging}
            >
              <p className={styles.uploadText}>
                Drag and drop your files here or <span className={styles.uploadLink}>click to upload</span>
              </p>
              <p className={styles.uploadHint}>
                Accepted file types: PDF, DOCX, JPG, PNG • Max size: 10 MB per file
              </p>
            </DropZone>

            {/* Error message for credentials */}
            {errors.credentials && <p className={styles.errorText}>{errors.credentials}</p>}

            {/* List of uploaded credentials */}
            {uploadedCredentials.length > 0 && (
              <div className={styles.uploadedFilesList}>
                {uploadedCredentials.map((file, index) => (
                  <div key={index} className={styles.uploadedFile}>
                    <span className={styles.uploadedFileIcon}>{getFileIcon(file)}</span>
                    <div className={styles.uploadedFileInfo}>
                      <span className={styles.uploadedFileName}>{file.name}</span>
                      <span className={styles.uploadedFileSize}>{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.removeFileButton}
                      onClick={() => handleRemoveCredential(index)}
                      aria-label={`Remove ${file.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Credential type suggestions */}
            <div className={styles.credentialSuggestions}>
              <p className={styles.credentialSuggestionsTitle}>Suggested documents:</p>
              <ul className={styles.credentialSuggestionsList}>
                <li>Financial Statements</li>
                <li>Credit Report (business owner)</li>
                <li>Tax Return</li>
                <li>Incorporation documents</li>
              </ul>
            </div>
          </div>

          {/* Error message */}
          {errors.general && (
            <div className={styles.errorMessage} role="alert">
              {errors.general}
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onBack}
              className={styles.backButton}
              disabled={isLoading}
            >
              Back
            </button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Business Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
