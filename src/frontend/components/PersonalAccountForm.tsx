import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@contexts/ToastContext';
import styles from './PersonalAccountForm.module.css';

interface PersonalAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCompanyName?: string;
}

/**
 * PersonalAccountForm Component
 *
 * Displays a form for creating a personal account with business profile information.
 * Integrates with GlobalBusinessSearch modal via "Create New Business" flow.
 *
 * Features:
 * - Profile picture upload (320x320, JPG/PNG/GIF, max 10MB)
 * - Required fields: First Name, Last Name, Company Name, Phone Number, Email
 * - Company name autocomplete with duplicate check (300ms debounce)
 * - Form validation with inline error messages
 * - Pre-submission duplicate check
 * - Toast notifications for success/error states
 *
 * Props:
 * - isOpen: Controls form visibility
 * - onClose: Callback to close the form
 * - onSuccess: Callback triggered after account is successfully created
 * - initialCompanyName: Optional pre-filled company name from search
 */
export const PersonalAccountForm: React.FC<PersonalAccountFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCompanyName = '',
}) => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Autocomplete state
  const [companySuggestions, setCompanySuggestions] = useState<Array<{ id: string; name: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset form when opened
      setFirstName('');
      setLastName('');
      setCompanyName(initialCompanyName);
      setPhoneNumber('');
      setEmail('');
      setProfilePicture(null);
      setProfilePreview(null);
      setErrors({});
      setCompanySuggestions([]);
      setShowSuggestions(false);
    }
  }, [isOpen, initialCompanyName]);

  useEffect(() => {
    // Update company name if initialCompanyName changes
    setCompanyName(initialCompanyName);
  }, [initialCompanyName]);

  // Debounced company name search
  useEffect(() => {
    if (companyName.trim().length > 0) {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout for debounced search
      debounceTimeoutRef.current = setTimeout(() => {
        searchCompanyNames(companyName);
      }, 300);
    } else {
      setCompanySuggestions([]);
      setShowSuggestions(false);
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [companyName]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const searchCompanyNames = async (query: string) => {
    setIsSearching(true);

    try {
      const response = await fetch(
        `/api/businesses/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search company names');
      }

      const data = await response.json();
      setCompanySuggestions(
        (data.businesses || []).map((b: any) => ({
          id: b.id,
          name: b.name,
        }))
      );
      setShowSuggestions(true);
    } catch (err) {
      console.error('Company name search error:', err);
      setCompanySuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setErrors({ ...errors, profilePicture: 'Please upload a JPG, PNG, or GIF file' });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, profilePicture: 'Image must be less than 10 MB' });
        return;
      }

      setProfilePicture(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear error
      const newErrors = { ...errors };
      delete newErrors.profilePicture;
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.length > 50) {
      newErrors.firstName = 'First name must be less than 50 characters';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.length > 50) {
      newErrors.lastName = 'Last name must be less than 50 characters';
    }

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (companyName.length > 100) {
      newErrors.companyName = 'Company name must be less than 100 characters';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // First, check for duplicate company name
      const duplicateCheckResponse = await fetch('/api/businesses/check-duplicate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: companyName.trim() }),
      });

      if (!duplicateCheckResponse.ok) {
        throw new Error('Failed to check for duplicate company');
      }

      const duplicateData = await duplicateCheckResponse.json();

      if (duplicateData.exists) {
        // Duplicate found - show error and prevent submission
        const errorMessage =
          'This business already exists. Please search for and select the existing business.';
        setErrors({ general: errorMessage });
        toast.warning(errorMessage);
        setIsLoading(false);
        return;
      }

      // No duplicate - proceed with creating the personal account
      // Update the user's profile with personal information
      const response = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phoneNumber,
          photo_url: profilePreview, // Base64 for now
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create personal account');
      }

      // Now create the business profile
      const businessResponse = await fetch('/api/businesses', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName,
          category: 'other', // Default category
          status: 'active',
        }),
      });

      const businessData = await businessResponse.json();

      if (!businessResponse.ok) {
        throw new Error(businessData.error?.message || 'Failed to create business profile');
      }

      // Success - trigger callback
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred while creating personal account';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
      tabIndex={-1}
    >
      <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="personal-account-title">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        <div className="modal-header">
          <h2 id="personal-account-title" className="modal-title">
            Create Your Personal Account
          </h2>
          <p className="modal-subtitle">
            Create your personal profile, you will then be able to create your business profile
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Profile Picture Section */}
          <div className={styles.profileSection}>
            <input
              type="file"
              id="profile-picture-upload"
              className={styles.profileInput}
              accept="image/jpeg,image/png,image/gif"
              onChange={handleProfilePictureChange}
            />
            <label htmlFor="profile-picture-upload" className={styles.profileUploadArea}>
              {profilePreview ? (
                <div className={styles.profilePreview}>
                  <img src={profilePreview} alt="Profile preview" className={styles.profileImage} />
                </div>
              ) : (
                <div className={styles.profilePlaceholder}>
                  <div className={styles.uploadIconWrapper}>
                    <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              )}
            </label>
            <button
              type="button"
              className={styles.uploadLink}
              onClick={() => document.getElementById('profile-picture-upload')?.click()}
            >
              Upload Profile Image
            </button>
            <p className={styles.uploadHint}>320x320 (PNG, JPEG, or GIF, max 10 MB)</p>
            {errors.profilePicture && <p className={styles.errorText}>{errors.profilePicture}</p>}
          </div>

          {/* Contact Information Fields */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="first-name" className={styles.label}>
                First Name *
              </label>
              <input
                id="first-name"
                type="text"
                className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                maxLength={50}
              />
              {errors.firstName && <p className={styles.errorText}>{errors.firstName}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="last-name" className={styles.label}>
                Last Name *
              </label>
              <input
                id="last-name"
                type="text"
                className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Williams"
                maxLength={50}
              />
              {errors.lastName && <p className={styles.errorText}>{errors.lastName}</p>}
            </div>
          </div>

          {/* Company Name with Autocomplete */}
          <div className={styles.formGroup}>
            <label htmlFor="company-name" className={styles.label}>
              Company Name *
            </label>
            <div className={styles.autocompleteWrapper}>
              <input
                id="company-name"
                type="text"
                className={`${styles.input} ${errors.companyName ? styles.inputError : ''}`}
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (companySuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Search existing companies or add new"
                maxLength={100}
              />
              {showSuggestions && companySuggestions.length > 0 && (
                <div className={styles.suggestionsDropdown}>
                  {companySuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className={styles.suggestionItem}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCompanyName(suggestion.name);
                        setShowSuggestions(false);
                        setErrors({
                          ...errors,
                          companyName: 'This company already exists. Please use the search to select it instead.',
                        });
                      }}
                    >
                      {suggestion.name}
                    </button>
                  ))}
                </div>
              )}
              {isSearching && (
                <div className={styles.searchingIndicator}>
                  Searching...
                </div>
              )}
            </div>
            {errors.companyName && <p className={styles.errorText}>{errors.companyName}</p>}
          </div>

          {/* Phone Number */}
          <div className={styles.formGroup}>
            <label htmlFor="phone-number" className={styles.label}>
              Phone Number *
            </label>
            <input
              id="phone-number"
              type="tel"
              className={`${styles.input} ${errors.phoneNumber ? styles.inputError : ''}`}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(310) 123 4567"
            />
            {errors.phoneNumber && <p className={styles.errorText}>{errors.phoneNumber}</p>}
          </div>

          {/* Email */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email *
            </label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@company.com"
            />
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}
          </div>

          {/* Error message */}
          {errors.general && (
            <div className="error-message general" role="alert">
              {errors.general}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Personal Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
