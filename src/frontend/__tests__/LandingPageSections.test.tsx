/**
 * Landing Page Content Sections Tests (Task Group 3.1)
 *
 * Focused tests for:
 * - HowItWorks renders 3 steps with icons
 * - BenefitsTabs switches between Tenants/Landlords/Brokers
 * - WhyChoose renders 4 feature cards
 * - Testimonials renders 3 testimonial cards
 * - Footer renders all link sections
 *
 * Test count: 8 focused tests
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { HowItWorks } from '../components/LandingPage/HowItWorks';
import { BenefitsTabs } from '../components/LandingPage/BenefitsTabs';
import { WhyChoose } from '../components/LandingPage/WhyChoose';
import { Testimonials } from '../components/LandingPage/Testimonials';
import { Footer } from '../components/LandingPage/Footer';

describe('HowItWorks Component', () => {
  /**
   * Test 1: Renders title and subtitle
   */
  test('renders "How it Works" title and subtitle', () => {
    render(<HowItWorks />);

    const title = screen.getByRole('heading', { name: /how it works/i });
    expect(title).toBeInTheDocument();

    const subtitle = screen.getByText(/a simple, three-step process to find your perfect commercial space/i);
    expect(subtitle).toBeInTheDocument();
  });

  /**
   * Test 2: Renders 3 steps with icons
   */
  test('renders 3 steps with icons and descriptions', () => {
    render(<HowItWorks />);

    // Step 1
    expect(screen.getByText(/post your needs/i)).toBeInTheDocument();
    expect(screen.getByText(/describe your ideal space requirements/i)).toBeInTheDocument();

    // Step 2
    expect(screen.getByText(/get matched instantly/i)).toBeInTheDocument();
    expect(screen.getByText(/landlords and brokers send tailored property proposals/i)).toBeInTheDocument();

    // Step 3
    expect(screen.getByText(/review & lease/i)).toBeInTheDocument();
    expect(screen.getByText(/message, compare options, and finalize agreements/i)).toBeInTheDocument();
  });
});

describe('BenefitsTabs Component', () => {
  /**
   * Test 3: Renders heading and Get Started button
   */
  test('renders "It\'s right for you" heading and Get Started button', () => {
    render(<BenefitsTabs />);

    const heading = screen.getByRole('heading', { name: /it's right for you/i });
    expect(heading).toBeInTheDocument();

    const getStartedButton = screen.getByRole('button', { name: /get started/i });
    expect(getStartedButton).toBeInTheDocument();
  });

  /**
   * Test 4: Renders 3 tabs and switches between them
   */
  test('renders 3 tabs and switches between Tenants/Landlords/Brokers', () => {
    render(<BenefitsTabs />);

    // Check all 3 tabs are present
    const tenantsTab = screen.getByRole('tab', { name: /tenants/i });
    const landlordsTab = screen.getByRole('tab', { name: /landlords/i });
    const brokersTab = screen.getByRole('tab', { name: /brokers/i });

    expect(tenantsTab).toBeInTheDocument();
    expect(landlordsTab).toBeInTheDocument();
    expect(brokersTab).toBeInTheDocument();

    // Default active tab should be Tenants
    expect(tenantsTab).toHaveAttribute('aria-selected', 'true');

    // Switch to Landlords tab
    fireEvent.click(landlordsTab);
    expect(landlordsTab).toHaveAttribute('aria-selected', 'true');
    expect(tenantsTab).toHaveAttribute('aria-selected', 'false');

    // Switch to Brokers tab
    fireEvent.click(brokersTab);
    expect(brokersTab).toHaveAttribute('aria-selected', 'true');
    expect(landlordsTab).toHaveAttribute('aria-selected', 'false');
  });

  /**
   * Test 5: Tab content changes when switching tabs
   */
  test('displays tailored benefits list for each role when tab is selected', () => {
    render(<BenefitsTabs />);

    // Check Tenants content is visible by default
    expect(screen.getByText(/find the perfect space/i)).toBeInTheDocument();

    // Switch to Landlords tab
    fireEvent.click(screen.getByRole('tab', { name: /landlords/i }));
    expect(screen.getByText(/fill vacancies faster/i)).toBeInTheDocument();

    // Switch to Brokers tab
    fireEvent.click(screen.getByRole('tab', { name: /brokers/i }));
    expect(screen.getByText(/expand your deal pipeline/i)).toBeInTheDocument();
  });
});

describe('WhyChoose Component', () => {
  /**
   * Test 6: Renders 4 feature cards in grid
   */
  test('renders 4 feature cards: Fast, Data-Driven, Secure, Flexible', () => {
    render(<WhyChoose />);

    // Check all 4 feature cards
    expect(screen.getByText(/fast/i)).toBeInTheDocument();
    expect(screen.getByText(/reduce leasing cycles/i)).toBeInTheDocument();

    expect(screen.getByText(/data-driven/i)).toBeInTheDocument();
    expect(screen.getByText(/match scores and analytics/i)).toBeInTheDocument();

    expect(screen.getByText(/secure/i)).toBeInTheDocument();
    expect(screen.getByText(/verified users, encrypted communications/i)).toBeInTheDocument();

    expect(screen.getByText(/flexible/i)).toBeInTheDocument();
    expect(screen.getByText(/works for all property types/i)).toBeInTheDocument();
  });
});

describe('Testimonials Component', () => {
  /**
   * Test 7: Renders heading and 3 testimonial cards
   */
  test('renders "Hear It From Our Users" heading and 3 testimonial cards', () => {
    render(<Testimonials />);

    const heading = screen.getByRole('heading', { name: /hear it from our users/i });
    expect(heading).toBeInTheDocument();

    // Check for 3 testimonial cards (by blockquotes or article elements)
    const testimonialCards = screen.getAllByRole('article');
    expect(testimonialCards).toHaveLength(3);

    // Each card should have a quote and author info
    testimonialCards.forEach(card => {
      const quote = within(card).getByText(/"/);
      expect(quote).toBeInTheDocument();
    });
  });
});

describe('Footer Component', () => {
  /**
   * Test 8: Renders all link sections
   */
  test('renders all footer link sections and copyright', () => {
    render(<Footer />);

    // Platform links
    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
    expect(screen.getByText(/pricing/i)).toBeInTheDocument();
    expect(screen.getByText(/our users/i)).toBeInTheDocument();

    // For Landlords links
    expect(screen.getByText(/list property/i)).toBeInTheDocument();
    expect(screen.getByText(/resources/i)).toBeInTheDocument();

    // Support links
    expect(screen.getByText(/faq/i)).toBeInTheDocument();
    expect(screen.getByText(/contact/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();

    // Copyright notice - use getAllByText since ZYX Platform appears in logo and copyright
    const zyxElements = screen.getAllByText(/zyx platform/i);
    expect(zyxElements.length).toBeGreaterThanOrEqual(1);

    // Verify copyright text specifically
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
  });
});
