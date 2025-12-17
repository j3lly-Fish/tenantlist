import React, { useState } from 'react';
import './AuthModals.css';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  role: string;
  onProfileCompleted: () => void;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  email,
  role,
  onProfileCompleted
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    photo?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Get role-specific subtitle
  const getSubtitle = () => {
    switch (role) {
      case 'tenant':
        return 'Describe your space needs and receive bids from property owners';
      case 'landlord':
        return 'List your properties and connect with qualified tenants';
      case 'broker':
        return 'Represent clients and facilitate commercial real estate deals';
      default:
        return 'Complete your profile to get started';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { firstName?: string; lastName?: string; phone?: string; photo?: string } = {};

    if (!firstName || firstName.trim().length === 0) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.length > 50) {
      newErrors.firstName = 'First name must be 50 characters or less';
    }

    if (!lastName || lastName.trim().length === 0) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.length > 50) {
      newErrors.lastName = 'Last name must be 50 characters or less';
    }

    if (!phone || phone.trim().length === 0) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (e.g., (310) 123 4567)';
    }

    if (photoFile && photoFile.size > 10 * 1024 * 1024) {
      newErrors.photo = 'Photo must be less than 10 MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, photo: 'Only JPG, PNG, or GIF files are allowed' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, photo: 'Photo must be less than 10 MB' });
      return;
    }

    setPhotoFile(file);
    setErrors({ ...errors, photo: undefined });

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Call profile completion API
      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          bio: bio || null,
          phone: phone,
          photo_url: photoPreview || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Profile completion failed');
      }

      // Profile completed successfully
      onProfileCompleted();
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Prevent closing by clicking backdrop during profile completion
    // User must complete profile to continue
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent closing with Escape key during profile completion
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="modal-container modal-wide">
        <div className="modal-header">
          <h2 id="profile-modal-title" className="modal-title">Create Your Account</h2>
          <p className="modal-subtitle">{getSubtitle()}</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="error-message general" role="alert" aria-live="polite">
              {errors.general}
            </div>
          )}

          <div className="form-section photo-section">
            <div className="photo-upload">
              <label htmlFor="photo-input" className="photo-label">
                <div className="photo-circle">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile preview" className="photo-preview" />
                  ) : (
                    <div className="camera-icon">📷</div>
                  )}
                </div>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handlePhotoUpload}
                  className="photo-input-hidden"
                  aria-label="Upload profile photo"
                />
                <span className="photo-link">Upload an image</span>
                <span className="photo-hint">(JPG, PNG, or GIF, max 10 MB)</span>
              </label>
              {errors.photo && (
                <span className="error-message" role="alert">
                  {errors.photo}
                </span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-label">Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first-name" className="sr-only">First Name</label>
                <input
                  id="first-name"
                  type="text"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  placeholder="First Name*"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                  maxLength={50}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'first-name-error' : undefined}
                />
                {errors.firstName && (
                  <span id="first-name-error" className="error-message" role="alert">
                    {errors.firstName}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="last-name" className="sr-only">Last Name</label>
                <input
                  id="last-name"
                  type="text"
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  placeholder="Last Name*"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                  maxLength={50}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'last-name-error' : undefined}
                />
                {errors.lastName && (
                  <span id="last-name-error" className="error-message" role="alert">
                    {errors.lastName}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio" className="sr-only">Bio</label>
              <textarea
                id="bio"
                className="form-textarea"
                placeholder="Describe your ideal space"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isLoading}
                maxLength={500}
                rows={3}
                aria-label="Bio (optional)"
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-label">Contact Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-input disabled"
                  value={email}
                  disabled
                  aria-label="Email (pre-filled)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="sr-only">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="(310) 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <span id="phone-error" className="error-message" role="alert">
                    {errors.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};
