import React, { useState, useEffect } from 'react';
import styles from './DemandListingModal.module.css';
import { LocationPreviewModal } from './LocationPreviewModal';

interface DemandListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName?: string;
  onListingCreated: () => void;
  editListing?: {
    id: string;
    title: string | null;
    description: string | null;
    city: string;
    state: string;
    sqft_min: number | null;
    sqft_max: number | null;
    budget_min: number | null;
    budget_max: number | null;
    duration_type: string | null;
    start_date: string | null;
    asset_type: string;
    lot_size?: number | null;
    is_corporate_location?: boolean;
    additional_features?: string[];
  } | null;
}

// Additional features options
const additionalFeaturesOptions = [
  { id: '24_7', label: '24/7' },
  { id: '2nd_gen_restaurant', label: '2nd generation restaurant' },
  { id: '3_phase_electrical', label: '3 phase electrical' },
  { id: 'ada_accessible', label: 'ADA accessible' },
  { id: 'anchor_tenants', label: 'Anchor tenants' },
  { id: 'asphalt_concrete', label: 'Asphalt/concrete ground' },
  { id: 'clear_height_24', label: "Clear height 24'+" },
  { id: 'clear_height_32', label: "Clear height 32'+" },
  { id: 'conference_room', label: 'Conference room' },
  { id: 'dock_cross_dock', label: 'Dock - cross dock' },
  { id: 'dock_double_wide', label: 'Dock - double wide' },
  { id: 'dock_drive_in_ramp', label: 'Dock - drive in ramp' },
  { id: 'dock_enclosed_loading', label: 'Dock - enclosed loading' },
  { id: 'dock_insulated', label: 'Dock - insulated' },
  { id: 'dock_levelers', label: 'Dock - levelers' },
  { id: 'dock_loading_slab', label: 'Dock - loading slab' },
  { id: 'dock_truck_lifts', label: 'Dock - truck lifts' },
  { id: 'dock_truck_wells', label: 'Dock - truck wells' },
  { id: 'dock_ground_level', label: 'Dock - Ground level bays' },
  { id: 'drive_thru', label: 'Drive Thru' },
  { id: 'end_cap', label: 'End cap' },
  { id: 'esfr', label: 'ESFR' },
  { id: 'fencing_secure', label: 'Fencing & secure' },
  { id: 'freezer_capacity', label: 'Freezer Capacity' },
  { id: 'glass_store_front', label: 'Glass store front' },
  { id: 'grease_trap', label: 'Grease trap' },
  { id: 'hotel_lobby', label: 'Hotel lobby' },
  { id: 'inline', label: 'Inline' },
  { id: 'refrigerator', label: 'Refrigerator' },
  { id: 'liquor_license', label: 'Liquor license' },
  { id: 'on_site_amenities', label: 'On site amenities' },
  { id: 'out_parcel', label: 'Out parcel' },
  { id: 'parking', label: 'Parking' },
  { id: 'patio_outdoor', label: 'Patio/outdoor seating' },
  { id: 'private_suites', label: 'Private suites' },
  { id: 'proximity_seaport', label: 'Proximity to seaport/airport' },
  { id: 'public_transportation', label: 'Public transportation' },
  { id: 'rail_access', label: 'Rail access' },
  { id: 'signage', label: 'Signage' },
  { id: 'wide_truck_court', label: 'Wide truck court' },
];

