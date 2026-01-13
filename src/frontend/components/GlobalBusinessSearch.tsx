import React, { useState, useEffect } from 'react';
import { SearchInput } from './SearchInput';
import { PersonalAccountForm } from './PersonalAccountForm';
import { BusinessProfileModal } from './BusinessProfileModal';
import { useToast } from '@contexts/ToastContext';
import './AuthModals.css';
import styles from './GlobalBusinessSearch.module.css';

interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  location?: string;
  city?: string;
  is_verified?: boolean;
}

interface GlobalBusinessSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessAdded: () => void;
}

/**
 * GlobalBusinessSearch Modal Component
 *
 * Displays a modal for searching and selecting existing businesses from the global database.
 * Allows users to add existing businesses to their portfolio or create a new one.
 *
 * Features:
 * - Global business search with 300ms debounce
 * - Search results display with business info (name, logo, location, verification badge)
 * - Business selection adds business to user's portfolio
 * - Empty state with "Create New Business" button
 * - Duplicate prevention before business creation
 * - Integrated PersonalAccountForm for creating new businesses
 * - Toast notifications for success/error states
 *
 * Props:
 * - isOpen: Controls modal visibility
 * - onClose: Callback to close the modal
 * - onBusinessAdded: Callback triggered after business is successfully added
 */
export const GlobalBusinessSearch: React.FC<GlobalBusinessSearchProps> = ({
  isOpen,
  onClose,
  onBusinessAdded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [showPersonalAccountForm, setShowPersonalAccountForm] = useState(false);
  const [showBusinessProfileModal, setShowBusinessProfileModal] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSearchQuery('');
      setBusinesses([]);
      setHasSearched(false);
      setError(null);
      setDuplicateWarning(null);
      setShowPersonalAccountForm(false);
      setShowBusinessProfileModal(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchBusinesses(searchQuery);
    } else {
      setBusinesses([]);
      setHasSearched(false);
      setDuplicateWarning(null);
    }
  }, [searchQuery]);

  const searchBusinesses = async (query: string) => {
    setIsLoading(true);
    setError(null);
    // Don't clear duplicate warning here, let it persist if set

    try {
      const response = await fetch(
        `/api/businesses/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search businesses');
      }

      const data = await response.json();
      setBusinesses(data.data?.businesses || []);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching');
      setBusinesses([]);
      setHasSearched(true);
      toast.error('Failed to search businesses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBusiness = async (business: Business) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/businesses', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId: business.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to add business to portfolio');
      }

      // Success - notify parent and close modal
      toast.success('Business added to portfolio');
      onBusinessAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding business');
      toast.error('Failed to add business. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewBusiness = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a business name to create');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDuplicateWarning(null);

    try {
      // Check for duplicates before proceeding
      const duplicateResponse = await fetch('/api/businesses/check-duplicate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: searchQuery.trim() }),
      });

      if (!duplicateResponse.ok) {
        throw new Error('Failed to check for duplicates');
      }

      const duplicateData = await duplicateResponse.json();

      if (duplicateData.data?.exists) {
        // Duplicate found - show warning
        const warningMessage =
          'This business already exists. Please search for and select the existing business.';
        setDuplicateWarning(warningMessage);
        toast.warning(warningMessage);
        setIsLoading(false);
        // Re-search to show the existing business
        await searchBusinesses(searchQuery);
        return;
      }

      // No duplicate - check if user has a profile
      const profileResponse = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (profileResponse.ok) {
        // User has a profile - go directly to business creation
        setIsLoading(false);
        setShowBusinessProfileModal(true);
      } else if (profileResponse.status === 404) {
        // User doesn't have a profile - show personal account form first
        setIsLoading(false);
        setShowPersonalAccountForm(true);
      } else {
        throw new Error('Failed to check user profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while checking for duplicates');
      toast.error('Failed to check for duplicates. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePersonalAccountFormClose = () => {
    setShowPersonalAccountForm(false);
    // Don't close the main modal, allow user to go back to search
  };

  const handlePersonalAccountFormSuccess = () => {
    setShowPersonalAccountForm(false);
    // After personal account is created, show business profile modal
    setShowBusinessProfileModal(true);
  };

  const handleBusinessProfileModalClose = () => {
    setShowBusinessProfileModal(false);
    // Don't close the main modal, allow user to go back to search
  };

  const handleBusinessCreated = () => {
    setShowBusinessProfileModal(false);
    // Notify parent that business was added
    toast.success('Business added to portfolio');
    onBusinessAdded();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen && !showPersonalAccountForm && !showBusinessProfileModal) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, showPersonalAccountForm, showBusinessProfileModal]);

  if (!isOpen) return null;

  // Show BusinessProfileModal if triggered
  if (showBusinessProfileModal) {
    return (
      <BusinessProfileModal
        isOpen={showBusinessProfileModal}
        onClose={handleBusinessProfileModalClose}
        onBusinessCreated={handleBusinessCreated}
      />
    );
  }

  // Show PersonalAccountForm if triggered
  if (showPersonalAccountForm) {
    return (
      <PersonalAccountForm
        isOpen={showPersonalAccountForm}
        onClose={handlePersonalAccountFormClose}
        onSuccess={handlePersonalAccountFormSuccess}
        initialCompanyName={searchQuery}
      />
    );
  }

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
      tabIndex={-1}
    >
      <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="search-modal-title">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        <div className="modal-header">
          <h2 id="search-modal-title" className="modal-title">
            Select your business profile
          </h2>
          <p className="modal-subtitle">
            Create your personal profile, you will then be able to create your business pages
          </p>
        </div>

        <div className={styles.searchSection}>
          <SearchInput
            placeholder="Search for your business"
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => {
              setSearchQuery('');
              setBusinesses([]);
              setHasSearched(false);
              setDuplicateWarning(null);
            }}
          />

          {duplicateWarning && (
            <div className={styles.warningMessage} role="alert">
              {duplicateWarning}
            </div>
          )}

          {error && (
            <div className="error-message general" role="alert">
              {error}
            </div>
          )}

          {isLoading && (
            <div className={styles.loadingState}>
              <p>Searching...</p>
            </div>
          )}

          {!isLoading && hasSearched && businesses.length > 0 && (
            <div className={styles.resultsContainer}>
              {businesses.map((business) => (
                <button
                  key={business.id}
                  className={styles.businessCard}
                  onClick={() => handleSelectBusiness(business)}
                  disabled={isLoading}
                  type="button"
                >
                  <div className={styles.businessLogo}>
                    {business.logo_url ? (
                      <img
                        src={business.logo_url}
                        alt={`${business.name} logo`}
                        className={styles.logoImage}
                      />
                    ) : (
                      <div className={styles.logoPlaceholder}>
                        {business.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className={styles.businessInfo}>
                    <div className={styles.businessName}>
                      {business.name}
                      {business.is_verified && (
                        <span className={styles.verifiedBadge} title="Verified">
                          ✓
                        </span>
                      )}
                    </div>
                    {(business.location || business.city) && (
                      <div className={styles.businessLocation}>
                        {business.location || business.city}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && hasSearched && businesses.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyMessage}>Can't find your business?</p>
              <button
                className={styles.createButton}
                onClick={handleCreateNewBusiness}
                disabled={isLoading}
                type="button"
              >
                Create New Business
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
