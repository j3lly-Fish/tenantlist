import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PostLocationModal } from '@components/broker/PostLocationModal';
import apiClient from '@utils/apiClient';

// Mock the apiClient
jest.mock('@utils/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock child components to simplify testing
jest.mock('@components/broker/LocationTagInput', () => ({
  LocationTagInput: ({ locations, onChange }: any) => (
    <div data-testid="location-tag-input">
      <div>Locations: {locations.join(', ')}</div>
      <button onClick={() => onChange([...locations, 'Test City'])}>Add Location</button>
    </div>
  ),
}));

jest.mock('@components/broker/LocationMapSelector', () => ({
  LocationMapSelector: ({ boundaries, onChange }: any) => (
    <div data-testid="location-map-selector">
      <div>Map Boundaries: {boundaries ? 'Set' : 'Not Set'}</div>
      <button onClick={() => onChange({ test: 'boundary' })}>Set Boundaries</button>
    </div>
  ),
}));

jest.mock('@components/broker/AmenitiesCheckboxGrid', () => ({
  AmenitiesCheckboxGrid: ({ selectedAmenities, onChange }: any) => (
    <div data-testid="amenities-checkbox-grid">
      <div>Selected: {selectedAmenities.length}</div>
      <button onClick={() => onChange([...selectedAmenities, 'Parking'])}>Add Amenity</button>
    </div>
  ),
}));

describe('PostLocationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <PostLocationModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Post New Location')).toBeInTheDocument();
    });

    it('should display step 1 indicator initially', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('1 of 2: Describe your space needs')).toBeInTheDocument();
    });
  });

  describe('Step 1: Space Requirements', () => {
    it('should render all step 1 form fields', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByLabelText(/Listing Location Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Asset/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Target move-in Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Square Feet - Min/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Square Feet - Max/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Lot Size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monthly Budget - Min/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Monthly Budget - Max/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Preferred Lease Term/i)).toBeInTheDocument();
    });

    it('should format square feet input with commas', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const sqftInput = screen.getByLabelText(/Square Feet - Min/i) as HTMLInputElement;
      fireEvent.change(sqftInput, { target: { value: '10000' } });

      expect(sqftInput.value).toBe('10,000');
    });

    it('should format monthly budget input with dollar sign and commas', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const budgetInput = screen.getByLabelText(/Monthly Budget - Min/i) as HTMLInputElement;
      fireEvent.change(budgetInput, { target: { value: '15000' } });

      expect(budgetInput.value).toBe('$15,000');
    });

    it('should validate required fields on next button click', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      expect(screen.getByText('Location name is required')).toBeInTheDocument();
      expect(screen.getByText('Asset type is required')).toBeInTheDocument();
    });

    it('should validate sqft range (min <= max)', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const locationNameInput = screen.getByLabelText(/Listing Location Name/i);
      const assetSelect = screen.getByLabelText(/Asset/i);
      const sqftMin = screen.getByLabelText(/Square Feet - Min/i);
      const sqftMax = screen.getByLabelText(/Square Feet - Max/i);

      fireEvent.change(locationNameInput, { target: { value: 'Test Location' } });
      fireEvent.change(assetSelect, { target: { value: 'Retail' } });
      fireEvent.change(sqftMin, { target: { value: '5000' } });
      fireEvent.change(sqftMax, { target: { value: '2000' } });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      expect(
        screen.getByText('Max square feet must be greater than or equal to min')
      ).toBeInTheDocument();
    });

    it('should validate budget range (min <= max)', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const locationNameInput = screen.getByLabelText(/Listing Location Name/i);
      const assetSelect = screen.getByLabelText(/Asset/i);
      const budgetMin = screen.getByLabelText(/Monthly Budget - Min/i);
      const budgetMax = screen.getByLabelText(/Monthly Budget - Max/i);

      fireEvent.change(locationNameInput, { target: { value: 'Test Location' } });
      fireEvent.change(assetSelect, { target: { value: 'Office' } });
      fireEvent.change(budgetMin, { target: { value: '20000' } });
      fireEvent.change(budgetMax, { target: { value: '10000' } });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      expect(
        screen.getByText('Max budget must be greater than or equal to min')
      ).toBeInTheDocument();
    });

    it('should advance to step 2 when validation passes', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const locationNameInput = screen.getByLabelText(/Listing Location Name/i);
      const assetSelect = screen.getByLabelText(/Asset/i);

      fireEvent.change(locationNameInput, { target: { value: 'Downtown Office' } });
      fireEvent.change(assetSelect, { target: { value: 'Office' } });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);

      expect(screen.getByText('2 of 2: Additional Features')).toBeInTheDocument();
    });
  });

  describe('Step 2: Additional Features', () => {
    beforeEach(() => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Fill required fields and advance to step 2
      const locationNameInput = screen.getByLabelText(/Listing Location Name/i);
      const assetSelect = screen.getByLabelText(/Asset/i);

      fireEvent.change(locationNameInput, { target: { value: 'Test Location' } });
      fireEvent.change(assetSelect, { target: { value: 'Retail' } });

      const nextButton = screen.getByRole('button', { name: /Next/i });
      fireEvent.click(nextButton);
    });

    it('should render amenities checkbox grid', () => {
      expect(screen.getByTestId('amenities-checkbox-grid')).toBeInTheDocument();
    });

    it('should display back button', () => {
      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    });

    it('should display preview button', () => {
      expect(screen.getByRole('button', { name: /Preview/i })).toBeInTheDocument();
    });

    it('should return to step 1 when back button is clicked', () => {
      const backButton = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backButton);

      expect(screen.getByText('1 of 2: Describe your space needs')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form data to API on preview button click', async () => {
      mockedApiClient.post.mockResolvedValueOnce({
        success: true,
        data: { id: '123' },
      });

      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Fill step 1
      fireEvent.change(screen.getByLabelText(/Listing Location Name/i), {
        target: { value: 'San Francisco Office' },
      });
      fireEvent.change(screen.getByLabelText(/Asset/i), { target: { value: 'Office' } });

      // Advance to step 2
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /Preview/i }));

      await waitFor(() => {
        expect(mockedApiClient.post).toHaveBeenCalledWith(
          '/api/broker/locations',
          expect.objectContaining({
            location_name: 'San Francisco Office',
            asset_type: 'Office',
          })
        );
      });

      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should display error message on API failure', async () => {
      mockedApiClient.post.mockRejectedValueOnce({
        message: 'Failed to create location',
      });

      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Fill and submit
      fireEvent.change(screen.getByLabelText(/Listing Location Name/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText(/Asset/i), { target: { value: 'Retail' } });
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      fireEvent.click(screen.getByRole('button', { name: /Preview/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to create location/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should disable buttons during submission', async () => {
      mockedApiClient.post.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: { id: '123' } }), 100)
          )
      );

      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Fill and submit
      fireEvent.change(screen.getByLabelText(/Listing Location Name/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText(/Asset/i), { target: { value: 'Office' } });
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      const submitButton = screen.getByRole('button', { name: /Preview/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Submitting/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when close button is clicked', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const closeButton = screen.getByRole('button', { name: /Close modal/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when cancel button is clicked', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Child Components Integration', () => {
    it('should integrate with LocationTagInput component', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByTestId('location-tag-input')).toBeInTheDocument();
    });

    it('should integrate with LocationMapSelector component', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByTestId('location-map-selector')).toBeInTheDocument();
    });

    it('should integrate with AmenitiesCheckboxGrid component on step 2', () => {
      render(
        <PostLocationModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Advance to step 2
      fireEvent.change(screen.getByLabelText(/Listing Location Name/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText(/Asset/i), { target: { value: 'Office' } });
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      expect(screen.getByTestId('amenities-checkbox-grid')).toBeInTheDocument();
    });
  });
});
