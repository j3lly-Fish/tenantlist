import React, { useState, useEffect } from 'react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import './AuthModals.css';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSignupSuccess: (data: { email: string; role: string; userId: string }) => void;
  initialRole?: UserRole | null;
}

type UserRole = 'tenant' | 'landlord' | 'broker';

// SVG Icons for role cards
const PersonIcon = () => (
  <svg
    data-testid="role-icon-person"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="role-icon"
  >
    <path
      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg
    data-testid="role-icon-building"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="role-icon"
  >
    <path
      d="M3 21H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 21V15H15V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 7H9.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 7H15.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 11H9.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 11H15.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BriefcaseIcon = () => (
  <svg
    data-testid="role-icon-briefcase"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="role-icon"
  >
    <path
      d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onSignupSuccess,
  initialRole = null
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; role?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Update selectedRole when initialRole changes
  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole);
      setEmail('');
      setPassword('');
      setErrors({});
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  // Updated roles with new labels, descriptions, and icons per Figma spec
  const roles: Array<{
    value: UserRole;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }> = [
    {
      value: 'tenant',
      title: 'Tenants / Franchisers',
      subtitle: 'List your brands and CRE demands',
      icon: <PersonIcon />
    },
    {
      value: 'landlord',
      title: 'Landlords / Asset Managers',
      subtitle: 'Manage vacancies and properties',
      icon: <BuildingIcon />
    },
    {
      value: 'broker',
      title: 'Brokerage / Agents',
      subtitle: 'Expand your network and deal pipeline',
      icon: <BriefcaseIcon />
    }
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

          {/* Role Selection Section - Now ABOVE credentials */}
          <div className="form-section" data-testid="role-selection-section">
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
                  data-testid={`role-card-${role.value}`}
                  className={`role-card role-card-styled ${selectedRole === role.value ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(role.value)}
                  aria-pressed={selectedRole === role.value}
                >
                  <div className="role-icon-wrapper">
                    {role.icon}
                  </div>
                  <div className="role-content">
                    <div className="role-title">{role.title}</div>
                    <div className="role-subtitle">{role.subtitle}</div>
                  </div>
                  <div className="role-check">
                    {selectedRole === role.value && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="check-icon"
                      >
                        <circle cx="10" cy="10" r="10" fill="#007AFF" />
                        <path
                          d="M6 10L8.5 12.5L14 7"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="form-divider" />

          {/* Credentials Section - Now BELOW role selection */}
          <div className="form-section" data-testid="credentials-section">
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
