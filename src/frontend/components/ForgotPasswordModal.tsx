import React, { useState } from 'react';
import './AuthModals.css';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin
}) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.status === 429) {
        setErrors({ general: 'Too many requests. Please try again later.' });
        return;
      }

      setIsSuccess(true);
    } catch (error) {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
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

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-modal-title"
    >
      <div className="modal-container">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>

        <div className="modal-header">
          <h2 id="forgot-password-modal-title" className="modal-title">Forgot Password?</h2>
          <p className="modal-subtitle">Enter your email and we'll send you a reset link</p>
        </div>

        {isSuccess ? (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <p className="success-message">Check your email for reset instructions</p>
            <button
              type="button"
              className="link-button"
              onClick={onBackToLogin}
            >
              Back to login
            </button>
          </div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="error-message general" role="alert" aria-live="polite">
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="forgot-email" className="sr-only">Email</label>
              <input
                id="forgot-email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'forgot-email-error' : undefined}
              />
              {errors.email && (
                <span id="forgot-email-error" className="error-message" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <p className="modal-footer-text">
              <button
                type="button"
                className="link-button"
                onClick={onBackToLogin}
              >
                Back to login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
