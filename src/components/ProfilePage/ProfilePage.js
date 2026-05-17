import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import {
  fetchProfile,
  updateProfile,
  updatePassword,
  updateAvatar,
} from '../../services/profileApi';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 3rem 1rem;
  width: 100%;
`;

const PageInner = styled.div`
  width: 100%;
  max-width: 560px;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  color: #282c34;
  margin: 0 0 2rem;
`;

const SectionCard = styled.section`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    padding: 1.5rem 1.25rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: #282c34;
  margin: 0 0 1.5rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.25rem;
`;

const FieldLabel = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: #282c34;
  margin-bottom: 0.375rem;
`;

const FieldInput = styled.input`
  padding: 0.625rem 0.875rem;
  border: 1px solid ${({ $hasError }) => ($hasError ? '#e53e3e' : '#cbd5e0')};
  border-radius: 4px;
  font-size: 1rem;
  color: #282c34;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${({ $hasError }) => ($hasError ? '#e53e3e' : '#61dafb')};
  }

  @media (max-width: 320px) {
    font-size: 0.9rem;
  }
`;

const ErrorMessage = styled.p`
  font-size: 0.8rem;
  color: #e53e3e;
  margin: 0.375rem 0 0;
`;

const SuccessBanner = styled.p`
  background-color: #c6f6d5;
  color: #276749;
  border: 1px solid #9ae6b4;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
  text-align: center;
`;

const ServerErrorBanner = styled.p`
  background-color: #fed7d7;
  color: #9b2c2c;
  border: 1px solid #feb2b2;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
  text-align: center;
`;

const SubmitButton = styled.button`
  padding: 0.625rem 1.5rem;
  background-color: #61dafb;
  color: #282c34;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #61dafb;
    outline-offset: 2px;
  }
`;

const AvatarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

const AvatarImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
  background-color: #edf2f7;
  flex-shrink: 0;
`;

const AvatarPlaceholder = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #61dafb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #282c34;
  font-weight: 700;
  flex-shrink: 0;
`;

const AvatarUploadControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FileInputLabel = styled.label`
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #edf2f7;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  color: #282c34;
  font-weight: 600;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e2e8f0;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const LoadingMessage = styled.p`
  text-align: center;
  color: #718096;
  padding: 3rem 1rem;
  font-size: 1rem;
