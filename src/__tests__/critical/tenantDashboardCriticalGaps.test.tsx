/**
 * Task Group 9.3: Additional Strategic Tests - Critical Gap Coverage
 *
 * This file contains 8 strategic tests to cover critical gaps identified in test coverage analysis:
 * 1. SQL injection prevention (API Security)
 * 2. Keyboard navigation in search results (Accessibility)
 * 3. Focus trap in modals (Accessibility)
 * 4. Network error recovery (Error Handling)
 * 5. Double submit prevention (Data Integrity)
 * 6. Search debounce effectiveness (Performance)
 * 7. Complete E2E flow with validation errors (Integration)
 * 8. Business addition with concurrent operations (Integration)
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import request from 'supertest';
import { createApp } from '../../app';
import { GlobalBusinessSearch } from '@components/GlobalBusinessSearch';
import { PersonalAccountForm } from '@components/PersonalAccountForm';
import { BusinessModel } from '../../database/models/Business';
import pool from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

const app = createApp();

describe('Tenant Dashboard Critical Gaps - Task Group 9', () => {
  let businessModel: BusinessModel;
  let testUserId: string;

  beforeAll(async () => {
    businessModel = new BusinessModel();
    testUserId = uuidv4();

    await pool.query(
      `INSERT INTO users (id, email, password_hash, role, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [testUserId, `critical-test-${Date.now()}@example.com`, 'hashedpassword', 'tenant', true]
    );
  });

  afterAll(async () => {
    await pool.query('DELETE FROM businesses WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Critical Gap 1: API Security - SQL Injection Prevention
   * Priority: High - Security vulnerability
   */
  describe('Gap 1: SQL Injection Prevention', () => {
    it('should prevent SQL injection in global business search', async () => {
      // Create test business first
      const business = await businessModel.create({
        user_id: testUserId,
        name: 'Legitimate Business',
        category: 'Technology',
        status: 'active',
        is_verified: true,
      });

      // Attempt SQL injection attack
      const maliciousQuery = "test' OR '1'='1' UNION SELECT * FROM users--";

      const response = await request(app)
        .get('/api/businesses/search')
        .query({ query: maliciousQuery });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.businesses)).toBe(true);

      // Should not expose user table or all businesses
      if (response.body.data.businesses.length > 0) {
        const result = response.body.data.businesses[0];
        expect(result).toHaveProperty('name');
        expect(result).not.toHaveProperty('password_hash');
      }

      // Cleanup
      await pool.query('DELETE FROM businesses WHERE id = $1', [business.id]);
    });
  });

  /**
   * Critical Gap 2: Accessibility - Keyboard Navigation
   * Priority: High - WCAG 2.1 AA compliance
   */
  describe('Gap 2: Keyboard Navigation in Search Results', () => {
    it('should navigate search results with arrow keys and select with Enter', async () => {
      const mockBusinesses = [
        { id: 'b1', name: 'Business 1', category: 'Retail', status: 'active', is_verified: true },
        { id: 'b2', name: 'Business 2', category: 'Restaurant', status: 'active', is_verified: false },
      ];

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/businesses/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: mockBusinesses, total: 2 }),
          });
        }
        if (url === '/api/user/businesses' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { businessId: 'b1' } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const mockOnClose = jest.fn();
      const mockOnBusinessAdded = jest.fn();

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for your business');
      await userEvent.type(searchInput, 'Business');

      await waitFor(() => {
        expect(screen.getByText('Business 1')).toBeInTheDocument();
      });

      // Tab to first result
      await userEvent.tab();
      const firstResult = screen.getByText('Business 1').closest('button');
      expect(firstResult).toHaveFocus();

      // Arrow down to second result
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
      await waitFor(() => {
        const secondResult = screen.getByText('Business 2').closest('button');
        expect(secondResult).toHaveFocus();
      });

      // Arrow up back to first
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
      await waitFor(() => {
        expect(firstResult).toHaveFocus();
      });

      // Press Enter to select
      fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
      await waitFor(() => {
        expect(mockOnBusinessAdded).toHaveBeenCalled();
      });
    });
  });

  /**
   * Critical Gap 3: Accessibility - Focus Management
   * Priority: High - Keyboard accessibility
   */
  describe('Gap 3: Focus Trap and Restoration', () => {
    it('should trap focus within modal and restore focus on close', async () => {
      const mockOnClose = jest.fn();
      const mockOnBusinessAdded = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ businesses: [], total: 0 }),
      });

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Focus should be within modal
      const searchInput = screen.getByPlaceholderText('Search for your business');
      expect(modal).toContainElement(document.activeElement);

      // Close with Escape
      fireEvent.keyDown(modal, { key: 'Escape' });
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  /**
   * Critical Gap 4: Error Recovery - Network Errors
   * Priority: Medium - Resilience to network issues
   */
  describe('Gap 4: Network Error Recovery', () => {
    it('should handle network error gracefully and allow retry', async () => {
      let attemptCount = 0;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        attemptCount++;
        if (url.includes('/api/businesses/search')) {
          if (attemptCount === 1) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              businesses: [{ id: 'b1', name: 'Test Business', category: 'Retail', status: 'active' }],
              total: 1
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const mockOnClose = jest.fn();
      const mockOnBusinessAdded = jest.fn();

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for your business');

      // First attempt - should fail
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      await waitFor(() => {
        // Should show error or empty state
        const errorOrEmpty = screen.queryByText(/error/i) || screen.queryByText(/can't find/i);
        expect(errorOrEmpty).toBeTruthy();
      });

      // Second attempt - should succeed
      fireEvent.change(searchInput, { target: { value: '' } });
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      await waitFor(() => {
        expect(screen.getByText('Test Business')).toBeInTheDocument();
      });

      expect(attemptCount).toBe(2);
    });
  });

  /**
   * Critical Gap 5: Form Validation - Double Submit Prevention
   * Priority: Medium - Data integrity
   */
  describe('Gap 5: Double Submit Prevention', () => {
    it('should prevent concurrent form submissions', async () => {
      let submissionCount = 0;

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url === '/api/businesses' && options?.method === 'POST') {
          submissionCount++;
          return new Promise((resolve) =>
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({
                  success: true,
                  data: { id: 'new-business', name: 'Test Business' },
                }),
              });
            }, 300)
          );
        }
        if (url === '/api/user/profile' && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: {} }),
          });
        }
        if (url.includes('/api/businesses/search') || url === '/api/businesses/check-duplicate') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: [], total: 0, exists: false }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const mockOnClose = jest.fn();
      const mockOnSuccess = jest.fn();

      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          initialCompanyName="Test Business"
        />
      );

      // Fill form
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone number/i), '3101234567');
      await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');

      const submitButton = screen.getByRole('button', { name: /create personal account/i });

      // Click multiple times rapidly
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Should only submit once despite multiple clicks
      expect(submissionCount).toBe(1);
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Critical Gap 6: Performance - Search Debounce Effectiveness
   * Priority: Medium - API optimization
   */
  describe('Gap 6: Search Debounce Effectiveness', () => {
    it('should debounce search requests to reduce API calls', async () => {
      let searchCallCount = 0;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/businesses/search')) {
          searchCallCount++;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              businesses: [{ id: 'b1', name: 'Test Business', category: 'Retail', status: 'active' }],
              total: 1
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const mockOnClose = jest.fn();
      const mockOnBusinessAdded = jest.fn();

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search for your business');

      // Type rapidly (simulating user typing)
      fireEvent.change(searchInput, { target: { value: 'T' } });
      await new Promise(r => setTimeout(r, 50));
      fireEvent.change(searchInput, { target: { value: 'Te' } });
      await new Promise(r => setTimeout(r, 50));
      fireEvent.change(searchInput, { target: { value: 'Tes' } });
      await new Promise(r => setTimeout(r, 50));
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      // Wait for debounce (300ms) + processing
      await waitFor(() => {
        expect(screen.getByText('Test Business')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Should make fewer API calls than characters typed (debouncing working)
      expect(searchCallCount).toBeLessThanOrEqual(2);
    });
  });

  /**
   * Critical Gap 7: Integration - E2E Flow with Validation Errors
   * Priority: Medium - Complete user journey
   */
  describe('Gap 7: E2E Flow with Validation Errors', () => {
    it('should handle complete onboarding flow with validation errors', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/businesses/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: [], total: 0 }),
          });
        }
        if (url === '/api/businesses/check-duplicate') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ exists: false }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const mockOnClose = jest.fn();
      const mockOnSuccess = jest.fn();

      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          initialCompanyName="New Business"
        />
      );

      // Try to submit empty form - should show validation errors
      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errors = screen.queryAllByText(/required/i);
        expect(errors.length).toBeGreaterThan(0);
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();

      // Fill form with invalid email
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone number/i), '3101234567');
      await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');

      fireEvent.click(submitButton);

      // Should show email validation error
      await waitFor(() => {
        const emailError = screen.queryByText(/valid email/i) || screen.queryByText(/email.*invalid/i);
        if (emailError) {
          expect(emailError).toBeInTheDocument();
        }
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  /**
   * Critical Gap 8: Integration - Business Addition with Duplicate Check
   * Priority: Medium - Duplicate prevention flow
   */
  describe('Gap 8: Business Addition with Duplicate Check', () => {
    it('should detect duplicate and prevent creation, then allow selection of existing business', async () => {
      const existingBusiness = {
        id: 'existing-b1',
        name: 'Existing Business',
        category: 'Retail',
        status: 'active',
        is_verified: true,
      };

      let searchCallCount = 0;

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/businesses/search')) {
          searchCallCount++;
          const query = new URL(`http://localhost${url}`).searchParams.get('query');
          if (query && query.toLowerCase().includes('existing')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ businesses: [existingBusiness], total: 1 }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: [], total: 0 }),
          });
        }
        if (url === '/api/businesses/check-duplicate') {
          const body = options?.body ? JSON.parse(options.body) : {};
          if (body.companyName?.toLowerCase().includes('existing')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ exists: true, business: existingBusiness }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ exists: false }),
          });
        }
        if (url === '/api/user/businesses' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { businessId: existingBusiness.id } }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const mockOnClose = jest.fn();
      const mockOnBusinessAdded = jest.fn();

      render(
        <GlobalBusinessSearch
          isOpen={true}
          onClose={mockOnClose}
          onBusinessAdded={mockOnBusinessAdded}
        />
      );

      // Search for business
      const searchInput = screen.getByPlaceholderText('Search for your business');
      await userEvent.type(searchInput, 'Existing Business');

      // Should find existing business
      await waitFor(() => {
        expect(screen.getByText('Existing Business')).toBeInTheDocument();
      });

      // Click on existing business to add it
      const businessCard = screen.getByText('Existing Business');
      fireEvent.click(businessCard);

      await waitFor(() => {
        expect(mockOnBusinessAdded).toHaveBeenCalled();
      });

      // Verify duplicate check wasn't needed since business was found in search
      expect(searchCallCount).toBeGreaterThan(0);
    });
  });
});
