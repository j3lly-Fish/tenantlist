/**
 * BusinessCard Cover Image Tests (Task Group 11.1)
 *
 * Focused tests for:
 * - Cover image renders as card background when provided
 * - Logo overlays in bottom-left corner
 * - Status badge overlays in top-right corner
 * - Gradient overlay is present for text readability
 * - Fallback when no cover image (current behavior)
 *
 * Test count: 6 focused tests
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { BusinessCard } from '../components/BusinessCard';
import { BusinessStatus, Business } from '../../types';

describe('BusinessCard - Cover Image Support', () => {
  const mockBusinessWithCoverImage: Business = {
    id: 'business-1',
    user_id: 'user-1',
    name: 'Test Restaurant',
    category: 'F&B',
    status: BusinessStatus.ACTIVE,
    is_verified: true,
    logo_url: 'https://example.com/logo.png',
    cover_image_url: 'https://example.com/cover.jpg',
    stealth_mode_enabled: false,
    created_at: new Date(),
    updated_at: new Date(),
    listingsCount: 5,
    statesCount: 3,
    invitesCount: 2,
  };

  const mockBusinessWithoutCoverImage: Business = {
    id: 'business-2',
    user_id: 'user-1',
    name: 'Test Office',
    category: 'Office',
    status: BusinessStatus.PENDING_VERIFICATION,
    is_verified: false,
    logo_url: 'https://example.com/logo2.png',
    cover_image_url: null,
    stealth_mode_enabled: false,
    created_at: new Date(),
    updated_at: new Date(),
    listingsCount: 0,
    statesCount: 1,
    invitesCount: 0,
  };

  const mockBusinessWithNoCoverOrLogo: Business = {
    id: 'business-3',
    user_id: 'user-1',
    name: 'Minimal Business',
    category: 'Retail',
    status: BusinessStatus.ACTIVE,
    is_verified: true,
    logo_url: null,
    cover_image_url: undefined,
    stealth_mode_enabled: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  /**
   * Test 1: Cover image renders as card background when provided
   */
  test('cover image renders as card background when provided', () => {
    const { container } = render(
      <BusinessCard business={mockBusinessWithCoverImage} />
    );

    const coverImageContainer = container.querySelector('[data-testid="cover-image-container"]');
    expect(coverImageContainer).toBeInTheDocument();

    const coverImage = container.querySelector('[data-testid="cover-image"]');
    expect(coverImage).toBeInTheDocument();
    expect(coverImage).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  /**
   * Test 2: Logo overlays in bottom-left corner when cover image is present
   */
  test('logo overlays in bottom-left corner when cover image is present', () => {
    const { container } = render(
      <BusinessCard business={mockBusinessWithCoverImage} />
    );

    const logoOverlay = container.querySelector('[data-testid="logo-overlay"]');
    expect(logoOverlay).toBeInTheDocument();

    // Check that logo image exists within the overlay
    const logoImage = within(logoOverlay as HTMLElement).getByRole('img');
    expect(logoImage).toHaveAttribute('alt', expect.stringContaining('Test Restaurant'));
  });

  /**
   * Test 3: Status badge overlays in top-right corner when cover image is present
   */
  test('status badge overlays in top-right corner when cover image is present', () => {
    const { container } = render(
      <BusinessCard business={mockBusinessWithCoverImage} />
    );

    const statusOverlay = container.querySelector('[data-testid="status-overlay"]');
    expect(statusOverlay).toBeInTheDocument();

    // Check that status badge exists within the overlay
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  /**
   * Test 4: Gradient overlay is present for text readability when cover image exists
   */
  test('gradient overlay is present for text readability when cover image exists', () => {
    const { container } = render(
      <BusinessCard business={mockBusinessWithCoverImage} />
    );

    const gradientOverlay = container.querySelector('[data-testid="gradient-overlay"]');
    expect(gradientOverlay).toBeInTheDocument();
  });

  /**
   * Test 5: Fallback to current behavior when no cover image
   */
  test('fallback to standard layout when no cover image is provided', () => {
    const { container } = render(
      <BusinessCard business={mockBusinessWithoutCoverImage} />
    );

    // Should not have cover image container
    const coverImageContainer = container.querySelector('[data-testid="cover-image-container"]');
    expect(coverImageContainer).not.toBeInTheDocument();

    // Should render standard logo container (centered)
    const logoContainer = container.querySelector('[class*="logoContainer"]');
    expect(logoContainer).toBeInTheDocument();

    // Status badge should still be present in standard location
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
  });

  /**
   * Test 6: Card without cover image or logo falls back gracefully
   */
  test('card without cover image uses fallback logo', () => {
    const { container } = render(
      <BusinessCard business={mockBusinessWithNoCoverOrLogo} />
    );

    // Should not have cover image container
    const coverImageContainer = container.querySelector('[data-testid="cover-image-container"]');
    expect(coverImageContainer).not.toBeInTheDocument();

    // Should have logo container with logo image using fallback (SVG data URL)
    const logoContainer = container.querySelector('[class*="logoContainer"]');
    expect(logoContainer).toBeInTheDocument();

    // Get the logo image element within the container
    const logoImage = logoContainer?.querySelector('img');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage?.src).toContain('data:image/svg');
  });
});
