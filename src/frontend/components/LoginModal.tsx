import React, { useState } from 'react';
import './AuthModals.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
  onLoginSuccess: (user: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignup,
  onSwitchToForgotPassword,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe: false }),
      });

      const data = await response.json();

      console.log('📡 Login API Response:', data);

      if (!response.ok) {
        if (response.status === 401) {
          setErrors({ general: 'Invalid email or password' });
        } else if (response.status === 429) {
          setErrors({ general: 'Too many login attempts. Please try again in 15 minutes.' });
        } else {
          setErrors({ general: data.message || 'An error occurred. Please try again.' });
        }
        return;
      }

      console.log('✅ Login successful, calling onLoginSuccess with:', data.user);

      // Close modal first
      onClose();

      // Then call login success handler
      onLoginSuccess(data.user);
    } catch (error) {
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'facebook' | 'twitter') => {
    window.location.href = `/api/auth/oauth/${provider}`;
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
      aria-labelledby="login-modal-title"
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
          <h2 id="login-modal-title" className="modal-title">Welcome Back</h2>
          <p className="modal-subtitle">Sign in to your ZYX account</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="error-message general" role="alert" aria-live="polite">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="login-email" className="sr-only">Email</label>
            <input
              id="login-email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
            {errors.email && (
              <span id="login-email-error" className="error-message" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="sr-only">Password</label>
            <div className="password-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <span id="login-password-error" className="error-message" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <div className="form-footer">
            <button
              type="button"
              className="link-button forgot-password"
              onClick={onSwitchToForgotPassword}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <div className="oauth-buttons">
            <button
              type="button"
              className="oauth-btn"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              aria-label="Sign in with Google"
            >
              G
            </button>
            <button
              type="button"
              className="oauth-btn"
              onClick={() => handleOAuthLogin('facebook')}
              disabled={isLoading}
              aria-label="Sign in with Facebook"
            >
              f
            </button>
            <button
              type="button"
              className="oauth-btn"
              onClick={() => handleOAuthLogin('twitter')}
              disabled={isLoading}
              aria-label="Sign in with Twitter"
            >
              X
            </button>
          </div>

          <p className="modal-footer-text">
            Don't have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToSignup}
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
