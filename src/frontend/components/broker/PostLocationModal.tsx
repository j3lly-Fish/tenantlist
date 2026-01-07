import React, { useState, useRef } from 'react';
import styles from './PostLocationModal.module.css';
import { LocationTagInput } from './LocationTagInput';
import { LocationMapSelector } from './LocationMapSelector';
import { AmenitiesCheckboxGrid } from './AmenitiesCheckboxGrid';
import apiClient from '@utils/apiClient';

interface PostLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  // Step 1: Space Requirements
  location_name: string;
  asset_type: string;
  target_move_in: string;
  sqft_min: string;
  sqft_max: string;
  lot_size_min: string;
  monthly_budget_min: string;
  monthly_budget_max: string;
  preferred_lease_term: string;
  locations_of_interest: string[];
  map_boundaries: any | null;

  // Step 2: Additional Features
  amenities: string[];
}

const ASSET_TYPES = [
  'Retail',
  'Office',
  'Industrial',
  'Mixed Use',
  'Restaurant',
  'Medical',
  'Warehouse',
  'Land',
  'Other',
];

const LEASE_TERMS = [
  { value: 'short', label: 'Short-term (<1 year)' },
  { value: 'medium', label: 'Medium-term (3-5 years)' },
  { value: 'long', label: 'Long-term (5+ years)' },
];

