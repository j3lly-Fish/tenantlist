import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { SignupModal } from '../components/SignupModal';

// Mock fetch
global.fetch = jest.fn();

describe('SignupModal - Figma Alignment Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSwitchToLogin: jest.fn(),
    onSignupSuccess: jest.fn()
  };

  describe('Role Selection Position', () => {
    test('role selection appears ABOVE email/password fields', () => {
      render(<SignupModal {...mockProps} />);

      const roleSection = screen.getByTestId('role-selection-section');
      const credentialsSection = screen.getByTestId('credentials-section');

      // Get the parent form using querySelector
      const form = document.querySelector('.modal-form');
      expect(form).toBeTruthy();

      const formChildren = form ? Array.from(form.children) : [];

      // Find indices of role and credentials sections
      const roleSectionIndex = formChildren.findIndex(
        child => child.getAttribute('data-testid') === 'role-selection-section'
      );
      const credentialsSectionIndex = formChildren.findIndex(
        child => child.getAttribute('data-testid') === 'credentials-section'
      );

      // Role section should come before credentials section
      expect(roleSectionIndex).toBeGreaterThanOrEqual(0);
      expect(credentialsSectionIndex).toBeGreaterThanOrEqual(0);
      expect(roleSectionIndex).toBeLessThan(credentialsSectionIndex);
    });
  });

  describe('Role Options Icons', () => {
    test('Tenants/Franchisers role has Person icon', () => {
      render(<SignupModal {...mockProps} />);

      const tenantCard = screen.getByTestId('role-card-tenant');
      const icon = within(tenantCard).getByTestId('role-icon-person');

      expect(icon).toBeInTheDocument();
    });

    test('Landlords/Asset Managers role has Building icon', () => {
      render(<SignupModal {...mockProps} />);

      const landlordCard = screen.getByTestId('role-card-landlord');
      const icon = within(landlordCard).getByTestId('role-icon-building');

      expect(icon).toBeInTheDocument();
    });

    test('Brokerage/Agents role has Briefcase icon', () => {
      render(<SignupModal {...mockProps} />);

      const brokerCard = screen.getByTestId('role-card-broker');
      const icon = within(brokerCard).getByTestId('role-icon-briefcase');

      expect(icon).toBeInTheDocument();
    });
  });

  describe('Role Labels and Descriptions', () => {
    test('tenant role label matches spec: "Tenants / Franchisers"', () => {
      render(<SignupModal {...mockProps} />);

      expect(screen.getByText('Tenants / Franchisers')).toBeInTheDocument();
    });

    test('tenant role description matches spec', () => {
      render(<SignupModal {...mockProps} />);

      expect(screen.getByText('List your brands and CRE demands')).toBeInTheDocument();
    });

    test('landlord role label matches spec: "Landlords / Asset Managers"', () => {
      render(<SignupModal {...mockProps} />);

      expect(screen.getByText('Landlords / Asset Managers')).toBeInTheDocument();
    });

    test('landlord role description matches spec', () => {
      render(<SignupModal {...mockProps} />);

      expect(screen.getByText('Manage vacancies and properties')).toBeInTheDocument();
    });

    test('broker role label matches spec: "Brokerage / Agents"', () => {
      render(<SignupModal {...mockProps} />);

      expect(screen.getByText('Brokerage / Agents')).toBeInTheDocument();
    });

    test('broker role description matches spec', () => {
      render(<SignupModal {...mockProps} />);

      expect(screen.getByText('Expand your network and deal pipeline')).toBeInTheDocument();
    });
  });

  describe('Role Selection Required', () => {
    test('shows error when submitting without role selection', async () => {
      render(<SignupModal {...mockProps} />);

      // Fill in email and password but do not select role
      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'Test123!@' }
      });

      // Submit form
      fireEvent.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(screen.getByText('Please select a role')).toBeInTheDocument();
      });
    });
  });

  describe('Card-Style Selection', () => {
    test('role cards have card styling (not radio buttons)', () => {
      render(<SignupModal {...mockProps} />);

      const roleCards = screen.getAllByTestId(/^role-card-/);

      roleCards.forEach(card => {
        expect(card).toHaveClass('role-card');
        expect(card).toHaveClass('role-card-styled');
      });
    });

    test('selected role card has selected state styling', () => {
      render(<SignupModal {...mockProps} />);

      const tenantCard = screen.getByTestId('role-card-tenant');
      fireEvent.click(tenantCard);

      expect(tenantCard).toHaveClass('selected');
    });
  });
});
