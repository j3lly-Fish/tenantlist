/**
 * HeroSection Component Tests (Task Group 2.1)
 *
 * Focused tests for:
 * - Headline "Get Listed" renders
 * - Subtext renders correctly
 * - "Find Space" and "List Property" CTA buttons render
 * - Stats display (Avg. Applications, Properties Matched)
 * - Button click handlers are called
 *
 * Test count: 5 focused tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from '../components/LandingPage/HeroSection';

describe('HeroSection Component', () => {
  /**
   * Test 1: Headline "Get Listed" renders
   */
  test('renders "Get Listed" headline as h1', () => {
    render(<HeroSection />);

    const headline = screen.getByRole('heading', { level: 1, name: /get listed/i });
    expect(headline).toBeInTheDocument();
    expect(headline.tagName).toBe('H1');
  });

  /**
   * Test 2: Subtext renders correctly
   */
  test('renders subtext "Providing commercial real estate pros with value"', () => {
    render(<HeroSection />);

    const subtext = screen.getByText(/providing commercial real estate pros with value/i);
    expect(subtext).toBeInTheDocument();
  });

  /**
   * Test 3: "Find Space" and "List Property" CTA buttons render
   */
  test('renders "Find Space" and "List Property" CTA buttons', () => {
    render(<HeroSection />);

    const findSpaceButton = screen.getByRole('button', { name: /find space/i });
    const listPropertyButton = screen.getByRole('button', { name: /list property/i });

    expect(findSpaceButton).toBeInTheDocument();
    expect(listPropertyButton).toBeInTheDocument();
  });

  /**
   * Test 4: Stats display (Avg. Applications, Properties Matched)
   */
  test('renders stats for Avg. Applications Per Listing and Properties Matched', () => {
    render(<HeroSection />);

    // Check for Avg. Applications stat
    const avgApplicationsLabel = screen.getByText(/avg\. applications per listing/i);
    expect(avgApplicationsLabel).toBeInTheDocument();
    const avgApplicationsValue = screen.getByText('24');
    expect(avgApplicationsValue).toBeInTheDocument();

    // Check for Properties Matched stat
    const propertiesMatchedLabel = screen.getByText(/properties matched/i);
    expect(propertiesMatchedLabel).toBeInTheDocument();
    const propertiesMatchedValue = screen.getByText(/850\+/);
    expect(propertiesMatchedValue).toBeInTheDocument();
  });

  /**
   * Test 5: Button click handlers are called
   */
  test('calls onFindSpace and onListProperty when buttons are clicked', () => {
    const mockOnFindSpace = jest.fn();
    const mockOnListProperty = jest.fn();

    render(
      <HeroSection
        onFindSpace={mockOnFindSpace}
        onListProperty={mockOnListProperty}
      />
    );

    const findSpaceButton = screen.getByRole('button', { name: /find space/i });
    const listPropertyButton = screen.getByRole('button', { name: /list property/i });

    // Click Find Space button
    fireEvent.click(findSpaceButton);
    expect(mockOnFindSpace).toHaveBeenCalledTimes(1);

    // Click List Property button
    fireEvent.click(listPropertyButton);
    expect(mockOnListProperty).toHaveBeenCalledTimes(1);
  });
});
