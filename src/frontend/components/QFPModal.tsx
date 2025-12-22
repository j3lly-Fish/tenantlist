import React, { useState, useEffect } from 'react';
import styles from './QFPModal.module.css';
import { Business, PropertyListing } from '@types';

interface BrokerInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
  photoUrl?: string;
}

interface QFPFormData {
  businessId: string;
  // Tenant Info
  tenantName: string;
  tenantContact: string;
  tenantEmail: string;
  tenantPhone: string;
  // Proposed Terms
  proposedRent: string;
  proposedTerm: string;
  proposedStartDate: string;
  // Work sections
  landlordWork: string;
  tenantWork: string;
  additionalTerms: string;
}

interface QFPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QFPFormData) => void;
  property: PropertyListing;
  businesses: Business[];
  brokerInfo: BrokerInfo;
  isLoading?: boolean;
}

export const QFPModal: React.FC<QFPModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  property,
  businesses,
  brokerInfo,
  isLoading = false,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<QFPFormData>({
    businessId: '',
    tenantName: '',
    tenantContact: '',
    tenantEmail: '',
    tenantPhone: '',
    proposedRent: '',
    proposedTerm: '',
    proposedStartDate: '',
    landlordWork: '',
    tenantWork: '',
    additionalTerms: '',
  });

  // Update tenant info when business is selected
  useEffect(() => {
    if (formData.businessId) {
      const selectedBusiness = businesses.find((b) => b.id === formData.businessId);
      if (selectedBusiness) {
        setFormData((prev) => ({
          ...prev,
          tenantName: selectedBusiness.name,
          tenantEmail: selectedBusiness.email || '',
          tenantPhone: selectedBusiness.phone || '',
        }));
      }
    }
  }, [formData.businessId, businesses]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowPreview(false);
      setErrors({});
      setFormData({
        businessId: '',
        tenantName: '',
        tenantContact: '',
        tenantEmail: '',
        tenantPhone: '',
        proposedRent: '',
        proposedTerm: '',
        proposedStartDate: '',
        landlordWork: '',
        tenantWork: '',
        additionalTerms: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessId) {
      newErrors.businessId = 'Please select a business';
    }

    if (!formData.tenantName.trim()) {
      newErrors.tenantName = 'Tenant name is required';
    }

    if (!formData.tenantEmail.trim()) {
      newErrors.tenantEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.tenantEmail)) {
      newErrors.tenantEmail = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const handleEdit = () => {
    setShowPreview(false);
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format helpers
  const formatPrice = (price: number | null): string => {
    if (!price) return 'Contact for pricing';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatSqft = (sqft: number): string => {
    return new Intl.NumberFormat('en-US').format(sqft) + ' SF';
  };

  // Get selected business name for preview
  const getSelectedBusinessName = (): string => {
    const business = businesses.find((b) => b.id === formData.businessId);
    return business?.name || '';
  };

  // Preview mode
  if (showPreview) {
    return (
      <div
        className={styles.modalBackdrop}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.modalContainer}>
          <div className={styles.modalHeader}>
            <div>
              <h2 className={styles.modalTitle}>QFP Preview</h2>
              <p className={styles.modalSubtitle}>Review your proposal before sending</p>
            </div>
            <button className={styles.closeButton} onClick={onClose} aria-label="Close">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={styles.previewContent}>
            {/* Property Summary */}
            <div className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>Property</h3>
              <div className={styles.previewCard}>
                <h4 className={styles.previewPropertyName}>{property.title}</h4>
                <p className={styles.previewAddress}>
                  {property.address}, {property.city}, {property.state} {property.zip_code}
                </p>
                <div className={styles.previewPropertyDetails}>
                  <span>{formatSqft(property.sqft)}</span>
                  <span className={styles.separator}>|</span>
                  <span>{formatPrice(property.asking_price)}</span>
                </div>
              </div>
            </div>

            {/* Tenant Info Summary */}
            <div className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>Tenant</h3>
              <div className={styles.previewCard}>
                <p>
                  <strong>{formData.tenantName}</strong>
                </p>
                {formData.tenantContact && <p>Contact: {formData.tenantContact}</p>}
                <p>{formData.tenantEmail}</p>
                {formData.tenantPhone && <p>{formData.tenantPhone}</p>}
              </div>
            </div>

            {/* Proposed Terms */}
            <div className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>Proposed Terms</h3>
              <div className={styles.previewGrid}>
                {formData.proposedRent && (
                  <div className={styles.previewItem}>
                    <span className={styles.previewLabel}>Monthly Rent</span>
                    <span className={styles.previewValue}>{formData.proposedRent}</span>
                  </div>
                )}
                {formData.proposedTerm && (
                  <div className={styles.previewItem}>
                    <span className={styles.previewLabel}>Lease Term</span>
                    <span className={styles.previewValue}>{formData.proposedTerm}</span>
                  </div>
                )}
                {formData.proposedStartDate && (
                  <div className={styles.previewItem}>
                    <span className={styles.previewLabel}>Start Date</span>
                    <span className={styles.previewValue}>
                      {new Date(formData.proposedStartDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Work Sections */}
            {formData.landlordWork && (
              <div className={styles.previewSection}>
                <h3 className={styles.previewSectionTitle}>Landlord's Work</h3>
                <div className={styles.previewCard}>
                  <p className={styles.previewText}>{formData.landlordWork}</p>
                </div>
              </div>
            )}

            {formData.tenantWork && (
              <div className={styles.previewSection}>
                <h3 className={styles.previewSectionTitle}>Tenant's Work</h3>
                <div className={styles.previewCard}>
                  <p className={styles.previewText}>{formData.tenantWork}</p>
                </div>
              </div>
            )}

            {formData.additionalTerms && (
              <div className={styles.previewSection}>
                <h3 className={styles.previewSectionTitle}>Additional Terms</h3>
                <div className={styles.previewCard}>
                  <p className={styles.previewText}>{formData.additionalTerms}</p>
                </div>
              </div>
            )}

            {/* Broker Info */}
            <div className={styles.previewSection}>
              <h3 className={styles.previewSectionTitle}>Broker</h3>
              <div className={styles.previewCard}>
                <div className={styles.brokerInfo}>
                  {brokerInfo.photoUrl ? (
                    <img
                      src={brokerInfo.photoUrl}
                      alt={brokerInfo.name}
                      className={styles.brokerPhoto}
                    />
                  ) : (
                    <div className={styles.brokerAvatar}>
                      {brokerInfo.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                  )}
                  <div className={styles.brokerDetails}>
                    <p className={styles.brokerName}>{brokerInfo.name}</p>
                    <p className={styles.brokerCompany}>{brokerInfo.company}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleEdit}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send QFP'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form mode
  return (
    <div
      className={styles.modalBackdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Send Quick Fire Proposal</h2>
            <p className={styles.modalSubtitle}>Submit your interest in this property</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Business Selection */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Select Business</h3>
            <div className={styles.formGroup}>
              <label htmlFor="businessId" className={styles.label}>
                Business Name *
              </label>
              <select
                id="businessId"
                name="businessId"
                className={`${styles.select} ${errors.businessId ? styles.inputError : ''}`}
                value={formData.businessId}
                onChange={handleInputChange}
              >
                <option value="">Select a business</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              {errors.businessId && <p className={styles.errorText}>{errors.businessId}</p>}
            </div>
          </div>

          {/* Property Information (Auto-populated) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Property Information</h3>
            <div className={styles.propertyInfoCard}>
              <h4 className={styles.propertyName}>{property.title}</h4>
              <p className={styles.propertyAddress}>
                {property.address}, {property.city}, {property.state} {property.zip_code}
              </p>
              <div className={styles.propertyMetrics}>
                <div className={styles.propertyMetric}>
                  <span className={styles.metricLabel}>Size</span>
                  <span className={styles.metricValue}>{formatSqft(property.sqft)}</span>
                </div>
                <div className={styles.propertyMetric}>
                  <span className={styles.metricLabel}>Asking Price</span>
                  <span className={styles.metricValue}>{formatPrice(property.asking_price)}</span>
                </div>
                {property.price_per_sqft && (
                  <div className={styles.propertyMetric}>
                    <span className={styles.metricLabel}>Price/SF</span>
                    <span className={styles.metricValue}>${property.price_per_sqft}/SF</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tenant Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tenant Information</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="tenantName" className={styles.label}>
                  Tenant Name *
                </label>
                <input
                  id="tenantName"
                  name="tenantName"
                  type="text"
                  className={`${styles.input} ${errors.tenantName ? styles.inputError : ''}`}
                  value={formData.tenantName}
                  onChange={handleInputChange}
                  placeholder="Business or individual name"
                />
                {errors.tenantName && <p className={styles.errorText}>{errors.tenantName}</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tenantContact" className={styles.label}>
                  Contact Person
                </label>
                <input
                  id="tenantContact"
                  name="tenantContact"
                  type="text"
                  className={styles.input}
                  value={formData.tenantContact}
                  onChange={handleInputChange}
                  placeholder="Primary contact name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tenantEmail" className={styles.label}>
                  Email *
                </label>
                <input
                  id="tenantEmail"
                  name="tenantEmail"
                  type="email"
                  className={`${styles.input} ${errors.tenantEmail ? styles.inputError : ''}`}
                  value={formData.tenantEmail}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                />
                {errors.tenantEmail && <p className={styles.errorText}>{errors.tenantEmail}</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="tenantPhone" className={styles.label}>
                  Phone
                </label>
                <input
                  id="tenantPhone"
                  name="tenantPhone"
                  type="tel"
                  className={styles.input}
                  value={formData.tenantPhone}
                  onChange={handleInputChange}
                  placeholder="(305) 555-1234"
                />
              </div>
            </div>
          </div>

          {/* Proposed Terms */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Proposed Terms</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="proposedRent" className={styles.label}>
                  Proposed Monthly Rent
                </label>
                <input
                  id="proposedRent"
                  name="proposedRent"
                  type="text"
                  className={styles.input}
                  value={formData.proposedRent}
                  onChange={handleInputChange}
                  placeholder="$10,000"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="proposedTerm" className={styles.label}>
                  Proposed Lease Term
                </label>
                <select
                  id="proposedTerm"
                  name="proposedTerm"
                  className={styles.select}
                  value={formData.proposedTerm}
                  onChange={handleInputChange}
                >
                  <option value="">Select term</option>
                  <option value="1 year">1 year</option>
                  <option value="2 years">2 years</option>
                  <option value="3 years">3 years</option>
                  <option value="5 years">5 years</option>
                  <option value="7 years">7 years</option>
                  <option value="10 years">10 years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="proposedStartDate" className={styles.label}>
                  Proposed Start Date
                </label>
                <input
                  id="proposedStartDate"
                  name="proposedStartDate"
                  type="date"
                  className={styles.input}
                  value={formData.proposedStartDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Landlord's Work */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Landlord's Work</h3>
            <div className={styles.formGroup}>
              <label htmlFor="landlordWork" className={styles.label}>
                Work to be performed by landlord
              </label>
              <textarea
                id="landlordWork"
                name="landlordWork"
                className={styles.textarea}
                value={formData.landlordWork}
                onChange={handleInputChange}
                placeholder="Describe any build-out, improvements, or work you expect the landlord to perform..."
                rows={4}
              />
            </div>
          </div>

          {/* Tenant's Work */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tenant's Work</h3>
            <div className={styles.formGroup}>
              <label htmlFor="tenantWork" className={styles.label}>
                Work to be performed by tenant
              </label>
              <textarea
                id="tenantWork"
                name="tenantWork"
                className={styles.textarea}
                value={formData.tenantWork}
                onChange={handleInputChange}
                placeholder="Describe any build-out, improvements, or work you will perform as the tenant..."
                rows={4}
              />
            </div>
          </div>

          {/* Additional Terms */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Additional Terms</h3>
            <div className={styles.formGroup}>
              <label htmlFor="additionalTerms" className={styles.label}>
                Additional Terms & Conditions
              </label>
              <textarea
                id="additionalTerms"
                name="additionalTerms"
                className={styles.textarea}
                value={formData.additionalTerms}
                onChange={handleInputChange}
                placeholder="Any other terms, conditions, or special requests..."
                rows={4}
              />
            </div>
          </div>

          {/* Broker Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Broker Information</h3>
            <div className={styles.brokerCard}>
              <div className={styles.brokerInfo}>
                {brokerInfo.photoUrl ? (
                  <img
                    src={brokerInfo.photoUrl}
                    alt={brokerInfo.name}
                    className={styles.brokerPhoto}
                  />
                ) : (
                  <div className={styles.brokerAvatar}>
                    {brokerInfo.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                )}
                <div className={styles.brokerDetails}>
                  <p className={styles.brokerName}>{brokerInfo.name}</p>
                  <p className={styles.brokerCompany}>{brokerInfo.company}</p>
                  <p className={styles.brokerContact}>{brokerInfo.email}</p>
                  <p className={styles.brokerContact}>{brokerInfo.phone}</p>
                </div>
              </div>
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
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePreview}
              className={styles.submitButton}
              disabled={isLoading}
            >
              Preview QFP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
