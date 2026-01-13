import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalBusinessSearch } from '../../components/GlobalBusinessSearch';

// Mock fetch globally
global.fetch = jest.fn();

describe('GlobalBusinessSearch', () => {
  const mockOnClose = jest.fn();
  const mockOnBusinessAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Modal Display', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      expect(screen.getByText('Select your business profile')).toBeInTheDocument();
      expect(screen.getByText(/Create your personal profile/i)).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(
        <GlobalBusinessSearch
          isOpen={false}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      expect(screen.queryByText('Select your business profile')).not.toBeInTheDocument();
    });

    it('should close modal when close button is clicked', () => {
      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when backdrop is clicked', () => {
      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Search Functionality', () => {
    it('should display search input with placeholder', () => {
      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for your business');
      expect(searchInput).toBeInTheDocument();
    });

    it('should trigger API call with debounce after user types', async () => {
      const mockBusinesses = [
        {
          id: '1',
          name: 'Test Business',
          logo_url: 'https://example.com/logo.png',
          location: 'New York, NY',
          is_verified: true,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ businesses: mockBusinesses, total: 1 }),
      });

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      // Wait for debounce (300ms) and API call
      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/businesses/search?query=Test',
            expect.any(Object)
          );
        },
        { timeout: 500 }
      );
    });

    it('should display search results after successful API call', async () => {
      const mockBusinesses = [
        {
          id: '1',
          name: 'Test Business',
          logo_url: 'https://example.com/logo.png',
          location: 'New York, NY',
          is_verified: true,
        },
        {
          id: '2',
          name: 'Another Business',
          logo_url: null,
          location: 'Los Angeles, CA',
          is_verified: false,
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ businesses: mockBusinesses, total: 2 }),
      });

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'Business' } });

      await waitFor(() => {
        expect(screen.getByText('Test Business')).toBeInTheDocument();
        expect(screen.getByText('Another Business')).toBeInTheDocument();
      });
    });
  });

  describe('Business Selection', () => {
    it('should add business to portfolio when result is clicked', async () => {
      const mockBusinesses = [
        {
          id: '1',
          name: 'Test Business',
          logo_url: null,
          location: 'New York, NY',
          is_verified: false,
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ businesses: mockBusinesses, total: 1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, businessId: '1', message: 'Business added' }),
        });

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      await waitFor(() => {
        expect(screen.getByText('Test Business')).toBeInTheDocument();
      });

      const businessCard = screen.getByText('Test Business').closest('button');
      if (businessCard) {
        fireEvent.click(businessCard);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/user/businesses',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ businessId: '1' }),
          })
        );
        expect(mockOnBusinessAdded).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no results found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ businesses: [], total: 0 }),
      });

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'NonexistentBusiness' } });

      await waitFor(() => {
        expect(screen.getByText("Can't find your business?")).toBeInTheDocument();
        expect(screen.getByText('Create New Business')).toBeInTheDocument();
      });
    });

    it('should show "Create New Business" button in empty state', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ businesses: [], total: 0 }),
      });

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      await waitFor(() => {
        const createButton = screen.getByText('Create New Business');
        expect(createButton).toBeInTheDocument();
      });
    });
  });

  describe('Duplicate Prevention', () => {
    it('should check for duplicates when "Create New Business" is clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ businesses: [], total: 0 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            exists: true,
            business: { id: '1', name: 'Existing Business' },
          }),
        });

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'Existing Business' } });

      await waitFor(() => {
        expect(screen.getByText('Create New Business')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create New Business');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/This business already exists/i)).toBeInTheDocument();
      });
    });
  });
});
