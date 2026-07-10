'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { loginUser, getCurrentUser } from '@/lib/data/db-service';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, go straight to dashboard
    const user = getCurrentUser();
    if (user) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Email/Username harus diisi');
      return;
    }
    if (!password) {
      setError('Kata sandi harus diisi');
      return;
    }

    setLoading(true);
    
    // Simulate minor network delay
    setTimeout(() => {
      try {
        loginUser(email);
        router.push('/dashboard');
      } catch (err: any) {
        setError('Gagal masuk. Silakan coba lagi.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans overflow-hidden relative bg-pattern p-4">
      {/* Decorative Atmospheric Blur Circles */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-tertiary-fixed/30 blur-[100px] -top-24 -left-24 animate-pulse duration-[8000ms]" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-surface-container-high/30 blur-[100px] bottom-0 right-0 animate-pulse duration-[6000ms] delay-1000" />
      
      {/* Main Container */}
      <main className="w-full max-w-4xl glass-card rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 animate-in fade-in zoom-in duration-300">
        {/* Left Side: Brand Visuals */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-secondary-container/20 relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-tertiary rounded-lg flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  volunteer_activism
                </span>
              </div>
              <span className="font-headline text-lg font-bold tracking-tight text-tertiary">Posyandu Digital</span>
            </div>
            <h1 className="font-headline text-3xl font-extrabold text-on-surface leading-tight mb-4">
              Melayani dengan Sepenuh Hati.
            </h1>
            <p className="text-sm leading-relaxed text-on-surface-variant max-w-[320px]">
              Sistem manajemen kesehatan komunitas yang modern, aman, dan terpadu untuk keluarga Indonesia.
            </p>
          </div>
          
          <div className="mt-auto z-10 text-[10px] text-on-surface-variant/70 font-semibold uppercase tracking-wider">
            Posyandu 3000 &bull; Kader Portal v1.0
          </div>
          
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-tertiary-fixed rounded-full opacity-40 blur-[80px]" />
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-tertiary rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  volunteer_activism
                </span>
              </div>
              <span className="font-headline text-md font-bold text-tertiary">Posyandu Digital</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Selamat Datang</h2>
            <p className="text-sm text-on-surface-variant">Silakan masuk untuk melanjutkan ke dashboard manajemen.</p>
          </div>

          {error && (
            <div className="mb-6 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username/Email Input */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email / Username</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <Input
                  id="email"
                  type="text"
                  placeholder="Masukkan email atau username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Kata Sandi</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline-variant hover:text-outline transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Ke Dashboard</span>
                  <span className="material-symbols-outlined text-sm">login</span>
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
      
      {/* Mini CSS pattern styles */}
      <style jsx global>{`
        .bg-pattern {
          background-color: #FFFDFE;
          background-image: radial-gradient(#f4dce4 0.8px, transparent 0.8px);
          background-size: 24px 24px;
        }
      `}</style>
    </div>
  );
}
