/**
 * Rebranding Tests: zyx → waltre
 *
 * Tests to verify that all branding has been updated from "zyx" to "waltre"
 * throughout the application.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { SignupModal } from '../components/SignupModal';

describe('Rebranding: zyx → waltre', () => {
  describe('Logo Component', () => {
    it('should render "waltre" text with search icon', () => {
      render(
        <BrowserRouter>
          <Logo />
        </BrowserRouter>
      );

      const logoLink = screen.getByRole('link', { name: /waltre logo/i });
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveTextContent(/waltre/i);
      expect(logoLink).toHaveTextContent('🔍');
    });

    it('should have aria-label "waltre logo - Go to dashboard"', () => {
      render(
        <BrowserRouter>
          <Logo />
        </BrowserRouter>
      );

      const logoLink = screen.getByRole('link', { name: /waltre logo/i });
      expect(logoLink).toHaveAttribute('aria-label', 'waltre logo - Go to dashboard');
    });

    it('should not contain "zyx" text', () => {
      const { container } = render(
        <BrowserRouter>
          <Logo />
        </BrowserRouter>
      );

      const text = container.textContent || '';
      expect(text.toLowerCase()).not.toContain('zyx');
    });
  });

  describe('SignupModal Component', () => {
    const mockProps = {
      isOpen: true,
      onClose: jest.fn(),
      onSwitchToLogin: jest.fn(),
      onSignupSuccess: jest.fn(),
      initialRole: null
    };

    it('should contain "Waltre" in modal subtitle', () => {
      render(<SignupModal {...mockProps} />);

      const subtitle = screen.getByText(/Get started with Waltre/i);
      expect(subtitle).toBeInTheDocument();
    });

    it('should not contain "ZYX" text in modal', () => {
      const { container } = render(<SignupModal {...mockProps} />);

      const text = container.textContent || '';
      expect(text).not.toContain('ZYX');
      expect(text).not.toContain('zyx');
    });
  });

  describe('No Remaining "zyx" References', () => {
    it('Logo should not have any "zyx" references', () => {
      const { container } = render(
        <BrowserRouter>
          <Logo />
        </BrowserRouter>
      );

      const allText = container.textContent || '';
      expect(allText.toLowerCase()).not.toMatch(/\bzyx\b/);
    });

    it('SignupModal should not have any "zyx" references', () => {
      const mockProps = {
        isOpen: true,
        onClose: jest.fn(),
        onSwitchToLogin: jest.fn(),
        onSignupSuccess: jest.fn(),
        initialRole: null
      };

      const { container } = render(<SignupModal {...mockProps} />);

      const allText = container.textContent || '';
      expect(allText.toLowerCase()).not.toMatch(/\bzyx\b/);
    });
  });
});
