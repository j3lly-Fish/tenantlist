import React, { useState, useEffect } from 'react';
import styles from './BusinessProfileSelector.module.css';
import apiClient from '@utils/apiClient';
import { useBusinessProfile } from '@contexts/BusinessProfileContext';

/**
 * BusinessProfileSelector Component
 *
 * Right sidebar component for selecting active business profile.
 * Features:
 * - Search/filter profiles by company name
 * - Display profiles with logo, name, verified badge
 * - Click to select/activate profile
 * - Create new business button
 * - Active profile highlighted
 * - Persists selection in localStorage via context
 */

interface BusinessProfile {
  id: string;
  company_name: string;
  logo_url: string | null;
  cover_image_url: string | null;
  established_year: number | null;
  location_city: string | null;
  location_state: string | null;
  about: string | null;
  website_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  is_verified: boolean;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  stats?: {
    offices_count: number;
    agents_count: number;
    tenants_count: number;
    properties_count: number;
  };
}

interface BusinessProfileSelectorProps {
  onCreateClick: () => void;
  onProfileChange?: (profileId: string | null) => void;
}

export const BusinessProfileSelector: React.FC<BusinessProfileSelectorProps> = ({
  onCreateClick,
  onProfileChange,
}) => {
  const { activeProfileId, selectProfile } = useBusinessProfile();
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<BusinessProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Filter profiles when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter((profile) =>
        profile.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProfiles(filtered);
    }
  }, [searchTerm, profiles]);

  const loadProfiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<{
        profiles: BusinessProfile[];
        total: number;
      }>('/api/broker/business-profiles');

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load business profiles');
      }

      setProfiles(response.data.profiles);
      setFilteredProfiles(response.data.profiles);
    } catch (err: any) {
      console.error('Failed to load business profiles:', err);
      setError(err.message || 'Failed to load business profiles');
      setProfiles([]);
      setFilteredProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSelect = (profileId: string) => {
    const newProfileId = profileId === activeProfileId ? null : profileId;
    selectProfile(newProfileId);
    onProfileChange?.(newProfileId);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCreateClick = () => {
    onCreateClick();
  };

  // Get initials for profile logo fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className={styles.selector}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Select your business profile</h2>
        <p className={styles.subtitle}>
          Create your personal profile, you will then be able to create your business pages
        </p>
      </div>

      {/* Search Input */}
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search for business..."
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {/* Error State */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          Loading profiles...
        </div>
      )}

      {/* Profile List */}
      {!isLoading && filteredProfiles.length > 0 && (
        <div className={styles.profileList}>
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className={`${styles.profileCard} ${
                activeProfileId === profile.id ? styles.active : ''
              }`}
              onClick={() => handleProfileSelect(profile.id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleProfileSelect(profile.id);
                }
              }}
            >
              {/* Logo */}
              <div className={styles.profileLogo}>
                {profile.logo_url ? (
                  <img
                    src={profile.logo_url}
                    alt={`${profile.company_name} logo`}
                    className={styles.profileLogoImage}
                  />
                ) : (
                  <span>{getInitials(profile.company_name)}</span>
                )}
              </div>

              {/* Info */}
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>
                  <span className={styles.profileNameText}>{profile.company_name}</span>
                  {profile.is_verified && (
                    <svg
                      className={styles.verifiedBadge}
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      aria-label="Verified"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 0L10.146 2.146L13 2.5L12.5 5.354L14.646 7.5L12.5 9.646L13 12.5L10.146 12.854L8 15L5.854 12.854L3 12.5L3.5 9.646L1.354 7.5L3.5 5.354L3 2.5L5.854 2.146L8 0Z"
                        clipRule="evenodd"
                      />
                      <path
                        d="M6 8L7.5 9.5L10.5 6.5"
                        stroke="white"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                {profile.location_city && profile.location_state && (
                  <div className={styles.profileLocation}>
                    {profile.location_city}, {profile.location_state}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProfiles.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🏢</div>
          <p className={styles.emptyStateText}>Can't find your business?</p>
          <p className={styles.emptyStateSubtext}>
            {searchTerm
              ? 'No profiles match your search. Try a different search term or create a new business.'
              : 'You haven\'t created any business profiles yet.'}
          </p>
        </div>
      )}

      {/* Create New Business Button */}
      <button
        type="button"
        className={styles.createButton}
        onClick={handleCreateClick}
        disabled={isLoading}
      >
        <span>+ Create New Business</span>
      </button>
    </aside>
  );
};
