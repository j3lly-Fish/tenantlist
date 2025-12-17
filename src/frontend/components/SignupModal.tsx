import React, { useState } from 'react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import './AuthModals.css';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSignupSuccess: (data: { email: string; role: string; userId: string }) => void;
}

type UserRole = 'tenant' | 'landlord' | 'broker';

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onSignupSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; role?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const roles = [
    { value: 'tenant', title: 'Tenant', subtitle: 'Looking for commercial space' },
    { value: 'landlord', title: 'Landlord', subtitle: 'List and manage properties' },
    { value: 'broker', title: 'Broker', subtitle: 'Represent tenants and landlords' }
  ];

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; role?: string } = {};

    if (!selectedRole) {
      newErrors.role = 'Please select a role';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Signup failed');
      }

      // Signup successful - pass user data to parent to open profile completion modal
      onSignupSuccess({
        email,
        role: selectedRole as string,
        userId: data.user.id
      });
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred during signup' });
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
      aria-labelledby="signup-modal-title"
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
          <h2 id="signup-modal-title" className="modal-title">Create your account</h2>
          <p className="modal-subtitle">Get started with ZYX</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="error-message general" role="alert" aria-live="polite">
              {errors.general}
            </div>
          )}

          <div className="form-section">
            <div className="form-group">
              <label htmlFor="signup-email" className="sr-only">Email</label>
              <input
                id="signup-email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
              />
              {errors.email && (
                <span id="signup-email-error" className="error-message" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="signup-password" className="sr-only">Password</label>
              <input
                id="signup-password"
                type="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'signup-password-error' : undefined}
              />
              <PasswordStrengthIndicator password={password} />
              {errors.password && (
                <span id="signup-password-error" className="error-message" role="alert">
                  {errors.password}
                </span>
              )}
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-section">
            <h3 className="section-label">Select your role</h3>
            {errors.role && (
              <span className="error-message" role="alert">
                {errors.role}
              </span>
            )}
            <div className="role-cards">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  className={`role-card ${selectedRole === role.value ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(role.value as UserRole)}
                  aria-pressed={selectedRole === role.value}
                >
                  <div className="role-radio">
                    <div className={`radio-button ${selectedRole === role.value ? 'filled' : ''}`} />
                  </div>
                  <div className="role-content">
                    <div className="role-title">{role.title}</div>
                    <div className="role-subtitle">{role.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="modal-footer-text">
            Already have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
