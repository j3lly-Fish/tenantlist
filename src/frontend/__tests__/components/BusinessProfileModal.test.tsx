import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BusinessProfileModal } from '../../components/broker/BusinessProfileModal';
import apiClient from '@utils/apiClient';

// Mock apiClient
jest.mock('@utils/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('BusinessProfileModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1: Basic Information', () => {
    it('should render step 1 with all form fields', () => {
      render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Check header
      expect(screen.getByText('Create Business Profile')).toBeInTheDocument();
      expect(screen.getByText('1 of 2: Basic Information')).toBeInTheDocument();

      // Check form fields
      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Established Year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/State/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Website URL/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Instagram URL/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/LinkedIn URL/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/About/i)).toBeInTheDocument();

      // Check stats display
      expect(screen.getByText('Business Stats')).toBeInTheDocument();
      expect(screen.getByText('Offices')).toBeInTheDocument();
      expect(screen.getByText('Agents')).toBeInTheDocument();
      expect(screen.getByText('Tenants')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();

      // Check buttons
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
    });

    it('should validate required fields on Next click', async () => {
      render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
      });
    });

    it('should validate established year range', async () => {
      render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const companyNameInput = screen.getByLabelText(/Company Name/i);
      const yearInput = screen.getByLabelText(/Established Year/i);
      const nextButton = screen.getByRole('button', { name: /Next/i });

      fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
      fireEvent.change(yearInput, { target: { value: '1500' } });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Year must be between 1800/i)).toBeInTheDocument();
      });
    });

    it('should validate URL formats', async () => {
      render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const companyNameInput = screen.getByLabelText(/Company Name/i);
      const websiteInput = screen.getByLabelText(/Website URL/i);
      const nextButton = screen.getByRole('button', { name: /Next/i });

      fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
      fireEvent.change(websiteInput, { target: { value: 'invalid-url' } });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
      });
    });

    it('should navigate to step 2 when validation passes', async () => {
      render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const companyNameInput = screen.getByLabelText(/Company Name/i);
      const nextButton = screen.getByRole('button', { name: /Next/i });

      fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('2 of 2: Team Management')).toBeInTheDocument();
        expect(screen.getByText('Invite team members')).toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Team Management', () => {
    const navigateToStep2 = async () => {
      render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const companyNameInput = screen.getByLabelText(/Company Name/i);
      const nextButton = screen.getByRole('button', { name: /Next/i });

      fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('2 of 2: Team Management')).toBeInTheDocument();
      });
    };

    it('should show empty state initially', async () => {
      await navigateToStep2();

      expect(screen.getByText('No team members added yet.')).toBeInTheDocument();
    });

    it('should add team member when clicking Add Team Member button', async () => {
      await navigateToStep2();

      const addButton = screen.getByRole('button', { name: /Add Team Member/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
      });
    });

    it('should remove team member when clicking remove button', async () => {
      await navigateToStep2();

      // Add a team member
      const addButton = screen.getByRole('button', { name: /Add Team Member/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      });

      // Remove the team member
      const removeButton = screen.getByRole('button', { name: /Remove team member/i });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Name')).not.toBeInTheDocument();
      });
    });

    it('should navigate back to step 1 when clicking Back button', async () => {
      await navigateToStep2();

      const backButton = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('1 of 2: Basic Information')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form and call API with correct data', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        success: true,
        data: {
          profile: {
            id: 'test-profile-id',
            company_name: 'Test Company',
          },
        },
      });

      render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill step 1
      const companyNameInput = screen.getByLabelText(/Company Name/i);
      const cityInput = screen.getByLabelText(/City/i);
      const nextButton = screen.getByRole('button', { name: /Next/i });

      fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
      fireEvent.change(cityInput, { target: { value: 'Dallas' } });
      fireEvent.click(nextButton);

      // Wait for step 2
      await waitFor(() => {
        expect(screen.getByText('2 of 2: Team Management')).toBeInTheDocument();
      });

      // Submit
      const submitButton = screen.getByRole('button', { name: /Create Brokerage Profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApiClient.post).toHaveBeenCalledWith(
          '/api/broker/business-profiles',
          expect.objectContaining({
            company_name: 'Test Company',
            location_city: 'Dallas',
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should submit team members after creating profile', async () => {
      mockedApiClient.post
        .mockResolvedValueOnce({
          success: true,
          data: {
            profile: {
              id: 'test-profile-id',
              company_name: 'Test Company',
            },
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {},
        });

      render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill step 1
      const companyNameInput = screen.getByLabelText(/Company Name/i);
      const nextButton = screen.getByRole('button', { name: /Next/i });

      fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
      fireEvent.click(nextButton);

      // Wait for step 2
      await waitFor(() => {
        expect(screen.getByText('2 of 2: Team Management')).toBeInTheDocument();
      });

      // Add team member
      const addButton = screen.getByRole('button', { name: /Add Team Member/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Email address');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /Create Brokerage Profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedApiClient.post).toHaveBeenCalledTimes(2);
        expect(mockedApiClient.post).toHaveBeenNthCalledWith(
          2,
          '/api/broker/business-profiles/test-profile-id/team',
          expect.objectContaining({
            email: 'test@example.com',
          })
        );
      });
    });

    it('should show error message on API failure', async () => {
      mockedApiClient.post.mockRejectedValueOnce({
        message: 'Network error',
      });

      render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill step 1 and navigate to step 2
      const companyNameInput = screen.getByLabelText(/Company Name/i);
      const nextButton = screen.getByRole('button', { name: /Next/i });

      fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('2 of 2: Team Management')).toBeInTheDocument();
      });

      // Submit
      const submitButton = screen.getByRole('button', { name: /Create Brokerage Profile/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interaction', () => {
    it('should close modal when clicking backdrop', () => {
      const { container } = render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const backdrop = container.querySelector('[role="dialog"]');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should close modal when clicking close button', () => {
      render(
        <BusinessProfileModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const closeButton = screen.getByLabelText(/Close modal/i);
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not render when isOpen is false', () => {
      const { container } = render(
        <BusinessProfileModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
