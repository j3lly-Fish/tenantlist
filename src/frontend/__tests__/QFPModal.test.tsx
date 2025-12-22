/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QFPModal } from '../components/QFPModal';
import { Business, PropertyListing, PropertyType, PropertyListingStatus, BusinessStatus } from '@types';

// Mock property data
const mockProperty: PropertyListing = {
  id: 'prop-1',
  user_id: 'user-1',
  title: 'Downtown Office Tower',
  description: 'Modern office space in prime location',
  property_type: PropertyType.OFFICE,
  status: PropertyListingStatus.ACTIVE,
  address: '123 Main Street',
  city: 'Miami',
  state: 'FL',
  zip_code: '33101',
  latitude: null,
  longitude: null,
  sqft: 5000,
  lot_size: null,
  year_built: 2020,
  floors: 10,
  asking_price: 50000,
  price_per_sqft: 10,
  lease_type: 'NNN',
  cam_charges: 5,
  available_date: '2024-03-01',
  min_lease_term: '3 years',
  max_lease_term: '10 years',
  amenities: ['Parking', 'Security'],
  highlights: ['Prime Location'],
  photos: [],
  virtual_tour_url: null,
  documents: [],
  contact_name: 'John Agent',
  contact_email: 'john@cbre.com',
  contact_phone: '(305) 555-1234',
  is_featured: false,
  is_verified: true,
  created_at: new Date(),
  updated_at: new Date(),
};

// Mock businesses
const mockBusinesses: Business[] = [
  {
    id: 'biz-1',
    user_id: 'user-1',
    name: 'Acme Restaurant Group',
    logo_url: null,
    category: 'Food & Beverage',
    status: BusinessStatus.ACTIVE,
    is_verified: true,
    stealth_mode_enabled: false,
    created_at: new Date(),
    updated_at: new Date(),
    email: 'contact@acme.com',
    phone: '(305) 555-0001',
    website_url: 'https://acme.com',
  },
  {
    id: 'biz-2',
    user_id: 'user-1',
    name: 'Beta Retail Inc',
    logo_url: null,
    category: 'Retail',
    status: BusinessStatus.ACTIVE,
    is_verified: false,
    stealth_mode_enabled: false,
    created_at: new Date(),
    updated_at: new Date(),
    email: 'info@beta.com',
    phone: '(305) 555-0002',
  },
];

// Mock broker info
const mockBrokerInfo = {
  name: 'John Agent',
  company: 'CBRE',
  email: 'john@cbre.com',
  phone: '(305) 555-1234',
};

describe('QFPModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <QFPModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        property={mockProperty}
        businesses={mockBusinesses}
        brokerInfo={mockBrokerInfo}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Send Quick Fire Proposal')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <QFPModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        property={mockProperty}
        businesses={mockBusinesses}
        brokerInfo={mockBrokerInfo}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render Business Name dropdown with user businesses', () => {
    render(
      <QFPModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        property={mockProperty}
        businesses={mockBusinesses}
        brokerInfo={mockBrokerInfo}
      />
    );

    const businessSelect = screen.getByLabelText(/business name/i);
    expect(businessSelect).toBeInTheDocument();

    // Check that business options are present
    expect(screen.getByText('Acme Restaurant Group')).toBeInTheDocument();
    expect(screen.getByText('Beta Retail Inc')).toBeInTheDocument();
  });

  it('should auto-populate property info from property data', () => {
    render(
      <QFPModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        property={mockProperty}
        businesses={mockBusinesses}
        brokerInfo={mockBrokerInfo}
      />
    );

    // Check property info is displayed
    expect(screen.getByText('Downtown Office Tower')).toBeInTheDocument();
    expect(screen.getByText(/123 Main Street/)).toBeInTheDocument();
    expect(screen.getByText(/Miami, FL/)).toBeInTheDocument();
  });

  it('should render form sections: Tenant Info, Property Info, Landlord\'s Work, Tenant\'s Work', () => {
    render(
      <QFPModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        property={mockProperty}
        businesses={mockBusinesses}
        brokerInfo={mockBrokerInfo}
      />
    );

    expect(screen.getByText('Tenant Information')).toBeInTheDocument();
    expect(screen.getByText('Property Information')).toBeInTheDocument();
    expect(screen.getByText("Landlord's Work")).toBeInTheDocument();
    expect(screen.getByText("Tenant's Work")).toBeInTheDocument();
  });

  it('should render additional terms textarea', () => {
    render(
      <QFPModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        property={mockProperty}
        businesses={mockBusinesses}
        brokerInfo={mockBrokerInfo}
      />
    );

    const additionalTerms = screen.getByLabelText(/additional terms/i);
    expect(additionalTerms).toBeInTheDocument();
    expect(additionalTerms.tagName.toLowerCase()).toBe('textarea');
  });

  it('should render Preview QFP button', () => {
    render(
      <QFPModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        property={mockProperty}
        businesses={mockBusinesses}
        brokerInfo={mockBrokerInfo}
      />
    );

    expect(screen.getByRole('button', { name: /preview qfp/i })).toBeInTheDocument();
  });

  it('should show validation error when required fields are empty', async () => {
    render(
      <QFPModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        property={mockProperty}
        businesses={mockBusinesses}
        brokerInfo={mockBrokerInfo}
      />
    );

    // Click preview without selecting a business
    const previewButton = screen.getByRole('button', { name: /preview qfp/i });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText(/please select a business/i)).toBeInTheDocument();
    });
  });

  it('should show preview mode when Preview QFP is clicked with valid data', async () => {
    render(
      <QFPModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        property={mockProperty}
        businesses={mockBusinesses}
        brokerInfo={mockBrokerInfo}
      />
    );

    // Select a business
    const businessSelect = screen.getByLabelText(/business name/i);
    fireEvent.change(businessSelect, { target: { value: 'biz-1' } });

    // Click preview
    const previewButton = screen.getByRole('button', { name: /preview qfp/i });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('QFP Preview')).toBeInTheDocument();
    });
  });
});
