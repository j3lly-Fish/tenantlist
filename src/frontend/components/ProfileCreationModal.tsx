import React, { useState } from 'react';
import './AuthModals.css';

interface ProfileCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  role: string;
  onProfileCreated: (profile: any) => void;
}

export const ProfileCreationModal: React.FC<ProfileCreationModalProps> = ({
  isOpen,
  onClose,
  email,
  role,
  onProfileCreated
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

  const validatePhone = (phoneNumber: string): boolean => {
    // E.164 format validation (e.g., +12345678901)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
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
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number in E.164 format (e.g., +12345678901)';
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
      // Mock profile creation - would call API in production
      const profile = {
        firstName,
        lastName,
        bio,
        phone,
        email,
        role,
        photoUrl: photoPreview || null
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      onProfileCreated(profile);
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
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
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>

        <div className="modal-header">
          <h2 id="profile-modal-title" className="modal-title">Create Your Account</h2>
          <p className="modal-subtitle">Describe your space needs and receive bids from property owners</p>
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
                  placeholder="John"
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
                  placeholder="Doe"
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
                  placeholder="+12345678901"
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
