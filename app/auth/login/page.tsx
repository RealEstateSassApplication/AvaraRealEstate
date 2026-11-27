'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Successful login; redirect based on role if provided
        const fallback = '/workspace';
        const requested = new URLSearchParams(window.location.search).get('next');
        let target = fallback;
        if (requested?.startsWith('/') && !requested.startsWith('//')) {
          try {
            const parsed = new URL(requested, window.location.origin);
            if (parsed.origin === window.location.origin && !parsed.pathname.startsWith('/auth/')) target = parsed.pathname + parsed.search + parsed.hash;
          } catch { /* fall back to the account dashboard */ }
        }
        router.push(target);
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="avara-editorial min-h-screen grid lg:grid-cols-2">
      {/* Left: Decorative Image */}
      <div className="hidden lg:block relative bg-gray-900">
        <div
          className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3288102/pexels-photo-3288102.jpeg')] bg-cover bg-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-12 text-white">
          <div className="flex items-center space-x-2 mb-8">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Avara</span>
          </div>
          <h2 className="avara-display text-5xl mb-4 max-w-md leading-tight">
            Find the perfect place to call home.
          </h2>
          <p className="text-gray-300 max-w-sm mb-8 text-lg">
            Discover homes, save your shortlist and plan your next move in Sri Lanka.
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex items-center justify-center p-5 sm:p-8 bg-[#f8faf6]">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <Link href="/" className="avara-display mb-6 inline-block text-4xl text-[#243b31]">avara<span className="text-[#a68650]">.</span></Link>
            <h1 className="avara-display text-4xl text-[#243b31]">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-[#416746] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={showPassword?"Hide password":"Show password"} className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 avara-primary font-medium"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-gray-500">Don&apos;t have an account? </span>
            <Link href="/auth/register" className="font-semibold text-teal-600 hover:text-teal-500">
              Create an account
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By clicking continue, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}