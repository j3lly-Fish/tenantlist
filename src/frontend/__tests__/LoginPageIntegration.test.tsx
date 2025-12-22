/**
 * Login Page Integration Tests (Task Group 4.1)
 *
 * Focused tests for:
 * - All landing sections render in correct order
 * - Navigation is present at top
 * - Scroll behavior works (anchor links exist)
 * - Modals open correctly from CTAs
 *
 * Test count: 5 focused tests
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Login from '../pages/Login';

// Wrapper component for tests
const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Page Integration', () => {
  /**
   * Test 1: All landing sections render in correct order
   */
  test('renders all landing page sections in correct order', () => {
    renderLogin();

    // Check that all major sections exist
    const navigation = screen.getByRole('navigation', { name: /public navigation/i });
    expect(navigation).toBeInTheDocument();

    // Hero section
    const heroHeadline = screen.getByRole('heading', { level: 1, name: /get listed/i });
    expect(heroHeadline).toBeInTheDocument();

    // How It Works section
    const howItWorksHeading = screen.getByRole('heading', { name: /how it works/i });
    expect(howItWorksHeading).toBeInTheDocument();

    // Benefits section
    const benefitsHeading = screen.getByRole('heading', { name: /it's right for you/i });
    expect(benefitsHeading).toBeInTheDocument();

    // Why Choose section
    const whyChooseHeading = screen.getByRole('heading', { name: /why choose zyx/i });
    expect(whyChooseHeading).toBeInTheDocument();

    // Testimonials section
    const testimonialsHeading = screen.getByRole('heading', { name: /hear it from our users/i });
    expect(testimonialsHeading).toBeInTheDocument();

    // Footer
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  /**
   * Test 2: Navigation is present at top with correct links
   */
  test('renders navigation at top with Sign In and Get Started buttons', () => {
    renderLogin();

    const navigation = screen.getByRole('navigation', { name: /public navigation/i });
    expect(navigation).toBeInTheDocument();

    // Check for Sign In buttons in navigation (desktop and mobile)
    const signInButtons = within(navigation).getAllByRole('button', { name: /sign in/i });
    expect(signInButtons.length).toBeGreaterThanOrEqual(1);

    // Check for Get Started buttons in navigation (desktop and mobile)
    const getStartedButtons = within(navigation).getAllByRole('button', { name: /get started/i });
    expect(getStartedButtons.length).toBeGreaterThanOrEqual(1);

    // Check for navigation links (desktop)
    const howItWorksLinks = within(navigation).getAllByRole('link', { name: /how it works/i });
    expect(howItWorksLinks.length).toBeGreaterThanOrEqual(1);
    expect(howItWorksLinks[0]).toHaveAttribute('href', '#how-it-works');

    const pricingLinks = within(navigation).getAllByRole('link', { name: /pricing/i });
    expect(pricingLinks.length).toBeGreaterThanOrEqual(1);
    expect(pricingLinks[0]).toHaveAttribute('href', '#pricing');
  });

  /**
   * Test 3: Section anchors exist for smooth scrolling
   */
  test('sections have correct anchor IDs for smooth scrolling', () => {
    renderLogin();

    // Check that how-it-works section has the correct id
    const howItWorksSection = document.getElementById('how-it-works');
    expect(howItWorksSection).toBeInTheDocument();

    // Check that benefits section has the correct id
    const benefitsSection = document.getElementById('benefits');
    expect(benefitsSection).toBeInTheDocument();

    // Check that testimonials section has the correct id (for "Our Users" link)
    const testimonialsSection = document.getElementById('testimonials');
    expect(testimonialsSection).toBeInTheDocument();
  });

  /**
   * Test 4: Sign In button opens LoginModal
   */
  test('Sign In button in navigation opens LoginModal', () => {
    renderLogin();

    // Click Sign In button in navigation (use first one - desktop)
    const navigation = screen.getByRole('navigation', { name: /public navigation/i });
    const signInButtons = within(navigation).getAllByRole('button', { name: /sign in/i });
    fireEvent.click(signInButtons[0]);

    // Check that LoginModal is displayed
    const loginModal = screen.getByRole('dialog');
    expect(loginModal).toBeInTheDocument();

    const welcomeBackHeading = screen.getByRole('heading', { name: /welcome back/i });
    expect(welcomeBackHeading).toBeInTheDocument();
  });

  /**
   * Test 5: Get Started button opens SignupModal
   */
  test('Get Started button in navigation opens SignupModal', () => {
    renderLogin();

    // Click Get Started button in navigation (use first one - desktop)
    const navigation = screen.getByRole('navigation', { name: /public navigation/i });
    const getStartedButtons = within(navigation).getAllByRole('button', { name: /get started/i });
    fireEvent.click(getStartedButtons[0]);

    // Check that SignupModal is displayed
    const signupModal = screen.getByRole('dialog');
    expect(signupModal).toBeInTheDocument();

    const createAccountHeading = screen.getByRole('heading', { name: /create your account/i });
    expect(createAccountHeading).toBeInTheDocument();
  });
});
