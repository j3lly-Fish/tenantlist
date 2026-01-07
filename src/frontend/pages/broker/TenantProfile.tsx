import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@utils/apiClient';
import { TenantProfileView } from '@components/broker/TenantProfileView';
import { TenantRequestForm } from '@components/broker/TenantRequestForm';
import { ContactCard } from '@components/broker/ContactCard';
import styles from './TenantProfile.module.css';

/**
 * Tenant profile with all related data
 */
export interface TenantProfileWithDetails {
  id: string;
  business_id?: string | null;
  cover_image_url?: string | null;
  logo_url?: string | null;
  display_name: string;
  category?: string | null;
  about?: string | null;
  rating: number;
  review_count: number;
  website_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  is_verified: boolean;
  contact_email?: string | null;
  created_at: Date;
  updated_at: Date;
  images: Array<{
    id: string;
    image_url: string;
    display_order: number;
  }>;
  documents: Array<{
    id: string;
    document_name: string;
    document_url: string;
    document_type?: string | null;
  }>;
  locations: Array<{
    id: string;
    location_name: string;
    city?: string | null;
    state?: string | null;
    asset_type?: string | null;
    sqft_min?: number | null;
    sqft_max?: number | null;
    preferred_lease_term?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }>;
}

/**
 * TenantProfile Page
 *
 * Full tenant profile view with:
 * - Hero section with cover, logo, rating, social links
 * - About section with expand/collapse
 * - Images gallery
 * - Documents section
 * - Locations with map
 * - Admin approval request form (right sidebar)
 * - Contact card (right sidebar)
 *
 * Route: /broker/tenant-profile/:id
 */
const TenantProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TenantProfileWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Tenant ID is required');
      setLoading(false);
      return;
    }

    fetchTenantProfile();
  }, [id]);

  const fetchTenantProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<TenantProfileWithDetails>(
        `/api/broker/tenants/${id}`
      );

      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError(response.error || 'Failed to load tenant profile');
      }
    } catch (err: any) {
      console.error('Error fetching tenant profile:', err);
      setError(err.message || 'Failed to load tenant profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/broker/tenant-listings');
  };

  const handleRequestSubmit = async (data: { email: string; pin: string }) => {
    // This will be handled by TenantRequestForm component
    console.log('Request submitted:', data);
  };

  const handleSendMessage = () => {
    // TODO: Open message modal or navigate to messages
    alert('Send message functionality to be implemented');
  };

  const handleSubmitProperty = () => {
    // TODO: Open property submission modal
    alert('Submit property functionality to be implemented');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading tenant profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Profile</h2>
          <p>{error || 'Tenant profile not found'}</p>
          <button onClick={handleBack} className={styles.backButton}>
            Back to Tenant Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back button */}
      <button onClick={handleBack} className={styles.backButton}>
        ← Back to Tenant Listings
      </button>

      {/* Main layout: Left content + Right sidebar */}
      <div className={styles.layout}>
        {/* Left column: Profile content */}
        <div className={styles.leftColumn}>
          <TenantProfileView profile={profile} />
        </div>

        {/* Right sidebar: Actions */}
        <div className={styles.rightSidebar}>
          <TenantRequestForm
            tenantId={profile.id}
            tenantName={profile.display_name}
            onRequestSubmit={handleRequestSubmit}
          />

          <ContactCard
            contactName="Jason Peters"
            contactCompany="CBRE"
            contactAvatar="/avatars/default.jpg"
            onSendMessage={handleSendMessage}
            onSubmitProperty={handleSubmitProperty}
          />
        </div>
      </div>
    </div>
  );
};

export default TenantProfile;
