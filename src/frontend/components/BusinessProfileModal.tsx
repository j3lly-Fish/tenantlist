import React, { useState } from 'react';
import styles from './BusinessProfileModal.module.css';

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessCreated: (businessId: string, businessName: string) => void;
}

export const BusinessProfileModal: React.FC<BusinessProfileModalProps> = ({
  isOpen,
  onClose,
  onBusinessCreated,
}) => {
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [locations, setLocations] = useState('');
  const [website, setWebsite] = useState('https://');
  const [instagram, setInstagram] = useState('https://instagram.com/');
  const [linkedin, setLinkedin] = useState('https://linkedin.com/');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const industryOptions = [
    { value: 'food_beverage', label: 'Food & Beverage' },
    { value: 'retail', label: 'Retail' },
    { value: 'office', label: 'Office' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'other', label: 'Other' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    } else if (businessName.length > 100) {
      newErrors.businessName = 'Business name must be less than 100 characters';
    }

    if (!industry) {
      newErrors.industry = 'Please select an industry';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setErrors({ ...errors, general: 'Please upload a JPG, PNG, or GIF file' });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, general: 'Image must be less than 10 MB' });
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: businessName,
          category: industry,
          logo_url: logoPreview, // Base64 for now, can be replaced with S3 upload later
          status: 'active',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create business profile');
      }

      // Business created successfully - pass both ID and name to parent
      onBusinessCreated(data.data.business.id, businessName);
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
          <p className={styles.modalSubtitle}>1 of 2: Basic Information</p>
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
          {/* Brand (Logo) Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Brand (Logo)</h3>

            <div className={styles.logoUploadWrapper}>
              <input
                type="file"
                id="logo-upload"
                className={styles.logoInput}
                accept="image/jpeg,image/png,image/gif"
                onChange={handleLogoChange}
              />
              <label htmlFor="logo-upload" className={styles.logoUploadArea}>
                {logoPreview ? (
                  <div className={styles.logoPreview}>
                    <img src={logoPreview} alt="Logo preview" className={styles.logoImage} />
                  </div>
                ) : (
                  <div className={styles.logoPlaceholder}>
                    <div className={styles.uploadIconWrapper}>
                      <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className={styles.uploadText}>Upload Profile Image</span>
                  </div>
                )}
              </label>
            </div>
            <p className={styles.uploadHint}>320x320 (PNG, JPEG, or GIF, max 10 MB)</p>
          </div>

          {/* Business Information Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Business Information</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="business-name" className={styles.label}>
                  Business Name *
                </label>
                <input
                  id="business-name"
                  type="text"
                  className={`${styles.input} ${errors.businessName ? styles.inputError : ''}`}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter business name"
                  maxLength={100}
                />
                {errors.businessName && <p className={styles.errorText}>{errors.businessName}</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="industry" className={styles.label}>
                  Industry *
                </label>
                <select
                  id="industry"
                  className={`${styles.select} ${errors.industry ? styles.inputError : ''}`}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                >
                  <option value="">Select business category</option>
                  {industryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.industry && <p className={styles.errorText}>{errors.industry}</p>}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="locations" className={styles.label}>
                  Locations *
                </label>
                <input
                  id="locations"
                  type="text"
                  className={styles.input}
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                  placeholder="Currently open"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="website" className={styles.label}>
                  Website *
                </label>
                <input
                  id="website"
                  type="text"
                  className={styles.input}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="instagram" className={styles.label}>
                  Instagram
                </label>
                <input
                  id="instagram"
                  type="text"
                  className={styles.input}
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="linkedin" className={styles.label}>
                  LinkedIn
                </label>
                <input
                  id="linkedin"
                  type="text"
                  className={styles.input}
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bio" className={styles.label}>
                Bio
              </label>
              <textarea
                id="bio"
                className={styles.textarea}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your company"
                rows={4}
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact Information</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  E-mail *
                </label>
                <input
                  id="email"
                  type="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
                {errors.email && <p className={styles.errorText}>{errors.email}</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={`${styles.input} ${errors.phoneNumber ? styles.inputError : ''}`}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(310) 123 4567"
                />
                {errors.phoneNumber && <p className={styles.errorText}>{errors.phoneNumber}</p>}
              </div>
            </div>
          </div>

          {/* Error message */}
          {errors.general && (
            <div className={styles.errorMessage} role="alert">
              {errors.general}
            </div>
          )}

          {/* Action button */}
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