export const PostLocationModal: React.FC<PostLocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormData>({
    location_name: '',
    asset_type: '',
    target_move_in: '',
    sqft_min: '',
    sqft_max: '',
    lot_size_min: '',
    monthly_budget_min: '',
    monthly_budget_max: '',
    preferred_lease_term: '',
    locations_of_interest: [],
    map_boundaries: null,
    amenities: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Format number with commas (e.g., 10000 -> "10,000")
  const formatNumber = (value: string): string => {
    const number = value.replace(/,/g, '');
    if (!number || isNaN(Number(number))) return '';
    return Number(number).toLocaleString('en-US');
  };

  // Format currency with dollar sign and commas (e.g., 10000 -> "$10,000")
  const formatCurrency = (value: string): string => {
    const number = value.replace(/[$,]/g, '');
    if (!number || isNaN(Number(number))) return '';
    return '$' + Number(number).toLocaleString('en-US');
  };

  // Handle numeric input changes with formatting
  const handleNumericChange = (field: string, value: string, formatter: (v: string) => string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData({
      ...formData,
      [field]: numericValue,
    });
    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Validation for Step 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.location_name.trim()) {
      newErrors.location_name = 'Location name is required';
    }

    if (!formData.asset_type) {
      newErrors.asset_type = 'Asset type is required';
    }

    // Validate sqft range
    if (formData.sqft_min && formData.sqft_max) {
      const min = parseInt(formData.sqft_min);
      const max = parseInt(formData.sqft_max);
      if (min > max) {
        newErrors.sqft_max = 'Max square feet must be greater than or equal to min';
      }
    }

    // Validate budget range
    if (formData.monthly_budget_min && formData.monthly_budget_max) {
      const min = parseInt(formData.monthly_budget_min);
      const max = parseInt(formData.monthly_budget_max);
      if (min > max) {
        newErrors.monthly_budget_max = 'Max budget must be greater than or equal to min';
      }
    }

    // Validate target move-in date is in the future
    if (formData.target_move_in) {
      const targetDate = new Date(formData.target_move_in);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (targetDate < today) {
        newErrors.target_move_in = 'Target move-in date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        location_name: formData.location_name.trim(),
        asset_type: formData.asset_type,
        target_move_in: formData.target_move_in || undefined,
        sqft_min: formData.sqft_min ? parseInt(formData.sqft_min) : undefined,
        sqft_max: formData.sqft_max ? parseInt(formData.sqft_max) : undefined,
        lot_size_min: formData.lot_size_min ? parseFloat(formData.lot_size_min) : undefined,
        monthly_budget_min: formData.monthly_budget_min ? parseInt(formData.monthly_budget_min) : undefined,
        monthly_budget_max: formData.monthly_budget_max ? parseInt(formData.monthly_budget_max) : undefined,
        preferred_lease_term: formData.preferred_lease_term || undefined,
        locations_of_interest: formData.locations_of_interest,
        map_boundaries: formData.map_boundaries || undefined,
        amenities: formData.amenities,
      };

      const response = await apiClient.post('/api/broker/locations', payload);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create location');
      }

      // Success
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        location_name: '',
        asset_type: '',
        target_move_in: '',
        sqft_min: '',
        sqft_max: '',
        lot_size_min: '',
        monthly_budget_min: '',
        monthly_budget_max: '',
        preferred_lease_term: '',
        locations_of_interest: [],
        map_boundaries: null,
        amenities: [],
      });
      setCurrentStep(1);
    } catch (error: any) {
      setErrors({
        general: error.message || 'Failed to create location. Please try again.',
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
      aria-labelledby="post-location-modal-title"
    >
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 id="post-location-modal-title" className={styles.modalTitle}>
              Post New Location
            </h2>
            <p className={styles.stepIndicator}>
              {currentStep} of 2:{' '}
              {currentStep === 1 ? 'Describe your space needs' : 'Additional Features'}
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

        {/* Step 1: Space Requirements */}
        {currentStep === 1 && (
          <div className={styles.modalContent}>
            {/* Listing Location Name */}
            <div className={styles.formGroup}>
              <label htmlFor="location-name" className={styles.label}>
                Listing Location Name <span className={styles.required}>*</span>
              </label>
              <input
                id="location-name"
                type="text"
                className={`${styles.input} ${errors.location_name ? styles.inputError : ''}`}
                value={formData.location_name}
                onChange={(e) =>
                  setFormData({ ...formData, location_name: e.target.value })
                }
                placeholder="e.g., San Fran Area"
              />
              {errors.location_name && (
                <p className={styles.errorText}>{errors.location_name}</p>
              )}
            </div>

            {/* Asset Type */}
            <div className={styles.formGroup}>
              <label htmlFor="asset-type" className={styles.label}>
                Asset <span className={styles.required}>*</span>
              </label>
              <select
                id="asset-type"
                className={`${styles.select} ${errors.asset_type ? styles.inputError : ''}`}
                value={formData.asset_type}
                onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
              >
                <option value="">Select asset type</option>
                {ASSET_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.asset_type && <p className={styles.errorText}>{errors.asset_type}</p>}
            </div>

            {/* Target Move-in Date */}
            <div className={styles.formGroup}>
              <label htmlFor="target-move-in" className={styles.label}>
                Target move-in Date
              </label>
              <input
                id="target-move-in"
                type="date"
                className={`${styles.input} ${errors.target_move_in ? styles.inputError : ''}`}
                value={formData.target_move_in}
                onChange={(e) =>
                  setFormData({ ...formData, target_move_in: e.target.value })
                }
              />
              {errors.target_move_in && (
                <p className={styles.errorText}>{errors.target_move_in}</p>
              )}
            </div>

            {/* Square Feet: Min/Max */}
            <div className={styles.fieldRow}>
              <div className={styles.formGroup}>
                <label htmlFor="sqft-min" className={styles.label}>
                  Square Feet - Min
                </label>
                <input
                  id="sqft-min"
                  type="text"
                  className={styles.input}
                  value={formatNumber(formData.sqft_min)}
                  onChange={(e) => handleNumericChange('sqft_min', e.target.value, formatNumber)}
                  placeholder="e.g., 1,000"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="sqft-max" className={styles.label}>
                  Square Feet - Max
                </label>
                <input
                  id="sqft-max"
                  type="text"
                  className={`${styles.input} ${errors.sqft_max ? styles.inputError : ''}`}
                  value={formatNumber(formData.sqft_max)}
                  onChange={(e) => handleNumericChange('sqft_max', e.target.value, formatNumber)}
                  placeholder="e.g., 2,000"
                />
                {errors.sqft_max && <p className={styles.errorText}>{errors.sqft_max}</p>}
              </div>
            </div>

            {/* Lot Size (Acres) */}
            <div className={styles.formGroup}>
              <label htmlFor="lot-size-min" className={styles.label}>
                Lot Size (Acres) - Min
              </label>
              <input
                id="lot-size-min"
                type="number"
                step="0.01"
                className={styles.input}
                value={formData.lot_size_min}
                onChange={(e) =>
                  setFormData({ ...formData, lot_size_min: e.target.value })
                }
                placeholder="e.g., 1.67"
              />
            </div>

            {/* Monthly Budget: Min/Max */}
            <div className={styles.fieldRow}>
              <div className={styles.formGroup}>
                <label htmlFor="budget-min" className={styles.label}>
                  Monthly Budget - Min
                </label>
                <input
                  id="budget-min"
                  type="text"
                  className={styles.input}
                  value={formatCurrency(formData.monthly_budget_min)}
                  onChange={(e) =>
                    handleNumericChange('monthly_budget_min', e.target.value, formatCurrency)
                  }
                  placeholder="e.g., $10,000"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="budget-max" className={styles.label}>
                  Monthly Budget - Max
                </label>
                <input
                  id="budget-max"
                  type="text"
                  className={`${styles.input} ${errors.monthly_budget_max ? styles.inputError : ''}`}
                  value={formatCurrency(formData.monthly_budget_max)}
                  onChange={(e) =>
                    handleNumericChange('monthly_budget_max', e.target.value, formatCurrency)
                  }
                  placeholder="e.g., $15,000"
                />
                {errors.monthly_budget_max && (
                  <p className={styles.errorText}>{errors.monthly_budget_max}</p>
                )}
              </div>
            </div>

            {/* Preferred Lease Term */}
            <div className={styles.formGroup}>
              <label htmlFor="lease-term" className={styles.label}>
                Preferred Lease Term
              </label>
              <select
                id="lease-term"
                className={styles.select}
                value={formData.preferred_lease_term}
                onChange={(e) =>
                  setFormData({ ...formData, preferred_lease_term: e.target.value })
                }
              >
                <option value="">Select lease term</option>
                {LEASE_TERMS.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Locations of Interest */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Locations of Interest <span className={styles.required}>*</span>
              </label>
              <LocationTagInput
                locations={formData.locations_of_interest}
                onChange={(locations) =>
                  setFormData({ ...formData, locations_of_interest: locations })
                }
              />
            </div>

            {/* Interactive Map */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Interactive Map</label>
              <LocationMapSelector
                boundaries={formData.map_boundaries}
                onChange={(boundaries) =>
                  setFormData({ ...formData, map_boundaries: boundaries })
                }
              />
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

        {/* Step 2: Additional Features */}
        {currentStep === 2 && (
          <div className={styles.modalContent}>
            <h3 className={styles.sectionTitle}>Additional Features</h3>
            <p className={styles.hint}>
              Select all amenities and features that are important for your space requirements
            </p>

            {/* Amenities Grid */}
            <AmenitiesCheckboxGrid
              selectedAmenities={formData.amenities}
              onChange={(amenities) => setFormData({ ...formData, amenities })}
            />

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
                {isLoading ? 'Submitting...' : 'Preview'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
