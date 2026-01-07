import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BusinessProfileSelector } from '@components/broker/BusinessProfileSelector';
import { BusinessProfileProvider } from '@contexts/BusinessProfileContext';
import apiClient from '@utils/apiClient';

// Mock apiClient
jest.mock('@utils/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock business profiles data
const mockProfiles = [
  {
    id: 'profile-1',
    company_name: 'Starbucks Coffee',
    logo_url: 'https://example.com/starbucks-logo.png',
    cover_image_url: null,
    established_year: 1971,
    location_city: 'Seattle',
    location_state: 'WA',
    about: 'Global coffee company',
    website_url: 'https://starbucks.com',
    instagram_url: null,
    linkedin_url: null,
    is_verified: true,
    created_by_user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'profile-2',
    company_name: 'Starter Sweet Ice Cream',
    logo_url: null,
    cover_image_url: null,
    established_year: 2015,
    location_city: 'Austin',
    location_state: 'TX',
    about: 'Artisan ice cream shop',
    website_url: null,
    instagram_url: null,
    linkedin_url: null,
    is_verified: false,
    created_by_user_id: 'user-1',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'profile-3',
    company_name: 'Startup Nation',
    logo_url: null,
    cover_image_url: null,
    established_year: null,
    location_city: null,
    location_state: null,
    about: null,
    website_url: null,
    instagram_url: null,
    linkedin_url: null,
    is_verified: false,
    created_by_user_id: 'user-1',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

const renderWithContext = (component: React.ReactElement) => {
  return render(<BusinessProfileProvider>{component}</BusinessProfileProvider>);
};

describe('BusinessProfileSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders loading state initially', () => {
    mockedApiClient.get.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithContext(<BusinessProfileSelector onCreateClick={jest.fn()} />);

    expect(screen.getByText(/loading profiles/i)).toBeInTheDocument();
  });

  test('loads and displays business profiles', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: mockProfiles.length,
      },
    });

    renderWithContext(<BusinessProfileSelector onCreateClick={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
      expect(screen.getByText('Starter Sweet Ice Cream')).toBeInTheDocument();
      expect(screen.getByText('Startup Nation')).toBeInTheDocument();
    });

    // Should show location for profiles that have it
    expect(screen.getByText('Seattle, WA')).toBeInTheDocument();
    expect(screen.getByText('Austin, TX')).toBeInTheDocument();

    // Should show verified badge for verified profile
    const verifiedBadges = screen.getAllByLabelText('Verified');
    expect(verifiedBadges).toHaveLength(1);
  });

  test('displays error message when API fails', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('API Error'));

    renderWithContext(<BusinessProfileSelector onCreateClick={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/API Error/i)).toBeInTheDocument();
    });
  });

  test('displays empty state when no profiles exist', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: {
        profiles: [],
        total: 0,
      },
    });

    renderWithContext(<BusinessProfileSelector onCreateClick={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Can't find your business?/i)).toBeInTheDocument();
      expect(
        screen.getByText(/You haven't created any business profiles yet/i)
      ).toBeInTheDocument();
    });
  });

  test('filters profiles by search term', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: mockProfiles.length,
      },
    });

    renderWithContext(<BusinessProfileSelector onCreateClick={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    // Type in search input
    const searchInput = screen.getByPlaceholderText(/search for business/i);
    fireEvent.change(searchInput, { target: { value: 'Star' } });

    // Should show matching profiles
    expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    expect(screen.getByText('Starter Sweet Ice Cream')).toBeInTheDocument();
    expect(screen.getByText('Startup Nation')).toBeInTheDocument();

    // Filter more specifically
    fireEvent.change(searchInput, { target: { value: 'Starbucks' } });

    // Should only show Starbucks
    expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    expect(screen.queryByText('Starter Sweet Ice Cream')).not.toBeInTheDocument();
    expect(screen.queryByText('Startup Nation')).not.toBeInTheDocument();
  });

  test('displays empty state when search yields no results', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: mockProfiles.length,
      },
    });

    renderWithContext(<BusinessProfileSelector onCreateClick={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    // Search for non-existent profile
    const searchInput = screen.getByPlaceholderText(/search for business/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

    // Should show empty state with search message
    expect(screen.getByText(/Can't find your business?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No profiles match your search/i)
    ).toBeInTheDocument();
  });

  test('selects and highlights active profile on click', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: mockProfiles.length,
      },
    });

    renderWithContext(<BusinessProfileSelector onCreateClick={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    // Click on a profile card
    const profileCard = screen.getByText('Starbucks Coffee').closest('div[role="button"]');
    expect(profileCard).not.toHaveClass('active');

    fireEvent.click(profileCard!);

    // Should add active class
    expect(profileCard).toHaveClass('active');

    // Should persist to localStorage
    expect(localStorage.getItem('broker_active_business_profile_id')).toBe('profile-1');
  });

  test('calls onCreateClick when Create New Business button is clicked', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: mockProfiles.length,
      },
    });

    const mockOnCreateClick = jest.fn();
    renderWithContext(<BusinessProfileSelector onCreateClick={mockOnCreateClick} />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    // Click create button
    const createButton = screen.getByText(/Create New Business/i);
    fireEvent.click(createButton);

    expect(mockOnCreateClick).toHaveBeenCalledTimes(1);
  });

  test('displays profile logo or initials fallback', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: mockProfiles.length,
      },
    });

    renderWithContext(<BusinessProfileSelector onCreateClick={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    // Starbucks has logo_url, should render img
    const starbucksLogo = screen.getByAltText('Starbucks Coffee logo');
    expect(starbucksLogo).toHaveAttribute('src', 'https://example.com/starbucks-logo.png');

    // Starter Sweet has no logo, should show initials
    expect(screen.getByText('SS')).toBeInTheDocument(); // First letters of "Starter Sweet"

    // Startup Nation has no logo, should show initials
    expect(screen.getByText('SN')).toBeInTheDocument(); // First letters of "Startup Nation"
  });

  test('calls onProfileChange callback when profile is selected', async () => {
    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: mockProfiles.length,
      },
    });

    const mockOnProfileChange = jest.fn();
    renderWithContext(
      <BusinessProfileSelector
        onCreateClick={jest.fn()}
        onProfileChange={mockOnProfileChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    // Click on a profile
    const profileCard = screen.getByText('Starbucks Coffee').closest('div[role="button"]');
    fireEvent.click(profileCard!);

    expect(mockOnProfileChange).toHaveBeenCalledWith('profile-1');
  });

  test('deselects profile when clicking on already active profile', async () => {
    localStorage.setItem('broker_active_business_profile_id', 'profile-1');

    mockedApiClient.get.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: mockProfiles.length,
      },
    });

    const mockOnProfileChange = jest.fn();
    renderWithContext(
      <BusinessProfileSelector
        onCreateClick={jest.fn()}
        onProfileChange={mockOnProfileChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    });

    // Profile should be active initially
    const profileCard = screen.getByText('Starbucks Coffee').closest('div[role="button"]');
    expect(profileCard).toHaveClass('active');

    // Click on it again
    fireEvent.click(profileCard!);

    // Should deselect (no longer active)
    expect(profileCard).not.toHaveClass('active');
    expect(mockOnProfileChange).toHaveBeenCalledWith(null);
    expect(localStorage.getItem('broker_active_business_profile_id')).toBeNull();
  });
});
