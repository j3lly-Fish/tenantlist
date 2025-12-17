import React, { useState, useEffect } from 'react';
import styles from './PropertyListingModal.module.css';

interface PropertyListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: () => void;
  editListing?: {
    id: string;
    title: string;
    description: string | null;
    property_type: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    sqft: number;
    lot_size: number | null;
    year_built: number | null;
    floors: number | null;
    asking_price: number | null;
    price_per_sqft: number | null;
    lease_type: string | null;
    cam_charges: number | null;
    available_date: string | null;
    min_lease_term: string | null;
    max_lease_term: string | null;
    amenities: string[];
    highlights: string[];
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  } | null;
}

// Property type options
const propertyTypeOptions = [
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'office', label: 'Office' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'medical', label: 'Medical' },
  { value: 'flex', label: 'Flex Space' },
  { value: 'land', label: 'Land' },
  { value: 'other', label: 'Other' },
];

// Lease type options
const leaseTypeOptions = [
  { value: 'nnn', label: 'NNN (Triple Net)' },
  { value: 'gross', label: 'Gross' },
  { value: 'modified_gross', label: 'Modified Gross' },
  { value: 'percentage', label: 'Percentage Lease' },
];

// Lease term options
const leaseTermOptions = [
  { value: '1_year', label: '1 Year' },
  { value: '2_years', label: '2 Years' },
  { value: '3_years', label: '3 Years' },
  { value: '5_years', label: '5 Years' },
  { value: '10_years', label: '10 Years' },
  { value: 'negotiable', label: 'Negotiable' },
];

// US State options
const stateOptions = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Amenity options
const amenityOptions = [
  { id: 'parking', label: 'Parking' },
  { id: 'loading_dock', label: 'Loading Dock' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'sprinklers', label: 'Sprinklers' },
  { id: 'security', label: 'Security System' },
  { id: 'ada_accessible', label: 'ADA Accessible' },
  { id: 'elevator', label: 'Elevator' },
  { id: 'signage', label: 'Signage Rights' },
  { id: 'drive_thru', label: 'Drive Thru' },
  { id: 'grease_trap', label: 'Grease Trap' },
  { id: 'hood_system', label: 'Hood System' },
  { id: 'walk_in_cooler', label: 'Walk-in Cooler' },
  { id: 'high_ceilings', label: 'High Ceilings' },
  { id: 'natural_light', label: 'Natural Light' },
  { id: 'outdoor_space', label: 'Outdoor Space' },
  { id: 'conference_room', label: 'Conference Room' },
];

