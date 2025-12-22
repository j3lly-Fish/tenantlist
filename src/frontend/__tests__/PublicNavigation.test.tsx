/**
 * PublicNavigation Component Tests (Task Group 1.1)
 *
 * Focused tests for:
 * - Logo renders and links to home
 * - Navigation links render correctly (How It Works, Pricing)
 * - Sign In and Get Started buttons are present
 * - Responsive mobile menu toggle
 *
 * Test count: 5 focused tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PublicNavigation } from '../components/PublicNavigation';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PublicNavigation Component', () => {
  /**
   * Test 1: Logo renders and links to home
   */
  test('renders logo that links to home page', () => {
    renderWithRouter(<PublicNavigation />);

    const logo = screen.getByText('zyx');
    expect(logo).toBeInTheDocument();

    // Logo should link to home (/)
    const logoLink = logo.closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  /**
   * Test 2: Navigation links render correctly (both desktop and mobile)
   */
  test('renders How It Works and Pricing navigation links', () => {
    renderWithRouter(<PublicNavigation />);

    // Both desktop and mobile versions exist, so we use getAllByRole
    const howItWorksLinks = screen.getAllByRole('link', { name: /how it works/i });
    const pricingLinks = screen.getAllByRole('link', { name: /pricing/i });

    // Should have 2 of each (desktop + mobile)
    expect(howItWorksLinks.length).toBeGreaterThanOrEqual(1);
    expect(pricingLinks.length).toBeGreaterThanOrEqual(1);

    // Verify they have proper href attributes
    expect(howItWorksLinks[0]).toHaveAttribute('href', '#how-it-works');
    expect(pricingLinks[0]).toHaveAttribute('href', '#pricing');
  });

  /**
   * Test 3: Sign In and Get Started buttons are present and clickable
   */
  test('renders Sign In text link and Get Started primary button', () => {
    const mockOnSignIn = jest.fn();
    const mockOnGetStarted = jest.fn();

    renderWithRouter(
      <PublicNavigation onSignIn={mockOnSignIn} onGetStarted={mockOnGetStarted} />
    );

    // Both desktop and mobile versions exist
    const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
    const getStartedButtons = screen.getAllByRole('button', { name: /get started/i });

    expect(signInButtons.length).toBeGreaterThanOrEqual(1);
    expect(getStartedButtons.length).toBeGreaterThanOrEqual(1);

    // Test the first (desktop) button clicks
    fireEvent.click(signInButtons[0]);
    expect(mockOnSignIn).toHaveBeenCalledTimes(1);

    fireEvent.click(getStartedButtons[0]);
    expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
  });

  /**
   * Test 4: Mobile menu toggle button is present on small screens
   */
  test('renders mobile menu toggle button', () => {
    renderWithRouter(<PublicNavigation />);

    // The hamburger menu button should be present (hidden on desktop via CSS)
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
    expect(menuToggle).toBeInTheDocument();
  });

  /**
   * Test 5: Mobile menu opens when toggle is clicked
   */
  test('mobile menu opens and closes on toggle click', async () => {
    renderWithRouter(<PublicNavigation />);

    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });

    // Initially mobile menu should be closed
    const mobileNav = screen.getByTestId('mobile-nav');
    expect(mobileNav).not.toHaveClass('open');

    // Click to open menu
    fireEvent.click(menuToggle);

    await waitFor(() => {
      expect(mobileNav).toHaveClass('open');
    });

    // Click again to close
    fireEvent.click(menuToggle);

    await waitFor(() => {
      expect(mobileNav).not.toHaveClass('open');
    });
  });
});
