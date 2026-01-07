import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { TenantListings } from '@pages/broker/TenantListings';
import apiClient from '@utils/apiClient';

/**
 * Tests for TenantListings Page
 *
 * Test Coverage:
 * - Initial page load and data fetching
 * - Search functionality with debounce
 * - Filter functionality (category, location)
 * - Clear filters
 * - Loading states
 * - Error handling
 * - Empty state
 * - Infinite scroll
 */

jest.mock('@utils/apiClient');
jest.mock('@hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: (fetchMore: any, hasMore: boolean, isLoading: boolean) => ({
    sentinelRef: { current: null },
  }),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('TenantListings Page', () => {
  const mockTenants = [
    {
      id: 'tenant-1',
      display_name: 'Starbucks Coffee',
      logo_url: 'https://example.com/starbucks.png',
      category: 'Quick Service Retail',
      rating: 4.8,
      review_count: 245,
      is_verified: true,
    },
    {
      id: 'tenant-2',
      display_name: 'Chipotle Mexican Grill',
      logo_url: 'https://example.com/chipotle.png',
      category: 'Restaurant',
      rating: 4.5,
      review_count: 180,
      is_verified: false,
    },
  ];

  const mockSuccessResponse = {
    success: true,
    data: {
      profiles: mockTenants,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient.get.mockResolvedValue(mockSuccessResponse);
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders page header with title and subtitle', async () => {
    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText(/Tenant Overview/)).toBeInTheDocument();
      expect(
        screen.getByText('Monitor your properties to seek tenant engagement')
      ).toBeInTheDocument();
    });
  });

  it('renders Add Tenant button', async () => {
    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Tenant')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    renderWithRouter(<TenantListings />);

    expect(screen.getByText('Loading tenant profiles...')).toBeInTheDocument();
  });

  it('fetches and displays tenant profiles on mount', async () => {
    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
      expect(screen.getByText('Chipotle Mexican Grill')).toBeInTheDocument();
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/api/broker/tenants', {
      page: 1,
      limit: 20,
    });
  });

  it('displays total tenant count in header', async () => {
    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('Tenant Overview (2)')).toBeInTheDocument();
    });
  });

  it('displays results count in search card', async () => {
    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('2 tenants found')).toBeInTheDocument();
    });
  });

  it('shows empty state when no tenants found', async () => {
    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: {
        profiles: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      },
    });

    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText("Can't find your tenant?")).toBeInTheDocument();
      expect(screen.getByText('Create New Tenant')).toBeInTheDocument();
    });
  });

  it('handles search input with debounce', async () => {
    jest.useFakeTimers();
    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    // Reset mock to check new API call
    mockApiClient.get.mockClear();

    const searchInput = screen.getByPlaceholderText('Search for Tenant');
    fireEvent.change(searchInput, { target: { value: 'Starbucks' } });

    // Fast-forward past debounce delay
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/broker/tenants', {
        page: 1,
        limit: 20,
        search: 'Starbucks',
      });
    });

    jest.useRealTimers();
  });

  it('handles category filter change', async () => {
    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    mockApiClient.get.mockClear();

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'Quick Service Retail' } });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/broker/tenants', {
        page: 1,
        limit: 20,
        category: 'Quick Service Retail',
      });
    });
  });

  it('handles location filter change', async () => {
    jest.useFakeTimers();
    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    mockApiClient.get.mockClear();

    const locationInput = screen.getByLabelText('Location (Optional)');
    fireEvent.change(locationInput, { target: { value: 'Dallas, TX' } });

    // Fast-forward past debounce delay
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/broker/tenants', {
        page: 1,
        limit: 20,
        location: 'Dallas, TX',
      });
    });

    jest.useRealTimers();
  });

  it('shows clear filters button when filters are active', async () => {
    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'Retail' } });

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });
  });

  it('clears all filters when clear filters button is clicked', async () => {
    jest.useFakeTimers();
    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    // Apply filters
    const searchInput = screen.getByPlaceholderText('Search for Tenant');
    fireEvent.change(searchInput, { target: { value: 'Star' } });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    mockApiClient.get.mockClear();

    // Clear filters
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/broker/tenants', {
        page: 1,
        limit: 20,
      });
    });

    jest.useRealTimers();
  });

  it('displays error state when API call fails', async () => {
    mockApiClient.get.mockRejectedValueOnce({
      message: 'Network error',
    });

    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Tenants')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('retries fetching on retry button click', async () => {
    mockApiClient.get.mockRejectedValueOnce({
      message: 'Network error',
    });

    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Tenants')).toBeInTheDocument();
    });

    mockApiClient.get.mockResolvedValueOnce(mockSuccessResponse);

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });
  });

  it('shows alert when Add Tenant button is clicked', async () => {
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithRouter(<TenantListings />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    const addButton = screen.getByText('+ Add Tenant');
    fireEvent.click(addButton);

    expect(mockAlert).toHaveBeenCalledWith('Add tenant functionality coming soon');

    mockAlert.mockRestore();
  });
});
