import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { loginUser } from '../../services/loginApi';

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

const NavLinks = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.25rem;
  font-size: 0.875rem;
`;

const NavLink = styled.a`
  color: #61dafb;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

function EmailField({ register, error }) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <FieldInput
        id="email"
        type="email"
        placeholder="you@example.com"
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
        placeholder="Enter your password"
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

function LoginForm({ onSubmit, serverError }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {serverError && (
        <ServerErrorBanner role="alert">{serverError}</ServerErrorBanner>
      )}
      <EmailField register={register} error={errors.email} />
      <PasswordField register={register} error={errors.password} />
      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </SubmitButton>
      <NavLinks>
        <NavLink href="/forgot-password">Forgot Password?</NavLink>
        <NavLink href="/register">Register</NavLink>
      </NavLinks>
    </form>
  );
}

function extractServerErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return 'Login failed. Please try again.';
  if (data.message) return data.message;
  return 'Invalid email or password.';
}

function getPostLoginRedirectPath() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (redirect && redirect.startsWith('/')) {
    return redirect;
  }
  return '/dashboard';
}

function LoginPage() {
  const [serverError, setServerError] = useState('');

  async function handleLogin({ email, password }) {
    setServerError('');
    try {
      await loginUser({ email, password });
      window.location.assign(getPostLoginRedirectPath());
    } catch (error) {
      setServerError(extractServerErrorMessage(error));
    }
  }

  return (
    <PageWrapper>
      <FormCard>
        <FormTitle>Sign In</FormTitle>
        <LoginForm onSubmit={handleLogin} serverError={serverError} />
      </FormCard>
    </PageWrapper>
  );
}

export default LoginPage;
