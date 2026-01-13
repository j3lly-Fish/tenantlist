import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import MyBusinesses from '@pages/MyBusinesses';

// Mock the components
jest.mock('@components/TopNavigation', () => ({
  TopNavigation: () => <div data-testid="top-navigation">TopNavigation</div>,
}));

jest.mock('@components/BusinessCard', () => ({
  BusinessCard: ({ business }: any) => (
    <div data-testid={`business-card-${business.id}`}>
      {business.name}
    </div>
  ),
}));

jest.mock('@components/BusinessProfileBlurOverlay', () => ({
  BusinessProfileBlurOverlay: ({ isVisible, onAddBusinessClick }: any) =>
    isVisible ? (
      <div data-testid="blur-overlay" onClick={onAddBusinessClick}>
        Blur Overlay
      </div>
    ) : null,
}));

jest.mock('@components/GlobalBusinessSearch', () => ({
  GlobalBusinessSearch: ({ isOpen, onClose, onBusinessAdded }: any) =>
    isOpen ? (
      <div data-testid="global-business-search">
        <button onClick={onBusinessAdded}>Add Business</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mock useAuth hook
jest.mock('@contexts/AuthContext', () => ({
  ...jest.requireActual('@contexts/AuthContext'),
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', role: 'tenant' },
    role: 'tenant',
    isLoading: false,
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    refreshAuth: jest.fn(),
  }),
}));

const renderWithContext = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('MyBusinesses Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('displays page title with business count', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          businesses: [
            { id: '1', name: 'Business 1', category: 'retail', status: 'active' },
            { id: '2', name: 'Business 2', category: 'office', status: 'active' },
          ],
          count: 2,
        },
      }),
    });

    renderWithContext(<MyBusinesses />);

    await waitFor(() => {
      expect(screen.getByText(/Portfolio Overview \(2\)/i)).toBeInTheDocument();
    });
  });

  test('displays subtitle correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          businesses: [],
          count: 0,
        },
      }),
    });

    renderWithContext(<MyBusinesses />);

    await waitFor(() => {
      expect(
        screen.getByText(/Monitor your properties to seek tenant engagement/i)
      ).toBeInTheDocument();
    });
  });

  test('fetches user businesses on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          businesses: [
            { id: '1', name: 'Business 1', category: 'retail', status: 'active' },
          ],
          count: 1,
        },
      }),
    });

    renderWithContext(<MyBusinesses />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/businesses', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  test('displays business cards when businesses exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          businesses: [
            { id: '1', name: 'Business 1', category: 'retail', status: 'active' },
            { id: '2', name: 'Business 2', category: 'office', status: 'active' },
          ],
          count: 2,
        },
      }),
    });

    renderWithContext(<MyBusinesses />);

    await waitFor(() => {
      expect(screen.getByTestId('business-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('business-card-2')).toBeInTheDocument();
      expect(screen.getByText('Business 1')).toBeInTheDocument();
      expect(screen.getByText('Business 2')).toBeInTheDocument();
    });
  });

  test('shows blur overlay when no businesses exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          businesses: [],
          count: 0,
        },
      }),
    });

    renderWithContext(<MyBusinesses />);

    await waitFor(() => {
      expect(screen.getByTestId('blur-overlay')).toBeInTheDocument();
    });
  });

  test('hides blur overlay when businesses exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          businesses: [
            { id: '1', name: 'Business 1', category: 'retail', status: 'active' },
          ],
          count: 1,
        },
      }),
    });

    renderWithContext(<MyBusinesses />);

    await waitFor(() => {
      expect(screen.queryByTestId('blur-overlay')).not.toBeInTheDocument();
    });
  });

  test('opens GlobalBusinessSearch modal when "+ Add Business" button clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          businesses: [
            { id: '1', name: 'Business 1', category: 'retail', status: 'active' },
          ],
          count: 1,
        },
      }),
    });

    renderWithContext(<MyBusinesses />);

    await waitFor(() => {
      expect(screen.getByText('Business 1')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add new business/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('global-business-search')).toBeInTheDocument();
    });
  });

  test('refreshes business list after business added', async () => {
    // Initial fetch
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            businesses: [],
            count: 0,
          },
        }),
      })
      // Refresh fetch after adding business
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            businesses: [
              { id: '1', name: 'New Business', category: 'retail', status: 'active' },
            ],
            count: 1,
          },
        }),
      });

    renderWithContext(<MyBusinesses />);

    await waitFor(() => {
      expect(screen.getByTestId('blur-overlay')).toBeInTheDocument();
    });

    // Click blur overlay to open modal
    fireEvent.click(screen.getByTestId('blur-overlay'));

    await waitFor(() => {
      expect(screen.getByTestId('global-business-search')).toBeInTheDocument();
    });

    // Add business
    const addBusinessButton = screen.getByText('Add Business');
    fireEvent.click(addBusinessButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/Portfolio Overview \(1\)/i)).toBeInTheDocument();
    });
  });

  test('displays loading state while fetching businesses', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithContext(<MyBusinesses />);

    expect(screen.getByText(/Loading businesses/i)).toBeInTheDocument();
  });

  test('displays error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to fetch businesses')
    );

    renderWithContext(<MyBusinesses />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Businesses/i)).toBeInTheDocument();
    });
  });
});
