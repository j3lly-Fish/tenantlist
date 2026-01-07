import React, { useState } from 'react';
import apiClient from '@utils/apiClient';
import styles from './TenantRequestForm.module.css';

interface TenantRequestFormProps {
  tenantId: string;
  tenantName: string;
  onRequestSubmit?: (data: { email: string; pin: string }) => void;
}

/**
 * TenantRequestForm Component
 *
 * Form for requesting admin approval to add tenant
 */
export const TenantRequestForm: React.FC<TenantRequestFormProps> = ({
  tenantId,
  tenantName,
  onRequestSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    pin?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; pin?: string } = {};

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    // PIN validation
    if (!pin.trim()) {
      errors.pin = 'PIN is required';
    } else if (!/^\d{3}$/.test(pin)) {
      errors.pin = 'PIN must be exactly 3 digits';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.post(
        `/api/broker/tenants/${tenantId}/request`,
        {
          tenant_email: email,
          tenant_pin: pin,
        }
      );

      if (response.success) {
        setSuccess(true);
        setEmail('');
        setPin('');

        if (onRequestSubmit) {
          onRequestSubmit({ email, pin });
        }

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(response.error || 'Failed to submit request');
      }
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow digits and max 3 characters
    const cleaned = value.replace(/\D/g, '').substring(0, 3);
    setPin(cleaned);
    // Clear validation error when user types
    if (validationErrors.pin) {
      setValidationErrors({ ...validationErrors, pin: undefined });
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Clear validation error when user types
    if (validationErrors.email) {
      setValidationErrors({ ...validationErrors, email: undefined });
    }
  };

  return (
    <div className={styles.requestForm}>
      <h3 className={styles.title}>Request administrative approval to add this tenant</h3>
      <p className={styles.description}>
        To ensure quality control, all brokers seeking to add enterprise level tenants
        must submit the tenant's 3 digit pin and email address for approval.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Email Input */}
        <div className={styles.formGroup}>
          <label htmlFor="tenant-email" className={styles.label}>
            Tenant Email <span className={styles.required}>*</span>
          </label>
          <input
            id="tenant-email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="tenant@example.com"
            className={`${styles.input} ${validationErrors.email ? styles.inputError : ''}`}
            disabled={loading}
          />
          {validationErrors.email && (
            <span className={styles.errorText}>{validationErrors.email}</span>
          )}
        </div>

        {/* PIN Input */}
        <div className={styles.formGroup}>
          <label htmlFor="tenant-pin" className={styles.label}>
            Tenant Pin <span className={styles.required}>*</span>
          </label>
          <input
            id="tenant-pin"
            type="text"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            placeholder="123"
            maxLength={3}
            className={`${styles.input} ${validationErrors.pin ? styles.inputError : ''}`}
            disabled={loading}
          />
          {validationErrors.pin && (
            <span className={styles.errorText}>{validationErrors.pin}</span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                fill="currentColor"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className={styles.successMessage}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM8 14L4 10L5.4 8.6L8 11.2L14.6 4.6L16 6L8 14Z"
                fill="currentColor"
              />
            </svg>
            Request submitted successfully! Awaiting admin approval.
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className={styles.spinner} />
              Submitting...
            </>
          ) : (
            'Send for Review'
          )}
        </button>
      </form>
    </div>
  );
};
