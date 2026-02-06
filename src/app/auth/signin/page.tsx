'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream-100 dark:bg-warm-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const authError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    authError === 'CredentialsSignin' ? 'Invalid email or password' : null
  );

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn('credentials', {
      email,
      password,
      name: isSignUp ? name : undefined,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError('Invalid email or password. New here? Switch to sign up.');
      setLoading(false);
    } else if (result?.url) {
      window.location.href = result.url;
    }
  };

  const handleGoogle = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-warm-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-terracotta-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-warm-900 dark:text-warm-100">Academic Translator</h1>
          <p className="text-sm text-warm-600 dark:text-warm-400 mt-1">
            {isSignUp ? 'Create your free account' : 'Sign in to save your translations'}
          </p>
        </div>

        <div className="bg-white dark:bg-warm-800 rounded-2xl border border-cream-300 dark:border-warm-700 p-6 shadow-soft space-y-5">
          {/* Google OAuth button */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-cream-300 dark:border-warm-600 rounded-xl text-sm font-medium text-warm-800 dark:text-warm-200 hover:bg-cream-50 dark:hover:bg-warm-700 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-cream-300 dark:bg-warm-700" />
            <span className="text-xs text-warm-500 dark:text-warm-500">or use email</span>
            <div className="flex-1 h-px bg-cream-300 dark:bg-warm-700" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleCredentials} className="space-y-3">
            {isSignUp && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 bg-cream-50 dark:bg-warm-700 border border-cream-300 dark:border-warm-600 rounded-xl text-sm text-warm-900 dark:text-warm-100 placeholder-warm-400 dark:placeholder-warm-500 focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full px-3.5 py-2.5 bg-cream-50 dark:bg-warm-700 border border-cream-300 dark:border-warm-600 rounded-xl text-sm text-warm-900 dark:text-warm-100 placeholder-warm-400 dark:placeholder-warm-500 focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 bg-cream-50 dark:bg-warm-700 border border-cream-300 dark:border-warm-600 rounded-xl text-sm text-warm-900 dark:text-warm-100 placeholder-warm-400 dark:placeholder-warm-500 focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500"
            />

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-terracotta-500 text-white font-medium rounded-xl hover:bg-terracotta-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Toggle sign up / sign in */}
          <p className="text-center text-xs text-warm-500 dark:text-warm-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-terracotta-500 hover:text-terracotta-600 font-medium"
            >
              {isSignUp ? 'Sign in' : 'Sign up free'}
            </button>
          </p>
        </div>

        {/* Continue without account */}
        <div className="text-center mt-4">
          <a
            href="/"
            className="text-xs text-warm-500 dark:text-warm-500 hover:text-warm-700 dark:hover:text-warm-300"
          >
            Continue without an account (5 free translations/day)
          </a>
        </div>
      </div>
    </div>
  );
}
