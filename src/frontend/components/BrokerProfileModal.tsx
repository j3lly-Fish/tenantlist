import React, { useState, useEffect } from 'react';
import { createBrokerProfile, updateBrokerProfile } from '@utils/apiClient';
import styles from './BrokerProfileModal.module.css';

interface BrokerProfile {
  id?: string;
  company_name: string;
  license_number?: string;
  license_state?: string;
  specialties?: string[];
  bio?: string;
  website_url?: string;
  years_experience?: number;
}

interface BrokerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSaved: (profile: BrokerProfile) => void;
  existingProfile?: BrokerProfile | null;
}

/**
 * BrokerProfileModal Component
 *
 * Modal for creating or editing broker profile
 * - Form for company info, license, specialties, bio, website, experience
 * - Validation for required fields
 * - Handles both create and update operations
 * - Follows Figma design system
 */
export const BrokerProfileModal: React.FC<BrokerProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileSaved,
  existingProfile,
}) => {
  const isEditMode = !!existingProfile;

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Available specialties
  const availableSpecialties = [
    'Retail',
    'Office',
    'Industrial',
    'Restaurant',
    'Medical',
    'Flex Space',
    'Warehouse',
    'Mixed Use',
  ];

  // US states for license selection
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  // Load existing profile data on mount (edit mode)
  useEffect(() => {
    if (existingProfile) {
      setCompanyName(existingProfile.company_name || '');
      setLicenseNumber(existingProfile.license_number || '');
      setLicenseState(existingProfile.license_state || '');
      setSpecialties(existingProfile.specialties || []);
      setBio(existingProfile.bio || '');
      setWebsiteUrl(existingProfile.website_url || '');
      setYearsExperience(existingProfile.years_experience || '');
    }
  }, [existingProfile]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (companyName.length > 200) {
      newErrors.companyName = 'Company name must be less than 200 characters';
    }

    if (websiteUrl && !/^https?:\/\/.+/.test(websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL (e.g., https://example.com)';
    }

    if (yearsExperience !== '' && (Number(yearsExperience) < 0 || Number(yearsExperience) > 100)) {
      newErrors.yearsExperience = 'Years of experience must be between 0 and 100';
    }

    if (bio && bio.length > 1000) {
      newErrors.bio = 'Bio must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleSpecialty = (specialty: string) => {
    setSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const profileData = {
        company_name: companyName,
        license_number: licenseNumber || undefined,
        license_state: licenseState || undefined,
        specialties: specialties.length > 0 ? specialties : undefined,
        bio: bio || undefined,
        website_url: websiteUrl || undefined,
        years_experience: yearsExperience !== '' ? Number(yearsExperience) : undefined,
      };

      const result = isEditMode
        ? await updateBrokerProfile(profileData)
        : await createBrokerProfile(profileData);

      onProfileSaved(result);
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred while saving broker profile' });
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
          <h2 className={styles.modalTitle}>
            {isEditMode ? 'Edit Broker Profile' : 'Create Broker Profile'}
          </h2>
          <p className={styles.modalSubtitle}>
            {isEditMode ? 'Update your professional information' : 'Complete your professional profile'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Error message */}
        {errors.general && (
          <div className={styles.errorBanner}>
            <p>{errors.general}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Company Name */}
          <div className={styles.formGroup}>
            <label htmlFor="companyName" className={styles.label}>
              Company Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={`${styles.input} ${errors.companyName ? styles.inputError : ''}`}
              placeholder="Enter company or brokerage name"
              maxLength={200}
              disabled={isLoading}
            />
            {errors.companyName && <p className={styles.errorText}>{errors.companyName}</p>}
          </div>

          {/* License Information */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="licenseNumber" className={styles.label}>
                License Number
              </label>
              <input
                type="text"
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className={styles.input}
                placeholder="Enter license number"
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="licenseState" className={styles.label}>
                License State
              </label>
              <select
                id="licenseState"
                value={licenseState}
                onChange={(e) => setLicenseState(e.target.value)}
                className={styles.select}
                disabled={isLoading}
              >
                <option value="">Select state</option>
                {usStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Years of Experience */}
          <div className={styles.formGroup}>
            <label htmlFor="yearsExperience" className={styles.label}>
              Years of Experience
            </label>
            <input
              type="number"
              id="yearsExperience"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value === '' ? '' : Number(e.target.value))}
              className={`${styles.input} ${errors.yearsExperience ? styles.inputError : ''}`}
              placeholder="Enter years of experience"
              min="0"
              max="100"
              disabled={isLoading}
            />
            {errors.yearsExperience && <p className={styles.errorText}>{errors.yearsExperience}</p>}
          </div>

          {/* Specialties */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Specialties</label>
            <p className={styles.helperText}>Select all property types you specialize in</p>
            <div className={styles.specialtiesGrid}>
              {availableSpecialties.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => toggleSpecialty(specialty)}
                  className={`${styles.specialtyButton} ${
                    specialties.includes(specialty) ? styles.specialtySelected : ''
                  }`}
                  disabled={isLoading}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          {/* Website URL */}
          <div className={styles.formGroup}>
            <label htmlFor="websiteUrl" className={styles.label}>
              Website URL
            </label>
            <input
              type="url"
              id="websiteUrl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className={`${styles.input} ${errors.websiteUrl ? styles.inputError : ''}`}
              placeholder="https://yourwebsite.com"
              disabled={isLoading}
            />
            {errors.websiteUrl && <p className={styles.errorText}>{errors.websiteUrl}</p>}
          </div>

          {/* Bio */}
          <div className={styles.formGroup}>
            <label htmlFor="bio" className={styles.label}>
              Professional Bio
            </label>
            <p className={styles.helperText}>Tell clients about your experience and expertise</p>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={`${styles.textarea} ${errors.bio ? styles.inputError : ''}`}
              placeholder="Share your background, specializations, and what sets you apart..."
              rows={5}
              maxLength={1000}
              disabled={isLoading}
            />
            <div className={styles.charCount}>
              {bio.length} / 1000 characters
            </div>
            {errors.bio && <p className={styles.errorText}>{errors.bio}</p>}
          </div>

          {/* Actions */}
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditMode ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
