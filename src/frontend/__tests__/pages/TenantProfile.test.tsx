import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TenantProfile from '@pages/broker/TenantProfile';
import apiClient from '@utils/apiClient';

// Mock apiClient
jest.mock('@utils/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock child components
jest.mock('@components/broker/TenantProfileView', () => ({
  TenantProfileView: ({ profile }: any) => (
    <div data-testid="tenant-profile-view">Profile: {profile.display_name}</div>
  ),
}));

jest.mock('@components/broker/TenantRequestForm', () => ({
  TenantRequestForm: ({ tenantName }: any) => (
    <div data-testid="tenant-request-form">Request form for: {tenantName}</div>
  ),
}));

jest.mock('@components/broker/ContactCard', () => ({
  ContactCard: () => <div data-testid="contact-card">Contact card</div>,
}));

const mockTenantProfile = {
  id: 'tenant-123',
  display_name: 'Starbucks Coffee',
  category: 'Quick Service Retail',
  logo_url: 'https://example.com/logo.png',
  cover_image_url: 'https://example.com/cover.jpg',
  about: 'A global coffee company',
  rating: 4.8,
  review_count: 245,
  website_url: 'https://starbucks.com',
  instagram_url: 'https://instagram.com/starbucks',
  linkedin_url: 'https://linkedin.com/company/starbucks',
  is_verified: true,
  contact_email: 'contact@starbucks.com',
  created_at: new Date(),
  updated_at: new Date(),
  images: [],
  documents: [],
  locations: [],
};

describe('TenantProfile Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockedApiClient.get.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={['/broker/tenant-profile/tenant-123']}>
        <Routes>
          <Route path="/broker/tenant-profile/:id" element={<TenantProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading tenant profile/i)).toBeInTheDocument();
  });

  it('fetches and displays tenant profile successfully', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockTenantProfile,
    });

    render(
      <MemoryRouter initialEntries={['/broker/tenant-profile/tenant-123']}>
        <Routes>
          <Route path="/broker/tenant-profile/:id" element={<TenantProfile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('tenant-profile-view')).toBeInTheDocument();
    });

    expect(screen.getByText(/Profile: Starbucks Coffee/)).toBeInTheDocument();
    expect(screen.getByTestId('tenant-request-form')).toBeInTheDocument();
    expect(screen.getByTestId('contact-card')).toBeInTheDocument();
  });

  it('displays error message when profile fetch fails', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      success: false,
      error: 'Tenant profile not found',
    });

    render(
      <MemoryRouter initialEntries={['/broker/tenant-profile/tenant-123']}>
        <Routes>
          <Route path="/broker/tenant-profile/:id" element={<TenantProfile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading profile/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/tenant profile not found/i)).toBeInTheDocument();
  });

  it('displays back button', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockTenantProfile,
    });

    render(
      <MemoryRouter initialEntries={['/broker/tenant-profile/tenant-123']}>
        <Routes>
          <Route path="/broker/tenant-profile/:id" element={<TenantProfile />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to tenant listings/i })).toBeInTheDocument();
    });
  });
});
