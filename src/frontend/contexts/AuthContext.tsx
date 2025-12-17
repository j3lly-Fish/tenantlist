import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from '@types';

/**
 * User data stored in authentication context
 */
interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  photoUrl?: string | null;
}

/**
 * Authentication context value
 */
interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  setUser: (user: AuthUser | null) => void;
}

/**
 * Authentication context
 * Provides user state and authentication methods throughout the app
 *
 * Security:
 * - Stores authentication state in memory (not localStorage)
 * - Integrates with JWT authentication system
 * - Handles token expiration and refresh
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Initialize authentication state on mount
   * Checks if user is already authenticated via cookie
   * If access token is expired, attempts to refresh using refresh token
   */
  useEffect(() => {
    const initAuth = async () => {
      // Helper function to make fetch requests with retry on network errors
      const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fetch(url, options);
          } catch (error) {
            if (i === retries - 1) throw error;
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
          }
        }
        throw new Error('Failed to fetch after retries');
      };

      try {
        // Try to get current user from /api/auth/me endpoint
        let response = await fetchWithRetry('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Include httpOnly cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // If unauthorized (likely expired access token), try to refresh
        if (response.status === 401) {
          const refreshResponse = await fetchWithRetry('/api/auth/refresh-token', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (refreshResponse.ok) {
            // Token refreshed successfully, retry getting user
            response = await fetchWithRetry('/api/auth/me', {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });
          }
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.user) {
            const userData = data.data.user;
            setUser({
              userId: userData.id,
              email: userData.email,
              role: userData.role as UserRole,
              firstName: userData.profile?.first_name,
              lastName: userData.profile?.last_name,
              photoUrl: userData.profile?.photo_url,
            });
          }
        }
      } catch (error) {
        // Network error - user is likely not authenticated or server is unavailable
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      if (data.success && data.data.user) {
        const userData = data.data.user;
        setUser({
          userId: userData.id,
          email: userData.email,
          role: userData.role as UserRole,
          firstName: userData.profile?.first_name,
          lastName: userData.profile?.last_name,
          photoUrl: userData.profile?.photo_url,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  /**
   * Logout user and clear authentication state
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear user state, even if API call fails
      setUser(null);
    }
  }, []);

  /**
   * Refresh access token using refresh token
   * Returns true if refresh was successful
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Token refreshed successfully
        // User state remains the same, just tokens are renewed
        return true;
      }

      // Refresh failed, clear user state
      setUser(null);
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      setUser(null);
      return false;
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    role: user?.role || null,
    login,
    logout,
    refreshToken,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 * Must be used within AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
