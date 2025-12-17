import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '@components/TopNavigation';
import { LoadingSpinner } from '@components/LoadingSpinner';
import { useAuth } from '@contexts/AuthContext';
import styles from './Profile.module.css';

interface ProfileData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  bio: string | null;
  photo_url: string | null;
  profile_completed: boolean;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
}

/**
 * Profile Page
 *
 * Full profile editing page where users can:
 * - View and edit personal information (first name, last name)
 * - Update contact details (phone)
 * - Change profile photo
 * - Edit bio/description
 */
const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phone?: string;
  }>({});

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordValidationErrors, setPasswordValidationErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/profile', {
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to load profile');
        }

        const profileData = data.data.profile;
        setProfile(profileData);

        // Initialize form fields
        setFirstName(profileData.first_name || '');
        setLastName(profileData.last_name || '');
        setPhone(profileData.phone || '');
        setBio(profileData.bio || '');
        setPhotoUrl(profileData.photo_url);
        setPhotoPreview(profileData.photo_url);
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Track changes
  useEffect(() => {
    if (!profile) return;

    const changed =
      firstName !== (profile.first_name || '') ||
      lastName !== (profile.last_name || '') ||
      phone !== (profile.phone || '') ||
      bio !== (profile.bio || '') ||
      photoUrl !== profile.photo_url;

    setHasChanges(changed);
  }, [firstName, lastName, phone, bio, photoUrl, profile]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (firstName.length > 50) {
      errors.firstName = 'First name must be 50 characters or less';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (lastName.length > 50) {
      errors.lastName = 'Last name must be 50 characters or less';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setSaveError('Please select a JPG, PNG, or GIF image');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSaveError('Image must be less than 10MB');
      return;
    }

    // Create preview and base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setPhotoUrl(base64);
      setSaveError(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle photo remove
  const handlePhotoRemove = () => {
    setPhotoUrl(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          bio: bio.trim() || null,
          photo_url: photoUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to save profile');
      }

      // Update local state
      setProfile(data.data.profile);
      setSaveSuccess(true);
      setHasChanges(false);

      // Update auth context with new name/photo
      if (user) {
        setUser({
          ...user,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          photoUrl: photoUrl,
        });
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setSaveError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel/discard changes
  const handleCancel = () => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setPhotoUrl(profile.photo_url);
      setPhotoPreview(profile.photo_url);
      setValidationErrors({});
      setSaveError(null);
    }
  };

  // Format phone number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);

    if (value.length >= 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
    } else if (value.length >= 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }

    setPhone(value);
  };

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const errors: typeof passwordValidationErrors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      errors.newPassword = 'Password must include uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    try {
      setPasswordChanging(true);
      setPasswordError(null);
      setPasswordSuccess(false);

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to change password');
      }

      // Success
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      // Clear success message after 5 seconds
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordChanging(false);
    }
  };

  // Cancel password change
  const handleCancelPasswordChange = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordValidationErrors({});
    setPasswordError(null);
    setShowPasswordSection(false);
  };

  // Get subscription tier display name
  const getTierDisplayName = (tier: string) => {
    const tierNames: Record<string, string> = {
      starter: 'Starter (Free)',
      pro: 'Pro',
      premium: 'Premium',
      enterprise: 'Enterprise',
    };
    return tierNames[tier] || tier;
  };

  // Get tier badge color
  const getTierBadgeClass = (tier: string) => {
    const tierClasses: Record<string, string> = {
      starter: styles.tierStarter,
      pro: styles.tierPro,
      premium: styles.tierPremium,
      enterprise: styles.tierEnterprise,
    };
    return tierClasses[tier] || styles.tierStarter;
  };

  if (loading) {
    return (
      <div className={styles.profile}>
        <TopNavigation />
        <main className={styles.content}>
          <LoadingSpinner size="large" centered />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profile}>
        <TopNavigation />
        <main className={styles.content}>
          <div className={styles.errorState}>
            <h2>Error Loading Profile</h2>
            <p>{error}</p>
            <button className={styles.retryButton} onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.profile}>
      <TopNavigation />

      <main className={styles.content}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <button className={styles.backLink} onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
            <h1 className={styles.title}>Profile Settings</h1>
            <p className={styles.subtitle}>Manage your personal information and account settings</p>
          </div>

          {/* Success/Error Messages */}
          {saveSuccess && (
            <div className={styles.successMessage}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Profile saved successfully!
            </div>
          )}

          {saveError && (
            <div className={styles.errorMessage}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {saveError}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Profile Photo Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Profile Photo</h2>
              <div className={styles.photoSection}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handlePhotoSelect}
                  className={styles.fileInput}
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className={styles.photoDropZone}>
                  <div className={styles.photoContainer}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className={styles.photo} />
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        <span>+</span>
                        <span className={styles.photoPlaceholderText}>Upload Photo</span>
                      </div>
                    )}
                  </div>
                  {photoPreview && (
                    <button
                      type="button"
                      className={styles.removePhotoOverlay}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePhotoRemove();
                      }}
                    >
                      &times;
                    </button>
                  )}
                </label>
                <p className={styles.photoHint}>JPG, PNG, or GIF. Max 10MB.</p>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Personal Information</h2>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="firstName" className={styles.label}>
                    First Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`${styles.input} ${validationErrors.firstName ? styles.inputError : ''}`}
                    placeholder="Enter your first name"
                    maxLength={50}
                  />
                  {validationErrors.firstName && (
                    <span className={styles.fieldError}>{validationErrors.firstName}</span>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="lastName" className={styles.label}>
                    Last Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`${styles.input} ${validationErrors.lastName ? styles.inputError : ''}`}
                    placeholder="Enter your last name"
                    maxLength={50}
                  />
                  {validationErrors.lastName && (
                    <span className={styles.fieldError}>{validationErrors.lastName}</span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="phone" className={styles.label}>
                  Phone Number <span className={styles.required}>*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`${styles.input} ${validationErrors.phone ? styles.inputError : ''}`}
                  placeholder="(555) 555-5555"
                />
                {validationErrors.phone && <span className={styles.fieldError}>{validationErrors.phone}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="bio" className={styles.label}>
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className={styles.textarea}
                  placeholder="Tell us a bit about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <span className={styles.charCount}>{bio.length}/500</span>
              </div>
            </div>

            {/* Account Information Section (Read-only) */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Account Information</h2>

              <div className={styles.field}>
                <label className={styles.label}>Email Address</label>
                <div className={styles.readOnlyField}>
                  <span>{user?.email}</span>
                  <span className={styles.readOnlyBadge}>Cannot be changed</span>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Account Type</label>
                <div className={styles.readOnlyField}>
                  <span className={styles.roleDisplay}>
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
                  </span>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Subscription Plan</label>
                <div className={styles.readOnlyField}>
                  <span className={`${styles.tierBadge} ${getTierBadgeClass(profile?.subscription_tier || 'starter')}`}>
                    {getTierDisplayName(profile?.subscription_tier || 'starter')}
                  </span>
                  <button type="button" className={styles.upgradeLink} onClick={() => alert('Upgrade feature coming soon!')}>
                    Upgrade Plan
                  </button>
                </div>
              </div>

              {profile?.created_at && (
                <div className={styles.field}>
                  <label className={styles.label}>Member Since</label>
                  <div className={styles.readOnlyField}>
                    <span>{new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Password Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Password</h2>

              {/* Password change success message */}
              {passwordSuccess && (
                <div className={styles.successMessage}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Password changed successfully!
                </div>
              )}

              {!showPasswordSection ? (
                <div className={styles.field}>
                  <p className={styles.passwordDescription}>
                    Keep your account secure by using a strong password that you don't use elsewhere.
                  </p>
                  <button
                    type="button"
                    className={styles.changePasswordButton}
                    onClick={() => setShowPasswordSection(true)}
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <div className={styles.passwordChangeForm}>
                  {passwordError && (
                    <div className={styles.errorMessage}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      {passwordError}
                    </div>
                  )}

                  <div className={styles.field}>
                    <label htmlFor="currentPassword" className={styles.label}>
                      Current Password <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`${styles.input} ${passwordValidationErrors.currentPassword ? styles.inputError : ''}`}
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                    />
                    {passwordValidationErrors.currentPassword && (
                      <span className={styles.fieldError}>{passwordValidationErrors.currentPassword}</span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="newPassword" className={styles.label}>
                      New Password <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${styles.input} ${passwordValidationErrors.newPassword ? styles.inputError : ''}`}
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                    />
                    {passwordValidationErrors.newPassword && (
                      <span className={styles.fieldError}>{passwordValidationErrors.newPassword}</span>
                    )}
                    <span className={styles.fieldHint}>
                      Must be at least 8 characters with uppercase, lowercase, and a number
                    </span>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="confirmPassword" className={styles.label}>
                      Confirm New Password <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${styles.input} ${passwordValidationErrors.confirmPassword ? styles.inputError : ''}`}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                    />
                    {passwordValidationErrors.confirmPassword && (
                      <span className={styles.fieldError}>{passwordValidationErrors.confirmPassword}</span>
                    )}
                  </div>

                  <div className={styles.passwordActions}>
                    <button
                      type="button"
                      className={styles.cancelPasswordButton}
                      onClick={handleCancelPasswordChange}
                      disabled={passwordChanging}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.updatePasswordButton}
                      onClick={handlePasswordChange}
                      disabled={passwordChanging}
                    >
                      {passwordChanging ? (
                        <>
                          <span className={styles.spinner}></span>
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={!hasChanges || saving}
              >
                Discard Changes
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={!hasChanges || saving}
              >
                {saving ? (
                  <>
                    <span className={styles.spinner}></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
