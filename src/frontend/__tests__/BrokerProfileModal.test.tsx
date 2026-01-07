import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrokerProfileModal } from '@components/BrokerProfileModal';
import * as apiClient from '@utils/apiClient';

// Mock API client
jest.mock('@utils/apiClient', () => ({
  createBrokerProfile: jest.fn(),
  updateBrokerProfile: jest.fn(),
}));

const mockProfile = {
  id: '1',
  user_id: 'user1',
  company_name: 'ABC Realty',
  license_number: '12345',
  license_state: 'CA',
  specialties: ['Retail', 'Office'],
  bio: 'Experienced commercial broker',
  website_url: 'https://abcrealty.com',
  years_experience: 10,
  total_deals_closed: 50,
  total_commission_earned: 1000000,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('BrokerProfileModal', () => {
  const mockOnClose = jest.fn();
  const mockOnProfileSaved = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('does not render when isOpen is false', () => {
      render(
        <BrokerProfileModal
          isOpen={false}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      expect(screen.queryByText('Create Broker Profile')).not.toBeInTheDocument();
    });

    it('renders create mode title and subtitle', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      expect(screen.getByText('Create Broker Profile')).toBeInTheDocument();
      expect(screen.getByText('Complete your professional profile')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/license number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/license state/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/years of experience/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/specialties/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/professional bio/i)).toBeInTheDocument();
    });

    it('shows required indicator for company name', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('validates required company name field', async () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const submitButton = screen.getByText('Create Profile');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
      });
    });

    it('validates website URL format', async () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      const websiteInput = screen.getByLabelText(/website url/i);

      fireEvent.change(companyInput, { target: { value: 'Test Company' } });
      fireEvent.change(websiteInput, { target: { value: 'invalid-url' } });

      const submitButton = screen.getByText('Create Profile');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
      });
    });

    it('validates years of experience range', async () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      const experienceInput = screen.getByLabelText(/years of experience/i);

      fireEvent.change(companyInput, { target: { value: 'Test Company' } });
      fireEvent.change(experienceInput, { target: { value: '150' } });

      const submitButton = screen.getByText('Create Profile');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/years of experience must be between 0 and 100/i)).toBeInTheDocument();
      });
    });

    it('renders specialty buttons', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      expect(screen.getByText('Retail')).toBeInTheDocument();
      expect(screen.getByText('Office')).toBeInTheDocument();
      expect(screen.getByText('Industrial')).toBeInTheDocument();
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
    });

    it('toggles specialty selection', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const retailButton = screen.getByRole('button', { name: 'Retail' });

      // Click to select
      fireEvent.click(retailButton);
      expect(retailButton).toHaveClass('specialtySelected');

      // Click to deselect
      fireEvent.click(retailButton);
      expect(retailButton).not.toHaveClass('specialtySelected');
    });

    it('calls createBrokerProfile on successful submission', async () => {
      const mockCreate = apiClient.createBrokerProfile as jest.Mock;
      mockCreate.mockResolvedValue(mockProfile);

      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      fireEvent.change(companyInput, { target: { value: 'ABC Realty' } });

      const submitButton = screen.getByText('Create Profile');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            company_name: 'ABC Realty',
          })
        );
        expect(mockOnProfileSaved).toHaveBeenCalledWith(mockProfile);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('displays error message on API failure', async () => {
      const mockCreate = apiClient.createBrokerProfile as jest.Mock;
      mockCreate.mockRejectedValue(new Error('Failed to create profile'));

      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      fireEvent.change(companyInput, { target: { value: 'ABC Realty' } });

      const submitButton = screen.getByText('Create Profile');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create profile')).toBeInTheDocument();
      });
    });

    it('disables form during submission', async () => {
      const mockCreate = apiClient.createBrokerProfile as jest.Mock;
      mockCreate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      fireEvent.change(companyInput, { target: { value: 'ABC Realty' } });

      const submitButton = screen.getByText('Create Profile');
      fireEvent.click(submitButton);

      expect(submitButton).toHaveTextContent('Saving...');
      expect(companyInput).toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    it('renders edit mode title when existing profile provided', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
          existingProfile={mockProfile}
        />
      );

      expect(screen.getByText('Edit Broker Profile')).toBeInTheDocument();
      expect(screen.getByText('Update your professional information')).toBeInTheDocument();
    });

    it('pre-fills form with existing profile data', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
          existingProfile={mockProfile}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i) as HTMLInputElement;
      expect(companyInput.value).toBe('ABC Realty');

      const licenseInput = screen.getByLabelText(/license number/i) as HTMLInputElement;
      expect(licenseInput.value).toBe('12345');

      const stateSelect = screen.getByLabelText(/license state/i) as HTMLSelectElement;
      expect(stateSelect.value).toBe('CA');

      const experienceInput = screen.getByLabelText(/years of experience/i) as HTMLInputElement;
      expect(experienceInput.value).toBe('10');

      const websiteInput = screen.getByLabelText(/website url/i) as HTMLInputElement;
      expect(websiteInput.value).toBe('https://abcrealty.com');
    });

    it('pre-selects specialties from existing profile', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
          existingProfile={mockProfile}
        />
      );

      const retailButton = screen.getByRole('button', { name: 'Retail' });
      const officeButton = screen.getByRole('button', { name: 'Office' });

      expect(retailButton).toHaveClass('specialtySelected');
      expect(officeButton).toHaveClass('specialtySelected');
    });

    it('calls updateBrokerProfile on successful edit', async () => {
      const mockUpdate = apiClient.updateBrokerProfile as jest.Mock;
      mockUpdate.mockResolvedValue({ ...mockProfile, company_name: 'Updated Realty' });

      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
          existingProfile={mockProfile}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      fireEvent.change(companyInput, { target: { value: 'Updated Realty' } });

      const submitButton = screen.getByText('Update Profile');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockOnProfileSaved).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Interactions', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when cancel button is clicked', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking backdrop', () => {
      const { container } = render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const backdrop = container.querySelector('[role="dialog"]');
      fireEvent.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close when clicking modal content', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const modalTitle = screen.getByText('Create Broker Profile');
      fireEvent.click(modalTitle);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Character Counter', () => {
    it('displays bio character count', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      expect(screen.getByText('0 / 1000 characters')).toBeInTheDocument();
    });

    it('updates character count as user types', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const bioInput = screen.getByLabelText(/professional bio/i);
      fireEvent.change(bioInput, { target: { value: 'Test bio' } });

      expect(screen.getByText('8 / 1000 characters')).toBeInTheDocument();
    });
  });

  describe('State Dropdown', () => {
    it('renders all US states', () => {
      render(
        <BrokerProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onProfileSaved={mockOnProfileSaved}
        />
      );

      const stateSelect = screen.getByLabelText(/license state/i);
      const options = Array.from(stateSelect.querySelectorAll('option'));

      // Should have 51 options (1 placeholder + 50 states)
      expect(options.length).toBe(51);
      expect(options[0].textContent).toBe('Select state');
    });
  });
});
