/**
 * PropertyCard Enhancement Tests (Task Group 11.1)
 *
 * Focused tests for:
 * - "New" badge shows for properties created <7 days ago
 * - "Hot" badge shows for properties with >10 inquiries
 * - "Updated" badge shows for recently modified properties
 * - Days on market displays correctly
 *
 * Test count: 4 focused tests
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyListing, PropertyListingStatus, PropertyType } from '../../types';

describe('PropertyCard - Activity Badges and Metrics', () => {
  const baseProperty: PropertyListing = {
    id: 'prop-1',
    user_id: 'user-1',
    title: 'Modern Office Space',
    description: 'Great office space in downtown',
    property_type: PropertyType.OFFICE,
    status: PropertyListingStatus.ACTIVE,
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94102',
    latitude: 37.7749,
    longitude: -122.4194,
    sqft: 5000,
    lot_size: 10000,
    year_built: 2020,
    floors: 3,
    asking_price: 10000,
    price_per_sqft: 2,
    lease_type: 'NNN',
    cam_charges: 500,
    available_date: '2024-01-01',
    min_lease_term: '1 year',
    max_lease_term: '5 years',
    amenities: ['Parking', 'WiFi'],
    highlights: ['Modern', 'Central'],
    photos: [{ url: 'https://example.com/photo.jpg' }],
    virtual_tour_url: null,
    documents: [],
    contact_name: 'John Doe',
    contact_email: 'john@example.com',
    contact_phone: '555-1234',
    is_featured: false,
    is_verified: true,
    days_on_market: 15,
    view_count: 50,
    inquiry_count: 5,
    last_activity_at: new Date(),
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    viewsCount: 50,
    inquiriesCount: 5,
    matchesCount: 3,
  };

  /**
   * Test 1: "New" badge shows for properties created <7 days ago
   */
  test('displays "New" badge for properties created within last 7 days', () => {
    const newProperty: PropertyListing = {
      ...baseProperty,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    };

    render(<PropertyCard property={newProperty} />);

    const newBadge = screen.getByText('New');
    expect(newBadge).toBeInTheDocument();
    expect(newBadge).toHaveClass('activityBadge');
    expect(newBadge).toHaveClass('badgeNew');
  });

  /**
   * Test 2: "Hot" badge shows for properties with >10 inquiries
   */
  test('displays "Hot" badge for properties with more than 10 inquiries', () => {
    const hotProperty: PropertyListing = {
      ...baseProperty,
      inquiry_count: 15,
      inquiriesCount: 15,
    };

    render(<PropertyCard property={hotProperty} />);

    const hotBadge = screen.getByText('Hot');
    expect(hotBadge).toBeInTheDocument();
    expect(hotBadge).toHaveClass('activityBadge');
    expect(hotBadge).toHaveClass('badgeHot');
  });

  /**
   * Test 3: "Updated" badge shows for recently modified properties
   */
  test('displays "Updated" badge for properties modified within last 24 hours', () => {
    const now = new Date();
    const createdAt = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const updatedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

    const updatedProperty: PropertyListing = {
      ...baseProperty,
      created_at: createdAt,
      updated_at: updatedAt,
    };

    render(<PropertyCard property={updatedProperty} />);

    const updatedBadge = screen.getByText('Updated');
    expect(updatedBadge).toBeInTheDocument();
    expect(updatedBadge).toHaveClass('activityBadge');
    expect(updatedBadge).toHaveClass('badgeUpdated');
  });

  /**
   * Test 4: Days on market displays correctly for active properties
   */
  test('displays days on market badge for active properties', () => {
    const activeProperty: PropertyListing = {
      ...baseProperty,
      status: PropertyListingStatus.ACTIVE,
      days_on_market: 28,
    };

    render(<PropertyCard property={activeProperty} />);

    const daysOnMarketBadge = screen.getByText(/28 days on market/i);
    expect(daysOnMarketBadge).toBeInTheDocument();
  });

  /**
   * Test 5: No activity badges show for old properties with low engagement
   */
  test('does not display activity badges for old properties with low engagement', () => {
    const oldProperty: PropertyListing = {
      ...baseProperty,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      inquiry_count: 3,
      inquiriesCount: 3,
    };

    render(<PropertyCard property={oldProperty} />);

    expect(screen.queryByText('New')).not.toBeInTheDocument();
    expect(screen.queryByText('Hot')).not.toBeInTheDocument();
    expect(screen.queryByText('Updated')).not.toBeInTheDocument();
  });

  /**
   * Test 6: Multiple badges can display simultaneously
   */
  test('displays multiple badges when conditions are met', () => {
    const now = new Date();
    const multiProperty: PropertyListing = {
      ...baseProperty,
      created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (New)
      updated_at: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago (Updated)
      inquiry_count: 12, // Hot
      inquiriesCount: 12,
    };

    render(<PropertyCard property={multiProperty} />);

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Hot')).toBeInTheDocument();
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  /**
   * Test 7: Days on market does not display for non-active properties
   */
  test('does not display days on market for leased properties', () => {
    const leasedProperty: PropertyListing = {
      ...baseProperty,
      status: PropertyListingStatus.LEASED,
      days_on_market: 45,
    };

    render(<PropertyCard property={leasedProperty} />);

    expect(screen.queryByText(/45 days on market/i)).not.toBeInTheDocument();
  });
});
