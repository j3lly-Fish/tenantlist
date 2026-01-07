import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Business Profile Context
 *
 * Provides active business profile selection and persistence across the broker dashboard.
 * Stores the active profile ID in localStorage for persistence across sessions.
 */

interface BusinessProfileContextValue {
  activeProfileId: string | null;
  selectProfile: (profileId: string | null) => void;
  getActiveProfile: () => string | null;
  clearProfile: () => void;
}

const BusinessProfileContext = createContext<BusinessProfileContextValue | undefined>(undefined);

const STORAGE_KEY = 'broker_active_business_profile_id';

interface BusinessProfileProviderProps {
  children: ReactNode;
}

export const BusinessProfileProvider: React.FC<BusinessProfileProviderProps> = ({ children }) => {
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored || null;
    } catch (error) {
      console.error('Failed to load active profile from localStorage:', error);
      return null;
    }
  });

  // Persist to localStorage whenever activeProfileId changes
  useEffect(() => {
    try {
      if (activeProfileId) {
        localStorage.setItem(STORAGE_KEY, activeProfileId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save active profile to localStorage:', error);
    }
  }, [activeProfileId]);

  const selectProfile = (profileId: string | null) => {
    setActiveProfileId(profileId);
  };

  const getActiveProfile = () => {
    return activeProfileId;
  };

  const clearProfile = () => {
    setActiveProfileId(null);
  };

  const value: BusinessProfileContextValue = {
    activeProfileId,
    selectProfile,
    getActiveProfile,
    clearProfile,
  };

  return (
    <BusinessProfileContext.Provider value={value}>
      {children}
    </BusinessProfileContext.Provider>
  );
};

/**
 * Hook to access BusinessProfileContext
 * @throws Error if used outside of BusinessProfileProvider
 */
export const useBusinessProfile = (): BusinessProfileContextValue => {
  const context = useContext(BusinessProfileContext);
  if (!context) {
    throw new Error('useBusinessProfile must be used within a BusinessProfileProvider');
  }
  return context;
};
