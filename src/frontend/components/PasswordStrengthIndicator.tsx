import React from 'react';
import './PasswordStrengthIndicator.css';

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = 'weak' | 'medium' | 'strong' | 'none';

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const calculateStrength = (): StrengthLevel => {
    if (!password) return 'none';

    let score = 0;

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  };

  const strength = calculateStrength();

  if (strength === 'none') return null;

  const getStrengthText = (): string => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  const getStrengthColor = (): string => {
    switch (strength) {
      case 'weak': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'strong': return '#28a745';
      default: return '#e0e0e0';
    }
  };

  return (
    <div className="password-strength-indicator" aria-live="polite">
      <div className="strength-bar-container">
        <div
          className={`strength-bar ${strength}`}
          style={{ backgroundColor: getStrengthColor() }}
          role="progressbar"
          aria-valuenow={strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className={`strength-text ${strength}`}>
        {getStrengthText()}
      </span>
    </div>
  );
};
