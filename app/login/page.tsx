"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { loginUser, getCurrentUser } from "@/lib/fetch/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isInstalled = localStorage.getItem("posyandu_installed") === "true";
    if (!isInstalled) {
      router.replace("/install");
      return;
    }

    // Jika sudah ada sesi login aktif, langsung ke dashboard
    let isMounted = true;

    getCurrentUser().then((user) => {
      if (user && isMounted) {
        router.replace("/dashboard");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email/Username harus diisi");
      return;
    }
    if (!password) {
      setError("Kata sandi harus diisi");
      return;
    }

    setLoading(true);

    try {
      await loginUser(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans overflow-hidden relative bg-pattern p-4">
      {/* Decorative Atmospheric Blur Circles */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-tertiary-fixed/30 blur-[100px] -top-24 -left-24 animate-pulse duration-[8000ms]" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-surface-container-high/30 blur-[100px] bottom-0 right-0 animate-pulse duration-[6000ms] delay-1000" />

      {/* SVG Distorted Mesh Ribbon Background */}
      <div className="absolute inset-0 pointer-events-none opacity-85 z-0 overflow-hidden flex items-center justify-center">
        <svg
          className="w-full h-[85%] min-h-[550px]"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 600"
        >
          <defs>
            <linearGradient id="ribbon-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ab2c5d" stopOpacity="0.05" />
              <stop offset="25%" stopColor="#ab2c5d" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#6b5a60" stopOpacity="0.5" />
              <stop offset="75%" stopColor="#ab2c5d" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f4dce4" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <g stroke="url(#ribbon-grad)" strokeWidth="2.4" fill="none">
            {Array.from({ length: 15 }).map((_, i) => {
              const offset = i * 10;
              const delay = i * -0.3;
              const opacity = 0.25 + (i % 4) * 0.2;
              return (
                <path
                  key={i}
                  d={`M -50,${250 + offset} 
                      C 250,${50 + i * 6} 550,${450 - i * 10} 800,${250 + i * 4} 
                      C 1050,${50 + i * 10} 1250,${450 - i * 6} 1490,${200 + offset}`}
                  strokeOpacity={opacity}
                  className="animate-ribbon-wave"
                  style={{
                    animationDelay: `${delay}s`,
                    animationDuration: `${12 + (i % 3) * 3}s`,
                  }}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-4xl glass-card rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 animate-in fade-in zoom-in duration-300 relative z-10">
        {/* Left Side: Brand Visuals */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-secondary-container/20 relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-tertiary rounded-lg flex items-center justify-center shadow-sm">
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  volunteer_activism
                </span>
              </div>
              <span className="font-headline text-lg font-bold tracking-tight text-tertiary">
                Posyandu Digital
              </span>
            </div>
            <h1 className="font-headline text-3xl font-extrabold text-on-surface leading-tight mb-4">
              Melayani dengan Sepenuh Hati.
            </h1>
            <p className="text-sm leading-relaxed text-on-surface-variant max-w-[320px]">
              Sistem manajemen kesehatan komunitas yang modern, aman, dan
              terpadu untuk keluarga Indonesia.
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
                <span
                  className="material-symbols-outlined text-white text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  volunteer_activism
                </span>
              </div>
              <span className="font-headline text-md font-bold text-tertiary">
                Posyandu Digital
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
              Selamat Datang
            </h2>
            <p className="text-sm text-on-surface-variant">
              Silakan masuk untuk melanjutkan ke dashboard manajemen.
            </p>
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
                  <span className="material-symbols-outlined text-[20px]">
                    person
                  </span>
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
                  <span className="material-symbols-outlined text-[20px]">
                    lock
                  </span>
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
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
                    {showPassword ? "visibility_off" : "visibility"}
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
                  <span className="material-symbols-outlined text-sm">
                    login
                  </span>
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
      {/* Direct inline style injection to bypass bundler CSS caching */}
      <style>{`
        .animate-ribbon-wave {
          animation: ribbon-flow-new 15s infinite linear;
          stroke-dasharray: 4 16;
          stroke-linecap: round;
        }

        @keyframes ribbon-flow-new {
          0% {
            stroke-dashoffset: 0;
            transform: translateY(0) skewY(-0.5deg);
          }
          50% {
            transform: translateY(-8px) skewY(0.5deg);
          }
          100% {
            stroke-dashoffset: -200;
            transform: translateY(0) skewY(-0.5deg);
          }
        }
      `}</style>
    </div>
  );
}
