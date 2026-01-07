import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BusinessStatsCard } from '@components/broker/BusinessStatsCard';
import { BusinessProfileProvider } from '@contexts/BusinessProfileContext';
import apiClient from '@utils/apiClient';

// Mock apiClient
jest.mock('@utils/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock stats data
const mockStats = {
  business_profile_id: 'profile-123',
  offices_count: 12,
  agents_count: 45,
  tenants_count: 87,
  properties_count: 156,
  updated_at: '2024-01-15T10:30:00Z',
};

const renderWithContext = (component: React.ReactElement, activeProfileId: string | null = null) => {
  if (activeProfileId) {
    localStorage.setItem('broker_active_business_profile_id', activeProfileId);
  }
  return render(<BusinessProfileProvider>{component}</BusinessProfileProvider>);
};

describe('BusinessStatsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('displays empty state when no active profile', () => {
    renderWithContext(<BusinessStatsCard />);

    expect(screen.getByText(/No business profile selected/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Select a business profile from the sidebar to view statistics/i)
    ).toBeInTheDocument();
  });

  test('loads and displays stats when active profile is set', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: mockStats,
    });

    renderWithContext(<BusinessStatsCard />, 'profile-123');

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument(); // Offices
      expect(screen.getByText('45')).toBeInTheDocument(); // Agents
      expect(screen.getByText('87')).toBeInTheDocument(); // Tenants
      expect(screen.getByText('156')).toBeInTheDocument(); // Properties
    });

    // Check labels
    expect(screen.getByText(/Offices/i)).toBeInTheDocument();
    expect(screen.getByText(/Agents/i)).toBeInTheDocument();
    expect(screen.getByText(/Tenants/i)).toBeInTheDocument();
    expect(screen.getByText(/Properties/i)).toBeInTheDocument();
  });

  test('displays loading state while fetching stats', () => {
    mockedApiClient.get.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithContext(<BusinessStatsCard />, 'profile-123');

    expect(screen.getByText(/Loading stats/i)).toBeInTheDocument();
  });

  test('displays error message when API fails', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Failed to load stats'));

    renderWithContext(<BusinessStatsCard />, 'profile-123');

    await waitFor(() => {
      expect(screen.getByText(/Failed to load stats/i)).toBeInTheDocument();
    });
  });

  test('formats zero values as "--"', async () => {
    const zeroStats = {
      business_profile_id: 'profile-123',
      offices_count: 0,
      agents_count: 0,
      tenants_count: 0,
      properties_count: 0,
      updated_at: '2024-01-15T10:30:00Z',
    };

    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: zeroStats,
    });

    renderWithContext(<BusinessStatsCard />, 'profile-123');

    await waitFor(() => {
      // All stat values should show "--"
      const dashValues = screen.getAllByText('--');
      expect(dashValues).toHaveLength(4);
    });
  });

  test('formats null values as "--"', async () => {
    const nullStats = {
      business_profile_id: 'profile-123',
      offices_count: null,
      agents_count: null,
      tenants_count: null,
      properties_count: null,
      updated_at: '2024-01-15T10:30:00Z',
    };

    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: nullStats,
    });

    renderWithContext(<BusinessStatsCard />, 'profile-123');

    await waitFor(() => {
      // All stat values should show "--"
      const dashValues = screen.getAllByText('--');
      expect(dashValues).toHaveLength(4);
    });
  });

  test('calls correct API endpoint with active profile ID', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: mockStats,
    });

    renderWithContext(<BusinessStatsCard />, 'profile-456');

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/api/broker/business-profiles/profile-456/stats'
      );
    });
  });

  test('renders all stat icons', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: mockStats,
    });

    const { container } = renderWithContext(<BusinessStatsCard />, 'profile-123');

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    // Check that stat icons are rendered (SVG elements)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(4); // At least 4 stat icons
  });

  test('displays Business Statistics title', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: mockStats,
    });

    renderWithContext(<BusinessStatsCard />, 'profile-123');

    await waitFor(() => {
      expect(screen.getByText('Business Statistics')).toBeInTheDocument();
      expect(screen.getByText('Overview of your business metrics')).toBeInTheDocument();
    });
  });
});
