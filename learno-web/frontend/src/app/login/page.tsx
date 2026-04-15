'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { ApiError } from '@/lib/api';
import { useStoredAuth } from '@/hooks/useStoredAuth';
import { roleHomePath } from '@/lib/auth/roles';

type AuthMode = 'signin' | 'guardian-register';

export default function LoginPage() {
  const router = useRouter();
  const { user: storedUser } = useStoredAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (mode === 'guardian-register') {
      if (fullName.trim().length < 2) {
        setError('Full name must be at least 2 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response =
        mode === 'signin'
          ? await authApi.login({
              email: email.trim(),
              password,
            })
          : await authApi.register({
              fullName: fullName.trim(),
              email: email.trim(),
              password,
            });

      router.replace(roleHomePath(response.user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          mode === 'signin'
            ? 'Unable to sign in right now. Please try again.'
            : 'Unable to register right now. Please try again.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              mode === 'signin'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('guardian-register')}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              mode === 'guardian-register'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Register Guardian
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            {mode === 'signin' ? 'Learno Sign In' : 'Create Guardian Account'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'signin'
              ? 'Use your backend credentials. Your dashboard is selected automatically.'
              : 'Register as guardian to create your account and access the guardian dashboard.'}
          </p>
          {storedUser && mode === 'signin' ? (
            <button
              type="button"
              className="mt-3 text-xs text-sky-600 hover:text-sky-700"
              onClick={() => router.replace(roleHomePath(storedUser.role))}
            >
              Continue as {storedUser.fullName} ({storedUser.role})
            </button>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'guardian-register' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Guardian full name"
                required
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="teacher@school.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
              placeholder="********"
              required
            />
          </div>

          {mode === 'guardian-register' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="********"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Password must include 8+ chars, one uppercase letter, one number, and one special character.
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? mode === 'signin'
                ? 'Signing In...'
                : 'Creating Account...'
              : mode === 'signin'
                ? 'Sign In'
                : 'Create Guardian Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