export const PropertyListingModal: React.FC<PropertyListingModalProps> = ({
  isOpen,
  onClose,
  onListingCreated,
  editListing = null,
}) => {
  const isEditMode = !!editListing;

  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Basic Info
  const [title, setTitle] = useState(editListing?.title || '');
  const [description, setDescription] = useState(editListing?.description || '');
  const [propertyType, setPropertyType] = useState(editListing?.property_type || '');
  const [address, setAddress] = useState(editListing?.address || '');
  const [city, setCity] = useState(editListing?.city || '');
  const [state, setState] = useState(editListing?.state || '');
  const [zipCode, setZipCode] = useState(editListing?.zip_code || '');

  // Step 2: Property Details
  const [sqft, setSqft] = useState(editListing?.sqft?.toString() || '');
  const [lotSize, setLotSize] = useState(editListing?.lot_size?.toString() || '');
  const [yearBuilt, setYearBuilt] = useState(editListing?.year_built?.toString() || '');
  const [floors, setFloors] = useState(editListing?.floors?.toString() || '');
  const [askingPrice, setAskingPrice] = useState(editListing?.asking_price?.toString() || '');
  const [pricePerSqft, setPricePerSqft] = useState(editListing?.price_per_sqft?.toString() || '');
  const [leaseType, setLeaseType] = useState(editListing?.lease_type || '');
  const [camCharges, setCamCharges] = useState(editListing?.cam_charges?.toString() || '');
  const [availableDate, setAvailableDate] = useState(editListing?.available_date || '');
  const [minLeaseTerm, setMinLeaseTerm] = useState(editListing?.min_lease_term || '');
  const [maxLeaseTerm, setMaxLeaseTerm] = useState(editListing?.max_lease_term || '');

  // Step 3: Features & Contact
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(editListing?.amenities || []);
  const [highlights, setHighlights] = useState<string[]>(editListing?.highlights || []);
  const [newHighlight, setNewHighlight] = useState('');
  const [contactName, setContactName] = useState(editListing?.contact_name || '');
  const [contactEmail, setContactEmail] = useState(editListing?.contact_email || '');
  const [contactPhone, setContactPhone] = useState(editListing?.contact_phone || '');

  // Form state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Update form when editListing changes
  useEffect(() => {
    if (editListing) {
      setTitle(editListing.title || '');
      setDescription(editListing.description || '');
      setPropertyType(editListing.property_type || '');
      setAddress(editListing.address || '');
      setCity(editListing.city || '');
      setState(editListing.state || '');
      setZipCode(editListing.zip_code || '');
      setSqft(editListing.sqft?.toString() || '');
      setLotSize(editListing.lot_size?.toString() || '');
      setYearBuilt(editListing.year_built?.toString() || '');
      setFloors(editListing.floors?.toString() || '');
      setAskingPrice(editListing.asking_price?.toString() || '');
      setPricePerSqft(editListing.price_per_sqft?.toString() || '');
      setLeaseType(editListing.lease_type || '');
      setCamCharges(editListing.cam_charges?.toString() || '');
      setAvailableDate(editListing.available_date || '');
      setMinLeaseTerm(editListing.min_lease_term || '');
      setMaxLeaseTerm(editListing.max_lease_term || '');
      setSelectedAmenities(editListing.amenities || []);
      setHighlights(editListing.highlights || []);
      setContactName(editListing.contact_name || '');
      setContactEmail(editListing.contact_email || '');
      setContactPhone(editListing.contact_phone || '');
      setCurrentStep(1);
    }
  }, [editListing]);

  if (!isOpen) return null;

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!propertyType) {
      newErrors.propertyType = 'Property type is required';
    }

    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!state) {
      newErrors.state = 'State is required';
    }

    if (!zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!sqft || parseInt(sqft) <= 0) {
      newErrors.sqft = 'Square footage is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId]
    );
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim() && highlights.length < 10) {
      setHighlights((prev) => [...prev, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    const payload = {
      title,
      description: description || null,
      property_type: propertyType,
      address,
      city,
      state,
      zip_code: zipCode,
      sqft: parseInt(sqft),
      lot_size: lotSize ? parseFloat(lotSize) : null,
      year_built: yearBuilt ? parseInt(yearBuilt) : null,
      floors: floors ? parseInt(floors) : null,
      asking_price: askingPrice ? parseFloat(askingPrice) : null,
      price_per_sqft: pricePerSqft ? parseFloat(pricePerSqft) : null,
      lease_type: leaseType || null,
      cam_charges: camCharges ? parseFloat(camCharges) : null,
      available_date: availableDate || null,
      min_lease_term: minLeaseTerm || null,
      max_lease_term: maxLeaseTerm || null,
      amenities: selectedAmenities,
      highlights,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
    };

    try {
      const url = isEditMode
        ? `/api/property-listings/${editListing!.id}`
        : '/api/property-listings';

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
        throw new Error(data.error?.message || `Failed to ${isEditMode ? 'update' : 'create'} property listing`);
      }

      resetForm();
      onListingCreated();
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setTitle('');
    setDescription('');
    setPropertyType('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setSqft('');
    setLotSize('');
    setYearBuilt('');
    setFloors('');
    setAskingPrice('');
    setPricePerSqft('');
    setLeaseType('');
    setCamCharges('');
    setAvailableDate('');
    setMinLeaseTerm('');
    setMaxLeaseTerm('');
    setSelectedAmenities([]);
    setHighlights([]);
    setNewHighlight('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
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

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{isEditMode ? 'Edit Property' : 'List New Property'}</h2>
            <p className={styles.modalSubtitle}>
              Step {currentStep} of 3:{' '}
              {currentStep === 1 ? 'Basic Info' : currentStep === 2 ? 'Property Details' : 'Features & Contact'}
            </p>
          </div>
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className={styles.modalContent}>
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Property Title *</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Prime Retail Space in Downtown"
                />
                {errors.title && <p className={styles.errorText}>{errors.title}</p>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Property Type *</label>
                <select
                  className={`${styles.select} ${errors.propertyType ? styles.inputError : ''}`}
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  <option value="">Select type</option>
                  {propertyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.propertyType && <p className={styles.errorText}>{errors.propertyType}</p>}
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.label}>Street Address *</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street"
                />
                {errors.address && <p className={styles.errorText}>{errors.address}</p>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>City *</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Los Angeles"
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
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                {errors.state && <p className={styles.errorText}>{errors.state}</p>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>ZIP Code *</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.zipCode ? styles.inputError : ''}`}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="90210"
                  maxLength={10}
                />
                {errors.zipCode && <p className={styles.errorText}>{errors.zipCode}</p>}
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your property..."
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={handleClose} className={styles.cancelButton}>
                Cancel
              </button>
              <button type="button" onClick={handleNextStep} className={styles.submitButton}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Property Details */}
        {currentStep === 2 && (
          <div className={styles.modalContent}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Square Footage *</label>
                <input
                  type="number"
                  className={`${styles.input} ${errors.sqft ? styles.inputError : ''}`}
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  placeholder="e.g., 2500"
                  min="0"
                />
                {errors.sqft && <p className={styles.errorText}>{errors.sqft}</p>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Lot Size (Acres)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  placeholder="e.g., 0.5"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Year Built</label>
                <input
                  type="number"
                  className={styles.input}
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="e.g., 2010"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Floors</label>
                <input
                  type="number"
                  className={styles.input}
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                  placeholder="e.g., 2"
                  min="1"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Asking Price ($/month)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="e.g., 5000"
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Price per Sqft ($/sqft)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={pricePerSqft}
                  onChange={(e) => setPricePerSqft(e.target.value)}
                  placeholder="e.g., 25"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Lease Type</label>
                <select
                  className={styles.select}
                  value={leaseType}
                  onChange={(e) => setLeaseType(e.target.value)}
                >
                  <option value="">Select lease type</option>
                  {leaseTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>CAM Charges ($/month)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={camCharges}
                  onChange={(e) => setCamCharges(e.target.value)}
                  placeholder="e.g., 500"
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Available Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={availableDate}
                  onChange={(e) => setAvailableDate(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Min Lease Term</label>
                <select
                  className={styles.select}
                  value={minLeaseTerm}
                  onChange={(e) => setMinLeaseTerm(e.target.value)}
                >
                  <option value="">Select term</option>
                  {leaseTermOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Max Lease Term</label>
                <select
                  className={styles.select}
                  value={maxLeaseTerm}
                  onChange={(e) => setMaxLeaseTerm(e.target.value)}
                >
                  <option value="">Select term</option>
                  {leaseTermOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={handleBackStep} className={styles.cancelButton}>
                Back
              </button>
              <button type="button" onClick={handleNextStep} className={styles.submitButton}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Features & Contact */}
        {currentStep === 3 && (
          <div className={styles.modalContent}>
            {/* Amenities */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Amenities & Features</h3>
              <div className={styles.amenitiesGrid}>
                {amenityOptions.map((amenity) => (
                  <label key={amenity.id} className={styles.amenityCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity.id)}
                      onChange={() => handleAmenityToggle(amenity.id)}
                    />
                    <span className={styles.checkmark}></span>
                    <span className={styles.amenityLabel}>{amenity.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Property Highlights</h3>
              <div className={styles.highlightsInput}>
                <input
                  type="text"
                  className={styles.input}
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="Add a highlight (e.g., Corner location, High foot traffic)"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddHighlight()}
                />
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className={styles.addButton}
                  disabled={!newHighlight.trim() || highlights.length >= 10}
                >
                  Add
                </button>
              </div>
              {highlights.length > 0 && (
                <div className={styles.highlightsList}>
                  {highlights.map((highlight, index) => (
                    <span key={index} className={styles.highlightTag}>
                      {highlight}
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(index)}
                        className={styles.removeTag}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Contact Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Contact Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Smith"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Contact Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Contact Phone</label>
                  <input
                    type="tel"
                    className={styles.input}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {errors.general && (
              <div className={styles.errorMessage} role="alert">
                {errors.general}
              </div>
            )}

            <div className={styles.actions}>
              <button type="button" onClick={handleBackStep} className={styles.cancelButton}>
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : isEditMode ? 'Update Property' : 'Create Listing'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