`;

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function validateAvatarFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, GIF, or WebP images are allowed.';
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return 'Image must be smaller than 5MB.';
  }
  return null;
}

function getAvatarInitial(name, email) {
  if (name && name.trim()) return name.trim()[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

function AvatarPreview({ previewUrl, avatarUrl, name, email }) {
  const displayUrl = previewUrl || avatarUrl;
  if (displayUrl) {
    return <AvatarImage src={displayUrl} alt="Profile picture preview" />;
  }
  return (
    <AvatarPlaceholder aria-hidden="true">
      {getAvatarInitial(name, email)}
    </AvatarPlaceholder>
  );
}

function AvatarSection({ profileData, onAvatarUpdate }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [avatarError, setAvatarError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      setPreviewUrl(null);
      setSelectedFile(null);
      return;
    }

    setAvatarError('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setIsUploading(true);
    setSuccessMessage('');
    setAvatarError('');
    try {
      const result = await updateAvatar(selectedFile);
      onAvatarUpdate(result.avatarUrl || previewUrl);
      setSuccessMessage('Profile picture updated.');
    } catch {
      setAvatarError('Failed to upload picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <SectionCard aria-labelledby="avatar-section-title">
      <SectionTitle id="avatar-section-title">Profile Picture</SectionTitle>
      {successMessage && (
        <SuccessBanner role="status">{successMessage}</SuccessBanner>
      )}
      <AvatarWrapper>
        <AvatarPreview
          previewUrl={previewUrl}
          avatarUrl={profileData.avatarUrl}
          name={profileData.name}
          email={profileData.email}
        />
        <AvatarUploadControls>
          <FileInputLabel htmlFor="avatar-upload">Choose Image</FileInputLabel>
          <HiddenFileInput
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            aria-label="Upload profile picture"
          />
          {previewUrl && (
            <SubmitButton
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading…' : 'Save Picture'}
            </SubmitButton>
          )}
          {avatarError && (
            <ErrorMessage role="alert">{avatarError}</ErrorMessage>
          )}
        </AvatarUploadControls>
      </AvatarWrapper>
    </SectionCard>
  );
}

function NameField({ register, error }) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="name">Full Name</FieldLabel>
      <FieldInput
        id="name"
        type="text"
        $hasError={!!error}
        {...register('name', {
          required: 'Name is required',
          minLength: {
            value: 2,
            message: 'Name must be at least 2 characters',
          },
        })}
      />
      {error && <ErrorMessage role="alert">{error.message}</ErrorMessage>}
    </FieldGroup>
  );
}

function ProfileEmailField({ register, error }) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="profileEmail">Email</FieldLabel>
      <FieldInput
        id="profileEmail"
        type="email"
        $hasError={!!error}
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Enter a valid email address',
          },
        })}
      />
      {error && <ErrorMessage role="alert">{error.message}</ErrorMessage>}
    </FieldGroup>
  );
}

function PhoneField({ register, error }) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
      <FieldInput
        id="phone"
        type="tel"
        $hasError={!!error}
        {...register('phone', {
          pattern: {
            value: /^[+\d\s\-().]{7,20}$/,
            message: 'Enter a valid phone number',
          },
        })}
      />
      {error && <ErrorMessage role="alert">{error.message}</ErrorMessage>}
    </FieldGroup>
  );
}

function extractFirstFieldError(errors) {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? errors[firstKey] : null;
}

function extractProfileErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return 'Failed to update profile. Please try again.';
  if (data.message) return data.message;
  if (data.errors) return extractFirstFieldError(data.errors) || 'Failed to update profile. Please try again.';
  return 'Failed to update profile. Please try again.';
}

function ProfileInfoForm({ profileData, onProfileUpdate }) {
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      name: profileData.name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
    },
  });

  async function handleUpdate(data) {
    setServerError('');
    setSuccessMessage('');
    try {
      const result = await updateProfile(data);
      onProfileUpdate(result.user || data);
      setSuccessMessage('Profile updated successfully.');
    } catch (error) {
      setServerError(extractProfileErrorMessage(error));
    }
  }

  return (
    <SectionCard aria-labelledby="profile-info-title">
      <SectionTitle id="profile-info-title">Personal Information</SectionTitle>
      <form onSubmit={handleSubmit(handleUpdate)} noValidate>
        {successMessage && (
          <SuccessBanner role="status">{successMessage}</SuccessBanner>
        )}
        {serverError && (
          <ServerErrorBanner role="alert">{serverError}</ServerErrorBanner>
        )}
        <NameField register={register} error={errors.name} />
        <ProfileEmailField register={register} error={errors.email} />
        <PhoneField register={register} error={errors.phone} />
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </SubmitButton>
      </form>
    </SectionCard>
  );
}

function CurrentPasswordField({ register, error }) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
      <FieldInput
        id="currentPassword"
        type="password"
        $hasError={!!error}
        {...register('currentPassword', {
          required: 'Current password is required',
        })}
      />
      {error && <ErrorMessage role="alert">{error.message}</ErrorMessage>}
    </FieldGroup>
  );
}

function NewPasswordField({ register, error }) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
      <FieldInput
        id="newPassword"
        type="password"
        $hasError={!!error}
        {...register('newPassword', {
          required: 'New password is required',
          minLength: {
            value: 8,
            message: 'Password must be at least 8 characters',
          },
          validate: {
            hasUppercase: (value) =>
              /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
            hasNumber: (value) =>
              /[0-9]/.test(value) || 'Password must contain at least one number',
          },
        })}
      />
      {error && <ErrorMessage role="alert">{error.message}</ErrorMessage>}
    </FieldGroup>
  );
}

function ConfirmNewPasswordField({ register, error, getValues }) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="confirmNewPassword">Confirm New Password</FieldLabel>
      <FieldInput
        id="confirmNewPassword"
        type="password"
        $hasError={!!error}
        {...register('confirmNewPassword', {
          required: 'Please confirm your new password',
          validate: (value) =>
            value === getValues('newPassword') || 'Passwords do not match',
        })}
      />
      {error && <ErrorMessage role="alert">{error.message}</ErrorMessage>}
    </FieldGroup>
  );
}

function extractPasswordErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return 'Failed to update password. Please try again.';
  if (data.message) return data.message;
  if (data.errors) return extractFirstFieldError(data.errors) || 'Failed to update password. Please try again.';
  return 'Failed to update password. Please try again.';
}

function PasswordChangeForm() {
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' });

  async function handlePasswordChange({ currentPassword, newPassword }) {
    setServerError('');
    setSuccessMessage('');
    try {
      await updatePassword({ currentPassword, newPassword });
      reset();
      setSuccessMessage('Password updated successfully.');
    } catch (error) {
      setServerError(extractPasswordErrorMessage(error));
    }
  }

  return (
    <SectionCard aria-labelledby="password-section-title">
      <SectionTitle id="password-section-title">Change Password</SectionTitle>
      <form onSubmit={handleSubmit(handlePasswordChange)} noValidate>
        {successMessage && (
          <SuccessBanner role="status">{successMessage}</SuccessBanner>
        )}
        {serverError && (
          <ServerErrorBanner role="alert">{serverError}</ServerErrorBanner>
        )}
        <CurrentPasswordField register={register} error={errors.currentPassword} />
        <NewPasswordField register={register} error={errors.newPassword} />
        <ConfirmNewPasswordField
          register={register}
          error={errors.confirmNewPassword}
          getValues={getValues}
        />
        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating…' : 'Update Password'}
        </SubmitButton>
      </form>
    </SectionCard>
  );
}

function isUnauthenticatedError(error) {
  return error?.response?.status === 401;
}

function redirectToLogin() {
  window.location.assign('/login?redirect=/profile');
}

function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchProfile()
      .then((data) => setProfileData(data.user || data))
      .catch((error) => {
        if (isUnauthenticatedError(error)) {
          redirectToLogin();
        } else {
          setLoadError('Failed to load profile. Please refresh the page.');
        }
      });
  }, []);

  function handleAvatarUpdate(newAvatarUrl) {
    setProfileData((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
  }

  function handleProfileUpdate(updatedFields) {
    setProfileData((prev) => ({ ...prev, ...updatedFields }));
  }

  if (loadError) {
    return (
      <PageWrapper>
        <ServerErrorBanner role="alert">{loadError}</ServerErrorBanner>
      </PageWrapper>
    );
  }

  if (!profileData) {
    return (
      <LoadingMessage aria-live="polite">Loading profile…</LoadingMessage>
    );
  }

  return (
    <PageWrapper>
      <PageInner>
        <PageTitle>My Profile</PageTitle>
        <AvatarSection
          profileData={profileData}
          onAvatarUpdate={handleAvatarUpdate}
        />
        <ProfileInfoForm
          profileData={profileData}
          onProfileUpdate={handleProfileUpdate}
        />
        <PasswordChangeForm />
      </PageInner>
    </PageWrapper>
  );
}

export default ProfilePage;