export const DemandListingModal: React.FC<DemandListingModalProps> = ({
  isOpen,
  onClose,
  businessId,
  businessName = 'Business',
  onListingCreated,
  editListing = null,
}) => {
  const isEditMode = !!editListing;

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  // Step 1: Form state - initialize with edit data if available
  const [title, setTitle] = useState(editListing?.title || '');
  const [description, setDescription] = useState(editListing?.description || '');
  const [durationType, setDurationType] = useState(editListing?.duration_type || '');
  const [startDate, setStartDate] = useState(editListing?.start_date || '');
  const [city, setCity] = useState(editListing?.city || '');
  const [state, setState] = useState(editListing?.state || '');
  const [minSqft, setMinSqft] = useState(editListing?.sqft_min?.toString() || '');
  const [maxSqft, setMaxSqft] = useState(editListing?.sqft_max?.toString() || '');
  const [minBudget, setMinBudget] = useState(editListing?.budget_min?.toString() || '');
  const [maxBudget, setMaxBudget] = useState(editListing?.budget_max?.toString() || '');
  const [industry, setIndustry] = useState('');
  const [assetType, setAssetType] = useState(editListing?.asset_type || '');
  const [lotSize, setLotSize] = useState(editListing?.lot_size?.toString() || '');

  // Step 2: Additional features
  const [isCorporateLocation, setIsCorporateLocation] = useState(editListing?.is_corporate_location || false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(editListing?.additional_features || []);

  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Update form when editListing changes (for edit mode)
  useEffect(() => {
    if (editListing) {
      setTitle(editListing.title || '');
      setDescription(editListing.description || '');
      setDurationType(editListing.duration_type || '');
      setStartDate(editListing.start_date || '');
      setCity(editListing.city || '');
      setState(editListing.state || '');
      setMinSqft(editListing.sqft_min?.toString() || '');
      setMaxSqft(editListing.sqft_max?.toString() || '');
      setMinBudget(editListing.budget_min?.toString() || '');
      setMaxBudget(editListing.budget_max?.toString() || '');
      setAssetType(editListing.asset_type || '');
      setLotSize(editListing.lot_size?.toString() || '');
      setIsCorporateLocation(editListing.is_corporate_location || false);
      setSelectedFeatures(editListing.additional_features || []);
      setCurrentStep(1);
    }
  }, [editListing]);

  if (!isOpen) return null;

  const durationOptions = [
    { value: 'less_than_90_days', label: '<90 Days' },
    { value: '3_5_years', label: '3-5 years' },
    { value: '5_plus_years', label: '5+ years' },
  ];

  const industryOptions = [
    { value: 'food_beverage', label: 'Food & Beverage' },
    { value: 'retail', label: 'Retail' },
    { value: 'office', label: 'Office' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'other', label: 'Other' },
  ];

  const assetTypeOptions = [
    { value: 'storefront', label: 'Storefront' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'office_space', label: 'Office Space' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'retail', label: 'Retail' },
    { value: 'industrial_space', label: 'Industrial Space' },
    { value: 'medical_office', label: 'Medical Office' },
    { value: 'other', label: 'Other' },
  ];

  const stateOptions = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!state) {
      newErrors.state = 'State is required';
    }

    if (!minSqft) {
      newErrors.minSqft = 'Minimum square feet is required';
    } else if (parseInt(minSqft) < 0) {
      newErrors.minSqft = 'Must be a positive number';
    }

    if (!maxSqft) {
      newErrors.maxSqft = 'Maximum square feet is required';
    } else if (parseInt(maxSqft) < 0) {
      newErrors.maxSqft = 'Must be a positive number';
    } else if (parseInt(maxSqft) < parseInt(minSqft)) {
      newErrors.maxSqft = 'Max sqft must be greater than min sqft';
    }

    if (!assetType) {
      newErrors.assetType = 'Asset type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBackStep = () => {
    setCurrentStep(1);
  };

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    const payload = {
      title: title || `${city}, ${state}`,
      description,
      duration_type: durationType,
      start_date: startDate,
      location_name: `${city}, ${state}`,
      city,
      state,
      sqft_min: parseInt(minSqft),
      sqft_max: parseInt(maxSqft),
      budget_min: minBudget ? parseFloat(minBudget) : null,
      budget_max: maxBudget ? parseFloat(maxBudget) : null,
      industry: industry || null,
      asset_type: assetType || 'other',
      lot_size: lotSize ? parseFloat(lotSize) : null,
      is_corporate_location: isCorporateLocation,
      additional_features: selectedFeatures,
    };

    try {
      const url = isEditMode
        ? `/api/demand-listings/${editListing!.id}`
        : `/api/businesses/${businessId}/demand-listings`;

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} demand listing`);
      }

      // Reset form
      resetForm();
      onListingCreated();
    } catch (error: any) {
      setErrors({ general: error.message || `An error occurred while ${isEditMode ? 'updating' : 'creating'} the listing` });
      setShowPreview(false);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setTitle('');
    setDescription('');
    setDurationType('');
    setStartDate('');
    setCity('');
    setState('');
    setMinSqft('');
    setMaxSqft('');
    setMinBudget('');
    setMaxBudget('');
    setIndustry('');
    setAssetType('');
    setLotSize('');
    setIsCorporateLocation(false);
    setSelectedFeatures([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Get feature labels for selected features
  const getSelectedFeatureLabels = () => {
    return selectedFeatures.map(id => {
      const feature = additionalFeaturesOptions.find(f => f.id === id);
      return feature?.label || id;
    });
  };

  // Preview modal data
  const previewData = {
    businessName,
    city,
    state,
    assetType: assetTypeOptions.find(a => a.value === assetType)?.label || assetType,
    sqftMin: minSqft,
    sqftMax: maxSqft,
    lotSize,
    startDate,
    durationType: durationOptions.find(d => d.value === durationType)?.label || durationType,
    budgetMin: minBudget,
    budgetMax: maxBudget,
    description,
    additionalFeatures: getSelectedFeatureLabels(),
    isCorporateLocation,
  };

  return (
    <>
      <div className={styles.modalBackdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true">
        <div className={styles.modalContainer}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <div>
              <h2 className={styles.modalTitle}>{isEditMode ? 'Edit Location' : 'Post New Location'}</h2>
              <p className={styles.modalSubtitle}>
                {currentStep} of 2: {currentStep === 1 ? 'Location Details' : 'Additional Features'}
              </p>
            </div>
            <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step 1: Location Details */}
          {currentStep === 1 && (
            <div className={styles.modalContent}>
              <div className={styles.formGrid}>
                {/* Location Name - Full width */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Location Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Downtown Miami Restaurant"
                  />
                  <p className={styles.helpText}>Give this location a memorable name (optional)</p>
                </div>

                {/* City & State */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>City *</label>
                  <input
                    type="text"
                    className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Los Angeles"
                  />
                  {errors.city && <p className={styles.errorText}>{errors.city}</p>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>State *</label>
                  <select
                    className={`${styles.select} ${errors.state ? styles.inputError : ''}`}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  >
                    <option value="">Select state</option>
                    {stateOptions.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  {errors.state && <p className={styles.errorText}>{errors.state}</p>}
                </div>

                {/* Asset Type */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Asset Type *</label>
                  <select
                    className={`${styles.select} ${errors.assetType ? styles.inputError : ''}`}
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                  >
                    <option value="">Select asset type</option>
                    {assetTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {errors.assetType && <p className={styles.errorText}>{errors.assetType}</p>}
                </div>

                {/* Lot Size */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Lot Size (Acres)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value)}
                    placeholder="e.g., 1.67"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Square Feet */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Min Sqft *</label>
                  <input
                    type="number"
                    className={`${styles.input} ${errors.minSqft ? styles.inputError : ''}`}
                    value={minSqft}
                    onChange={(e) => setMinSqft(e.target.value)}
                    placeholder="e.g., 1,500"
                    min="0"
                  />
                  {errors.minSqft && <p className={styles.errorText}>{errors.minSqft}</p>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Max Sqft *</label>
                  <input
                    type="number"
                    className={`${styles.input} ${errors.maxSqft ? styles.inputError : ''}`}
                    value={maxSqft}
                    onChange={(e) => setMaxSqft(e.target.value)}
                    placeholder="e.g., 3,200"
                    min="0"
                  />
                  {errors.maxSqft && <p className={styles.errorText}>{errors.maxSqft}</p>}
                </div>

                {/* Target Move-in Date */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Target move-in date</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {/* Preferred Lease Term */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Preferred Lease Term</label>
                  <select
                    className={styles.select}
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                  >
                    <option value="">Select duration</option>
                    {durationOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Monthly Budget */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Min Monthly Budget</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="e.g., $11,000"
                    min="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Max Monthly Budget</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="e.g., $13,000"
                    min="0"
                  />
                </div>
              </div>

              {/* Error message */}
              {errors.general && (
                <div className={styles.errorMessage} role="alert">
                  {errors.general}
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={handleClose}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={styles.submitButton}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Additional Features */}
          {currentStep === 2 && (
            <div className={styles.modalContent}>
              {/* Corporate Location Toggle */}
              <div className={styles.corporateToggle}>
                <label className={styles.toggleLabel}>
                  <div className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={isCorporateLocation}
                      onChange={(e) => setIsCorporateLocation(e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </div>
                  <span className={styles.toggleIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M5 21V10.85M19 21V10.85M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                    </svg>
                  </span>
                  Corporate location
                </label>
              </div>

              {/* Features Grid */}
              <div className={styles.featuresGrid}>
                {additionalFeaturesOptions.map((feature) => (
                  <label key={feature.id} className={styles.featureCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.id)}
                      onChange={() => handleFeatureToggle(feature.id)}
                    />
                    <span className={styles.checkmark}></span>
                    <span className={styles.featureLabel}>{feature.label}</span>
                  </label>
                ))}
              </div>

              {/* Error message */}
              {errors.general && (
                <div className={styles.errorMessage} role="alert">
                  {errors.general}
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={handleBackStep}
                  className={styles.cancelButton}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  className={styles.submitButton}
                >
                  Preview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <LocationPreviewModal
          isOpen={showPreview}
          onClose={handleClosePreview}
          onEdit={() => {
            setShowPreview(false);
            setCurrentStep(1);
          }}
          onPost={handleSubmit}
          isLoading={isLoading}
          data={previewData}
        />
      )}
    </>
  );
};
