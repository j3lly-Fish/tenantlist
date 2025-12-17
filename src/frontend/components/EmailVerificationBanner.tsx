import React, { useState } from 'react';
import './EmailVerificationBanner.css';

interface EmailVerificationBannerProps {
  email: string;
  onDismiss: () => void;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  email,
  onDismiss
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Verification email sent!');
      } else if (response.status === 429) {
        setMessage('Too many requests. Please try again later.');
      } else {
        setMessage('Failed to send email. Please try again.');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="email-verification-banner" role="alert" aria-live="polite">
      <div className="banner-content">
        <div className="banner-left">
          <span className="warning-icon" aria-hidden="true">⚠️</span>
          <span className="banner-message">
            Please verify your email address. Check your inbox for the verification link.
          </span>
        </div>
        <div className="banner-right">
          {message ? (
            <span className="resend-message">{message}</span>
          ) : (
            <button
              type="button"
              className="resend-button"
              onClick={handleResend}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Resend email'}
            </button>
          )}
          <button
            type="button"
            className="close-button"
            onClick={onDismiss}
            aria-label="Close banner"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
};
