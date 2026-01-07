import React, { useState, useRef } from 'react';
import styles from './BusinessProfileModal.module.css';
import { TeamMemberCard, TeamMember } from './TeamMemberCard';
import apiClient from '@utils/apiClient';

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  // Step 1: Basic Information
  company_name: string;
  established_year: string;
  location_city: string;
  location_state: string;
  website_url: string;
  instagram_url: string;
  linkedin_url: string;
  about: string;
  logo_url: string | null;
  cover_image_url: string | null;

  // Step 2: Team Management
  teamMembers: TeamMember[];
}

// US States for dropdown
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export const BusinessProfileModal: React.FC<BusinessProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Step state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    established_year: '',
    location_city: '',
    location_state: '',
    website_url: '',
    instagram_url: '',
    linkedin_url: '',
    about: '',
    logo_url: null,
    cover_image_url: null,
    teamMembers: [],
  });

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (formData.established_year) {
      const year = parseInt(formData.established_year);
      const currentYear = new Date().getFullYear();
      if (year < 1800 || year > currentYear) {
        newErrors.established_year = `Year must be between 1800 and ${currentYear}`;
      }
    }

    // URL validation
    const urlPattern = /^https?:\/\/.+/;
    if (formData.website_url && !urlPattern.test(formData.website_url)) {
      newErrors.website_url = 'Please enter a valid URL (e.g., https://example.com)';
    }
    if (formData.instagram_url && !urlPattern.test(formData.instagram_url)) {
      newErrors.instagram_url = 'Please enter a valid URL';
    }
    if (formData.linkedin_url && !urlPattern.test(formData.linkedin_url)) {
      newErrors.linkedin_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image upload
  const handleImageUpload = (file: File, type: 'logo' | 'cover') => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors({
        ...errors,
        [type]: 'Please select a JPG, PNG, GIF, or WebP image',
      });
      return;
    }

    const maxSize = type === 'logo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for logo, 10MB for cover
    if (file.size > maxSize) {
      setErrors({
        ...errors,
        [type]: `Image must be less than ${type === 'logo' ? '5MB' : '10MB'}`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({
        ...formData,
        [`${type}_url`]: reader.result as string,
      });
      setErrors({ ...errors, [type]: '' });
    };
    reader.readAsDataURL(file);
  };

  // Handle next button
  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  // Handle back button
  const handleBack = () => {
    setCurrentStep(1);
  };

  // Handle team member changes
  const handleAddTeamMember = () => {
    setFormData({
      ...formData,
      teamMembers: [
        ...formData.teamMembers,
        {
          id: `temp-${Date.now()}`,
          name: '',
          location: '',
          role: 'broker',
          email: '',
        },
      ],
    });
  };

  const handleUpdateTeamMember = (id: string, updatedMember: Partial<TeamMember>) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers.map((member) =>
        member.id === id ? { ...member, ...updatedMember } : member
      ),
    });
  };

  const handleRemoveTeamMember = (id: string) => {
    setFormData({
      ...formData,
      teamMembers: formData.teamMembers.filter((member) => member.id !== id),
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Step 1: Create business profile
      const profileData = {
        company_name: formData.company_name.trim(),
        established_year: formData.established_year ? parseInt(formData.established_year) : undefined,
        location_city: formData.location_city.trim() || undefined,
        location_state: formData.location_state || undefined,
        about: formData.about.trim() || undefined,
        website_url: formData.website_url.trim() || undefined,
        instagram_url: formData.instagram_url.trim() || undefined,
        linkedin_url: formData.linkedin_url.trim() || undefined,
        logo_url: formData.logo_url || undefined,
        cover_image_url: formData.cover_image_url || undefined,
      };

      const response = await apiClient.post('/api/broker/business-profiles', profileData);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create business profile');
      }

      const businessProfileId = response.data.profile.id;

      // Step 2: Add team members (if any)
      if (formData.teamMembers.length > 0) {
        const teamPromises = formData.teamMembers
          .filter((member) => member.email.trim()) // Only add members with email
          .map((member) =>
            apiClient.post(`/api/broker/business-profiles/${businessProfileId}/team`, {
              email: member.email.trim(),
              role: member.role,
            })
          );

        await Promise.all(teamPromises);
      }

      // Success - close modal and notify parent
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        company_name: '',
        established_year: '',
        location_city: '',
        location_state: '',
        website_url: '',
        instagram_url: '',
        linkedin_url: '',
        about: '',
        logo_url: null,
        cover_image_url: null,
        teamMembers: [],
      });
      setCurrentStep(1);
    } catch (error: any) {
      setErrors({
        general: error.message || 'Failed to create business profile. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-profile-modal-title"
    >
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 id="business-profile-modal-title" className={styles.modalTitle}>
              Create Business Profile
            </h2>
            <p className={styles.stepIndicator}>
              {currentStep} of 2: {currentStep === 1 ? 'Basic Information' : 'Team Management'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
            disabled={isLoading}
          >
            &times;
          </button>
        </div>

        {/* Error message */}
        {errors.general && (
          <div className={styles.errorMessage} role="alert">
            {errors.general}
          </div>
        )}

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className={styles.modalContent}>
            {/* Cover Image Upload */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Cover Image</label>
              <p className={styles.hint}>Recommended: 650x150px</p>
              <div
                className={styles.coverDropZone}
                onClick={() => coverInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'cover');
                  }}
                  style={{ display: 'none' }}
                />
                {formData.cover_image_url ? (
                  <div className={styles.coverPreview}>
                    <img
                      src={formData.cover_image_url}
                      alt="Cover preview"
                      className={styles.coverImage}
                    />
                    <button
                      type="button"
                      className={styles.removeImageButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, cover_image_url: null });
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className={styles.coverPlaceholder}>
                    <span className={styles.placeholderIcon}>🖼️</span>
                    <span className={styles.placeholderText}>Click to upload cover image</span>
                  </div>
                )}
              </div>
              {errors.cover && <p className={styles.errorText}>{errors.cover}</p>}
            </div>

            {/* Logo Upload */}
            <div className={styles.section}>
              <label className={styles.sectionLabel}>Company Logo</label>
              <div
                className={styles.logoDropZone}
                onClick={() => logoInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'logo');
                  }}
                  style={{ display: 'none' }}
                />
                {formData.logo_url ? (
                  <>
                    <img src={formData.logo_url} alt="Logo" className={styles.logoImage} />
                    <button
                      type="button"
                      className={styles.removeImageButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, logo_url: null });
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
              </div>
              {errors.logo && <p className={styles.errorText}>{errors.logo}</p>}
            </div>

            {/* Company Name */}
            <div className={styles.formGroup}>
              <label htmlFor="company-name" className={styles.label}>
                Company Name <span className={styles.required}>*</span>
              </label>
              <input
                id="company-name"
                type="text"
                className={`${styles.input} ${errors.company_name ? styles.inputError : ''}`}
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Enter company name"
              />
              {errors.company_name && <p className={styles.errorText}>{errors.company_name}</p>}
            </div>

            {/* Established Year */}
            <div className={styles.formGroup}>
              <label htmlFor="established-year" className={styles.label}>
                Established Year
              </label>
              <input
                id="established-year"
                type="number"
                className={`${styles.input} ${errors.established_year ? styles.inputError : ''}`}
                value={formData.established_year}
                onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                placeholder="e.g., 1996"
                min="1800"
                max={new Date().getFullYear()}
              />
              {errors.established_year && (
                <p className={styles.errorText}>{errors.established_year}</p>
              )}
            </div>

            {/* Location: City and State */}
            <div className={styles.fieldRow}>
              <div className={styles.formGroup}>
                <label htmlFor="location-city" className={styles.label}>
                  City
                </label>
                <input
                  id="location-city"
                  type="text"
                  className={styles.input}
                  value={formData.location_city}
                  onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="location-state" className={styles.label}>
                  State
                </label>
                <select
                  id="location-state"
                  className={styles.select}
                  value={formData.location_state}
                  onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                >
                  <option value="">Select state</option>
                  {US_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Social Media Links */}
            <div className={styles.formGroup}>
              <label htmlFor="website-url" className={styles.label}>
                Website URL
              </label>
              <input
                id="website-url"
                type="url"
                className={`${styles.input} ${errors.website_url ? styles.inputError : ''}`}
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://yourcompany.com"
              />
              {errors.website_url && <p className={styles.errorText}>{errors.website_url}</p>}
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.formGroup}>
                <label htmlFor="instagram-url" className={styles.label}>
                  Instagram URL
                </label>
                <input
                  id="instagram-url"
                  type="url"
                  className={`${styles.input} ${errors.instagram_url ? styles.inputError : ''}`}
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
                {errors.instagram_url && (
                  <p className={styles.errorText}>{errors.instagram_url}</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="linkedin-url" className={styles.label}>
                  LinkedIn URL
                </label>
                <input
                  id="linkedin-url"
                  type="url"
                  className={`${styles.input} ${errors.linkedin_url ? styles.inputError : ''}`}
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/..."
                />
                {errors.linkedin_url && <p className={styles.errorText}>{errors.linkedin_url}</p>}
              </div>
            </div>

            {/* About Section */}
            <div className={styles.formGroup}>
              <label htmlFor="about" className={styles.label}>
                About
              </label>
              <textarea
                id="about"
                className={styles.textarea}
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                placeholder="Tell us about your brokerage..."
                rows={4}
                maxLength={1000}
              />
              <span className={styles.charCount}>{formData.about.length}/1000</span>
            </div>

            {/* Stats Display (Read-only) */}
            <div className={styles.statsSection}>
              <h3 className={styles.statsTitle}>Business Stats</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Offices</span>
                  <span className={styles.statValue}>--</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Agents</span>
                  <span className={styles.statValue}>--</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Tenants</span>
                  <span className={styles.statValue}>--</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Properties</span>
                  <span className={styles.statValue}>--</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button type="button" onClick={handleNext} className={styles.nextButton}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Team Management */}
        {currentStep === 2 && (
          <div className={styles.modalContent}>
            <h3 className={styles.sectionTitle}>Invite team members</h3>

            {/* Search Field */}
            <div className={styles.formGroup}>
              <input
                type="text"
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find brokers, managers, and more"
              />
            </div>

            {/* Team Members List */}
            <div className={styles.teamMembersList}>
              {formData.teamMembers.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No team members added yet.</p>
                  <p className={styles.hint}>Click "Add Team Member" to invite people to your brokerage.</p>
                </div>
              ) : (
                formData.teamMembers.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    onUpdate={(updatedMember) => handleUpdateTeamMember(member.id, updatedMember)}
                    onRemove={() => handleRemoveTeamMember(member.id)}
                  />
                ))
              )}
            </div>

            {/* Add Team Member Button */}
            <button
              type="button"
              onClick={handleAddTeamMember}
              className={styles.addMemberButton}
            >
              + Add Team Member
            </button>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                type="button"
                onClick={handleBack}
                className={styles.backButton}
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Brokerage Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
