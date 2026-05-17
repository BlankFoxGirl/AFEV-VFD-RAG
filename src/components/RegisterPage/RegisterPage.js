import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { registerUser } from '../../services/registrationApi';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 3rem 1rem;
  width: 100%;
`;

const FormCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 420px;

  @media (max-width: 480px) {
    padding: 2rem 1.25rem;
  }
`;

const FormTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  color: #282c34;
  margin: 0 0 1.75rem;
  text-align: center;
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
  width: 100%;
  padding: 0.75rem;
  background-color: #61dafb;
  color: #282c34;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }

  &:focus-visible {
    outline: 2px solid #61dafb;
    outline-offset: 2px;
  }
`;

function EmailField({ register, error }) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <FieldInput
        id="email"
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

function PasswordField({ register, error }) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="password">Password</FieldLabel>
      <FieldInput
        id="password"
        type="password"
        $hasError={!!error}
        {...register('password', {
          required: 'Password is required',
          minLength: {
            value: 8,
            message: 'Password must be at least 8 characters',
          },
        })}
      />
      {error && <ErrorMessage role="alert">{error.message}</ErrorMessage>}
    </FieldGroup>
  );
}

function ConfirmPasswordField({ register, error, getValues }) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
      <FieldInput
        id="confirmPassword"
        type="password"
        $hasError={!!error}
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (value) =>
            value === getValues('password') || 'Passwords do not match',
        })}
      />
      {error && <ErrorMessage role="alert">{error.message}</ErrorMessage>}
    </FieldGroup>
  );
}

function RegisterForm({ onSubmit, successMessage, serverError }) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {successMessage && (
        <SuccessBanner role="status">{successMessage}</SuccessBanner>
      )}
      {serverError && (
        <ServerErrorBanner role="alert">{serverError}</ServerErrorBanner>
      )}
      <EmailField register={register} error={errors.email} />
      <PasswordField register={register} error={errors.password} />
      <ConfirmPasswordField
        register={register}
        error={errors.confirmPassword}
        getValues={getValues}
      />
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registering…' : 'Register'}
      </SubmitButton>
    </form>
  );
}

function extractServerErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return 'Registration failed. Please try again.';
  if (data.errors?.email) return data.errors.email;
  return 'Registration failed. Please try again.';
}

function RegisterPage() {
  const [successMessage, setSuccessMessage] = useState('');
  const [serverError, setServerError] = useState('');

  async function handleRegistration({ email, password }) {
    setSuccessMessage('');
    setServerError('');
    try {
      await registerUser({ email, password });
      setSuccessMessage('Registration successful! You can now log in.');
    } catch (error) {
      setServerError(extractServerErrorMessage(error));
    }
  }

  return (
    <PageWrapper>
      <FormCard>
        <FormTitle>Create an Account</FormTitle>
        <RegisterForm
          onSubmit={handleRegistration}
          successMessage={successMessage}
          serverError={serverError}
        />
      </FormCard>
    </PageWrapper>
  );
}

export default RegisterPage;
