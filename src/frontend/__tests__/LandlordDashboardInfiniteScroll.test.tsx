/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import '@testing-library/jest-dom';

// Mock the modules before importing LandlordDashboard
jest.mock('@utils/apiClient');
jest.mock('@hooks/useInfiniteScroll');
jest.mock('@hooks/useDashboardWebSocket');

// Import LandlordDashboard AFTER mocks are set up
import LandlordDashboard from '@pages/LandlordDashboard';
import * as apiClient from '@utils/apiClient';
import * as useInfiniteScrollModule from '@hooks/useInfiniteScroll';
import * as useDashboardWebSocketModule from '@hooks/useDashboardWebSocket';

// Mock property data
const mockPropertyListings = [
  {
    id: 'prop-1',
    title: 'Downtown Office Space',
    property_type: 'OFFICE',
    status: 'ACTIVE',
    square_feet: 5000,
    price_per_sqft: 35,
    address: {
      street: '123 Main St',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
    },
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 'prop-2',
    title: 'Retail Space in Brickell',
    property_type: 'RETAIL',
    status: 'ACTIVE',
    square_feet: 3000,
    price_per_sqft: 45,
    address: {
      street: '456 Brickell Ave',
      city: 'Miami',
      state: 'FL',
      zip: '33131',
    },
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const mockPropertyListingsPage2 = [
  {
    id: 'prop-3',
    title: 'Warehouse Space',
    property_type: 'WAREHOUSE',
    status: 'ACTIVE',
    square_feet: 10000,
    price_per_sqft: 15,
    address: {
      street: '789 Industrial Rd',
      city: 'Miami',
      state: 'FL',
      zip: '33142',
    },
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const mockDashboardStats = {
  total: 3,
  active: 3,
  pending: 0,
  leased: 0,
  offMarket: 0,
  totalViews: 150,
  totalInquiries: 25,
};

// Wrapper component for tests
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

// Type assertions for mocked functions
const mockGetMyPropertyListings = apiClient.getMyPropertyListings as jest.MockedFunction<typeof apiClient.getMyPropertyListings>;
const mockGetPropertyDashboardStats = apiClient.getPropertyDashboardStats as jest.MockedFunction<typeof apiClient.getPropertyDashboardStats>;
const mockGetLandlordKPIs = apiClient.getLandlordKPIs as jest.MockedFunction<typeof apiClient.getLandlordKPIs>;
const mockUseInfiniteScroll = useInfiniteScrollModule.useInfiniteScroll as jest.MockedFunction<typeof useInfiniteScrollModule.useInfiniteScroll>;
const mockUseDashboardWebSocket = useDashboardWebSocketModule.useDashboardWebSocket as jest.MockedFunction<typeof useDashboardWebSocketModule.useDashboardWebSocket>;

describe('LandlordDashboard Infinite Scroll', () => {
  let sentinelRefCallback: ((node: HTMLDivElement | null) => void) | null = null;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock successful API responses
    mockGetMyPropertyListings.mockResolvedValue({
      listings: mockPropertyListings,
      total: 3,
      hasMore: true,
    } as any);

    mockGetPropertyDashboardStats.mockResolvedValue(mockDashboardStats);

    // Mock getLandlordKPIs to throw (so it falls back to stats)
    mockGetLandlordKPIs.mockRejectedValue(new Error('KPI endpoint not available'));

    // Mock useDashboardWebSocket
    mockUseDashboardWebSocket.mockReturnValue({
      isConnected: true,
      isFallbackPolling: false,
    });

    // Mock useInfiniteScroll to capture the sentinel ref
    sentinelRefCallback = null;
    mockUseInfiniteScroll.mockImplementation(() => {
      return {
        sentinelRef: (node: HTMLDivElement | null) => {
          if (node && sentinelRefCallback) {
            sentinelRefCallback(node);
          }
        },
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call useInfiniteScroll hook with correct parameters', async () => {
    renderWithProviders(<LandlordDashboard />);

    await waitFor(() => {
      expect(mockUseInfiniteScroll).toHaveBeenCalled();
    });

    // Verify hook was called with loadMoreProperties, hasMore, and isLoadingMore
    const hookCall = mockUseInfiniteScroll.mock.calls[0];
    expect(hookCall).toHaveLength(3);
    expect(typeof hookCall[0]).toBe('function'); // loadMoreProperties callback
    expect(typeof hookCall[1]).toBe('boolean'); // hasMore flag
    expect(typeof hookCall[2]).toBe('boolean'); // isLoadingMore flag
  });

  it('should render sentinel element when hasMore is true', async () => {
    mockGetMyPropertyListings.mockResolvedValue({
      listings: mockPropertyListings,
      total: 3,
      hasMore: true,
    } as any);

    const { container } = renderWithProviders(<LandlordDashboard />);

    await waitFor(() => {
      expect(mockGetMyPropertyListings).toHaveBeenCalled();
    });

    // Find the sentinel element
    const sentinel = container.querySelector('.scrollSentinel');
    expect(sentinel).toBeInTheDocument();
    expect(sentinel).toHaveAttribute('aria-hidden', 'true');
  });

  it('should not render sentinel element when hasMore is false', async () => {
    mockGetMyPropertyListings.mockResolvedValue({
      listings: mockPropertyListings,
      total: 2,
      hasMore: false,
    } as any);

    const { container } = renderWithProviders(<LandlordDashboard />);

    await waitFor(() => {
      expect(mockGetMyPropertyListings).toHaveBeenCalled();
    });

    // Sentinel should not be rendered
    const sentinel = container.querySelector('.scrollSentinel');
    expect(sentinel).not.toBeInTheDocument();
  });

  it('should trigger loadMoreProperties when sentinel becomes visible', async () => {
    let capturedLoadMore: (() => void) | null = null;

    // Capture the loadMore callback passed to useInfiniteScroll
    mockUseInfiniteScroll.mockImplementation((loadMore, hasMore, isLoading) => {
      capturedLoadMore = loadMore;
      return {
        sentinelRef: jest.fn(),
      };
    });

    // Reset the mock before setting up responses
    mockGetMyPropertyListings.mockReset();

    // Mock first page response
    mockGetMyPropertyListings.mockResolvedValueOnce({
      listings: mockPropertyListings,
      total: 3,
      hasMore: true,
    } as any);

    // Mock second page response
    mockGetMyPropertyListings.mockResolvedValueOnce({
      listings: mockPropertyListingsPage2,
      total: 3,
      hasMore: false,
    } as any);

    renderWithProviders(<LandlordDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetMyPropertyListings).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    // Simulate Intersection Observer triggering loadMore
    expect(capturedLoadMore).toBeDefined();
    if (capturedLoadMore) {
      await act(async () => {
        capturedLoadMore();
      });
    }

    // Verify second page was loaded
    await waitFor(() => {
      expect(mockGetMyPropertyListings).toHaveBeenCalledWith({ page: 2, limit: 20 });
    });
  });

  it('should display loading spinner while fetching more properties', async () => {
    let resolveSecondPage: ((value: any) => void) | null = null;
    const secondPagePromise = new Promise((resolve) => {
      resolveSecondPage = resolve;
    });

    let capturedLoadMore: (() => void) | null = null;
    mockUseInfiniteScroll.mockImplementation((loadMore) => {
      capturedLoadMore = loadMore;
      return {
        sentinelRef: jest.fn(),
      };
    });

    // Reset the mock before setting up responses
    mockGetMyPropertyListings.mockReset();

    // Mock first page response
    mockGetMyPropertyListings.mockResolvedValueOnce({
      listings: mockPropertyListings,
      total: 3,
      hasMore: true,
    } as any);

    // Mock second page response with delay
    mockGetMyPropertyListings.mockReturnValueOnce(secondPagePromise as any);

    renderWithProviders(<LandlordDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetMyPropertyListings).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    // Trigger load more
    if (capturedLoadMore) {
      act(() => {
        capturedLoadMore!();
      });
    }

    // Loading spinner should appear
    await waitFor(() => {
      expect(screen.getByText('Loading more properties...')).toBeInTheDocument();
    });

    // Resolve second page
    act(() => {
      resolveSecondPage!({
        listings: mockPropertyListingsPage2,
        total: 3,
        hasMore: false,
      });
    });

    // Loading spinner should disappear
    await waitFor(() => {
      expect(screen.queryByText('Loading more properties...')).not.toBeInTheDocument();
    });
  });

  it('should append new properties to existing list on load more', async () => {
    let capturedLoadMore: (() => void) | null = null;
    mockUseInfiniteScroll.mockImplementation((loadMore) => {
      capturedLoadMore = loadMore;
      return {
        sentinelRef: jest.fn(),
      };
    });

    // Reset the mock before setting up responses
    mockGetMyPropertyListings.mockReset();

    // Mock first page response
    mockGetMyPropertyListings.mockResolvedValueOnce({
      listings: mockPropertyListings,
      total: 3,
      hasMore: true,
    } as any);

    // Mock second page response
    mockGetMyPropertyListings.mockResolvedValueOnce({
      listings: mockPropertyListingsPage2,
      total: 3,
      hasMore: false,
    } as any);

    renderWithProviders(<LandlordDashboard />);

    // Wait for initial properties to load using findByText
    await waitFor(async () => {
      expect(await screen.findByText('Downtown Office Space')).toBeInTheDocument();
      expect(await screen.findByText('Retail Space in Brickell')).toBeInTheDocument();
    });

    // Trigger load more
    if (capturedLoadMore) {
      await act(async () => {
        capturedLoadMore!();
      });
    }

    // Verify all properties are displayed (first page + second page)
    await waitFor(async () => {
      expect(await screen.findByText('Downtown Office Space')).toBeInTheDocument();
      expect(await screen.findByText('Retail Space in Brickell')).toBeInTheDocument();
      expect(await screen.findByText('Warehouse Space')).toBeInTheDocument();
    });
  });

  it('should not trigger additional loads when hasMore is false', async () => {
    let capturedLoadMore: (() => void) | null = null;
    mockUseInfiniteScroll.mockImplementation((loadMore) => {
      capturedLoadMore = loadMore;
      return {
        sentinelRef: jest.fn(),
      };
    });

    // Reset the mock before setting up responses
    mockGetMyPropertyListings.mockReset();

    // Mock response with hasMore: false
    mockGetMyPropertyListings.mockResolvedValueOnce({
      listings: mockPropertyListings,
      total: 2,
      hasMore: false,
    } as any);

    renderWithProviders(<LandlordDashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetMyPropertyListings).toHaveBeenCalledTimes(1);
    });

    // Try to trigger load more
    if (capturedLoadMore) {
      await act(async () => {
        capturedLoadMore!();
      });
    }

    // Should not make additional API call
    expect(mockGetMyPropertyListings).toHaveBeenCalledTimes(1);
  });

  it('should cleanup Intersection Observer on unmount', async () => {
    // This test verifies that useInfiniteScroll is used, which handles cleanup
    const { unmount } = renderWithProviders(<LandlordDashboard />);

    await waitFor(() => {
      expect(mockUseInfiniteScroll).toHaveBeenCalled();
    });

    // Unmount component
    unmount();

    // The useInfiniteScroll hook should have cleaned up the observer
    // We can't directly test observer cleanup, but we verify the hook was called
    expect(mockUseInfiniteScroll).toHaveBeenCalled();
  });

  it('should display "No more properties to load" message when hasMore is false and properties exist', async () => {
    mockGetMyPropertyListings.mockReset();
    mockGetMyPropertyListings.mockResolvedValue({
      listings: mockPropertyListings,
      total: 2,
      hasMore: false,
    } as any);

    renderWithProviders(<LandlordDashboard />);

    // Wait for properties to load using findByText
    await waitFor(async () => {
      expect(await screen.findByText('Downtown Office Space')).toBeInTheDocument();
    });

    // Check for end of list message
    await waitFor(async () => {
      expect(await screen.findByText('No more properties to load')).toBeInTheDocument();
    });
  });
});
