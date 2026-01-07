import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  BusinessProfileProvider,
  useBusinessProfile,
} from '@contexts/BusinessProfileContext';

/**
 * Test Component to access context
 */
const TestComponent: React.FC = () => {
  const { activeProfileId, selectProfile, getActiveProfile, clearProfile } =
    useBusinessProfile();

  return (
    <div>
      <div data-testid="active-profile-id">{activeProfileId || 'null'}</div>
      <button onClick={() => selectProfile('profile-123')}>Select Profile</button>
      <button onClick={() => clearProfile()}>Clear Profile</button>
      <button onClick={() => alert(getActiveProfile())}>Get Active</button>
    </div>
  );
};

describe('BusinessProfileContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('initializes with null activeProfileId when localStorage is empty', () => {
    render(
      <BusinessProfileProvider>
        <TestComponent />
      </BusinessProfileProvider>
    );

    expect(screen.getByTestId('active-profile-id')).toHaveTextContent('null');
  });

  test('initializes with activeProfileId from localStorage if available', () => {
    localStorage.setItem('broker_active_business_profile_id', 'profile-456');

    render(
      <BusinessProfileProvider>
        <TestComponent />
      </BusinessProfileProvider>
    );

    expect(screen.getByTestId('active-profile-id')).toHaveTextContent('profile-456');
  });

  test('selectProfile updates activeProfileId and persists to localStorage', () => {
    const { getByText, getByTestId } = render(
      <BusinessProfileProvider>
        <TestComponent />
      </BusinessProfileProvider>
    );

    // Initially null
    expect(getByTestId('active-profile-id')).toHaveTextContent('null');

    // Select a profile
    act(() => {
      getByText('Select Profile').click();
    });

    // Should update state
    expect(getByTestId('active-profile-id')).toHaveTextContent('profile-123');

    // Should persist to localStorage
    expect(localStorage.getItem('broker_active_business_profile_id')).toBe('profile-123');
  });

  test('clearProfile sets activeProfileId to null and removes from localStorage', () => {
    localStorage.setItem('broker_active_business_profile_id', 'profile-789');

    const { getByText, getByTestId } = render(
      <BusinessProfileProvider>
        <TestComponent />
      </BusinessProfileProvider>
    );

    // Initially has value from localStorage
    expect(getByTestId('active-profile-id')).toHaveTextContent('profile-789');

    // Clear profile
    act(() => {
      getByText('Clear Profile').click();
    });

    // Should update state to null
    expect(getByTestId('active-profile-id')).toHaveTextContent('null');

    // Should remove from localStorage
    expect(localStorage.getItem('broker_active_business_profile_id')).toBeNull();
  });

  test('getActiveProfile returns current activeProfileId', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    const { getByText } = render(
      <BusinessProfileProvider>
        <TestComponent />
      </BusinessProfileProvider>
    );

    // Select a profile first
    act(() => {
      getByText('Select Profile').click();
    });

    // Get active profile
    act(() => {
      getByText('Get Active').click();
    });

    expect(alertSpy).toHaveBeenCalledWith('profile-123');

    alertSpy.mockRestore();
  });

  test('throws error when useBusinessProfile is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useBusinessProfile must be used within a BusinessProfileProvider');

    consoleSpy.mockRestore();
  });

  test('handles localStorage errors gracefully on initialization', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const getItemSpy = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('localStorage error');
      });

    render(
      <BusinessProfileProvider>
        <TestComponent />
      </BusinessProfileProvider>
    );

    // Should initialize with null despite error
    expect(screen.getByTestId('active-profile-id')).toHaveTextContent('null');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load active profile from localStorage:',
      expect.any(Error)
    );

    getItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  test('handles localStorage errors gracefully on save', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const setItemSpy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('localStorage error');
      });

    const { getByText } = render(
      <BusinessProfileProvider>
        <TestComponent />
      </BusinessProfileProvider>
    );

    // Try to select a profile (will fail to save but should not crash)
    act(() => {
      getByText('Select Profile').click();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save active profile to localStorage:',
      expect.any(Error)
    );

    setItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
