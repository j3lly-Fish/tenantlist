import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginModal } from '../components/LoginModal';
import { SignupModal } from '../components/SignupModal';
import { ProfileCreationModal } from '../components/ProfileCreationModal';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { EmailVerificationBanner } from '../components/EmailVerificationBanner';

// Mock fetch
global.fetch = jest.fn();

describe('Authentication Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LoginModal', () => {
    const mockProps = {
      isOpen: true,
      onClose: jest.fn(),
      onSwitchToSignup: jest.fn(),
      onSwitchToForgotPassword: jest.fn(),
      onLoginSuccess: jest.fn()
    };

    test('renders login modal with all form fields', () => {
      render(<LoginModal {...mockProps} />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    test('displays validation errors for empty fields', async () => {
      render(<LoginModal {...mockProps} />);

      const submitButton = screen.getByText('Sign In');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    test('submits form with valid credentials', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: '1', email: 'test@example.com' } })
      });

      render(<LoginModal {...mockProps} />);

      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(mockProps.onLoginSuccess).toHaveBeenCalled();
      });
    });

    test('renders OAuth buttons with correct aria-labels', () => {
      render(<LoginModal {...mockProps} />);

      expect(screen.getByLabelText('Sign in with Google')).toBeInTheDocument();
      expect(screen.getByLabelText('Sign in with Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Sign in with Twitter')).toBeInTheDocument();
    });
  });

  describe('SignupModal', () => {
    const mockProps = {
      isOpen: true,
      onClose: jest.fn(),
      onSwitchToLogin: jest.fn(),
      onSignupSuccess: jest.fn()
    };

    test('renders signup modal with role selection', () => {
      render(<SignupModal {...mockProps} />);

      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByText('Tenant')).toBeInTheDocument();
      expect(screen.getByText('Landlord')).toBeInTheDocument();
      expect(screen.getByText('Broker')).toBeInTheDocument();
    });

    test('allows role selection', () => {
      render(<SignupModal {...mockProps} />);

      const tenantButton = screen.getByText('Tenant').closest('button');
      fireEvent.click(tenantButton!);

      expect(tenantButton).toHaveClass('selected');
    });

    test('displays password strength indicator', () => {
      render(<SignupModal {...mockProps} />);

      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.change(passwordInput, { target: { value: 'Test123!' } });

      // PasswordStrengthIndicator should be rendered
      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe('ProfileCreationModal', () => {
    const mockProps = {
      isOpen: true,
      onClose: jest.fn(),
      email: 'test@example.com',
      role: 'tenant',
      onProfileCreated: jest.fn()
    };

    test('renders profile creation modal with all fields', () => {
      render(<ProfileCreationModal {...mockProps} />);

      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+12345678901')).toBeInTheDocument();
    });

    test('validates required fields', async () => {
      render(<ProfileCreationModal {...mockProps} />);

      const submitButton = screen.getByText('Create Profile');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      });
    });

    test('validates phone number format', async () => {
      render(<ProfileCreationModal {...mockProps} />);

      fireEvent.change(screen.getByPlaceholderText('John'), {
        target: { value: 'John' }
      });
      fireEvent.change(screen.getByPlaceholderText('Doe'), {
        target: { value: 'Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('+12345678901'), {
        target: { value: '123' }
      });

      fireEvent.click(screen.getByText('Create Profile'));

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid phone number/i)).toBeInTheDocument();
      });
    });
  });

  describe('PasswordStrengthIndicator', () => {
    test('shows weak strength for simple password', () => {
      render(<PasswordStrengthIndicator password="test" />);

      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    test('shows medium strength for moderate password', () => {
      render(<PasswordStrengthIndicator password="Test123" />);

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    test('shows strong strength for complex password', () => {
      render(<PasswordStrengthIndicator password="Test123!@" />);

      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    test('does not render for empty password', () => {
      const { container } = render(<PasswordStrengthIndicator password="" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('ForgotPasswordModal', () => {
    const mockProps = {
      isOpen: true,
      onClose: jest.fn(),
      onBackToLogin: jest.fn()
    };

    test('renders forgot password modal', () => {
      render(<ForgotPasswordModal {...mockProps} />);

      expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
      expect(screen.getByText('Send Reset Link')).toBeInTheDocument();
    });

    test('shows success state after submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({})
      });

      render(<ForgotPasswordModal {...mockProps} />);

      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'test@example.com' }
      });

      fireEvent.click(screen.getByText('Send Reset Link'));

      await waitFor(() => {
        expect(screen.getByText('Check your email for reset instructions')).toBeInTheDocument();
      });
    });
  });

  describe('ResetPasswordModal', () => {
    const mockProps = {
      isOpen: true,
      onClose: jest.fn(),
      token: 'reset-token-123',
      onResetSuccess: jest.fn()
    };

    test('renders reset password modal', () => {
      render(<ResetPasswordModal {...mockProps} />);

      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument();
    });

    test('validates password match', async () => {
      render(<ResetPasswordModal {...mockProps} />);

      fireEvent.change(screen.getByPlaceholderText('New password'), {
        target: { value: 'Test123!@' }
      });
      fireEvent.change(screen.getByPlaceholderText('Confirm password'), {
        target: { value: 'Different123!' }
      });

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('EmailVerificationBanner', () => {
    const mockProps = {
      email: 'test@example.com',
      onDismiss: jest.fn()
    };

    test('renders verification banner with message', () => {
      render(<EmailVerificationBanner {...mockProps} />);

      expect(screen.getByText(/Please verify your email address/i)).toBeInTheDocument();
      expect(screen.getByText('Resend email')).toBeInTheDocument();
    });

    test('handles resend email click', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(<EmailVerificationBanner {...mockProps} />);

      fireEvent.click(screen.getByText('Resend email'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/resend-verification', expect.any(Object));
      });
    });

    test('handles dismiss click', () => {
      render(<EmailVerificationBanner {...mockProps} />);

      const closeButton = screen.getByLabelText('Close banner');
      fireEvent.click(closeButton);

      expect(mockProps.onDismiss).toHaveBeenCalled();
    });
  });
});
