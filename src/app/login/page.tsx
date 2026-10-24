'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SlotChip } from '@/components/SlotChip';
import { Role } from '@/types';
import {
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Stethoscope,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialRole = (searchParams.get('role')?.toUpperCase() as Role) || 'PATIENT';
  const callbackUrl = searchParams.get('callbackUrl') || '';

  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveTime, setLiveTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        role,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage('Invalid email or password. Please check your credentials and try again.');
      } else {
        // Successful login: determine true role from session
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const actualRole = sessionData?.user?.role || role;

        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (actualRole === 'DOCTOR') {
          router.push('/doctor');
        } else if (actualRole === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/patient');
        }
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage('An unexpected error occurred during sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* Left Panel: Blue & Navy Medical Brand Panel */}
      <div className="w-full md:w-5/12 lg:w-1/2 bg-gradient-to-br from-[#0B132B] via-[#0F1E36] to-[#1E3A8A] border-b md:border-b-0 md:border-r border-[#1E293B] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#2563EB]/20 blur-3xl pointer-events-none" />

        <div className="space-y-8 relative z-10">
          <div className="flex items-center justify-between">
            <Logo />
            <ThemeToggle />
          </div>

          <div className="space-y-4 pt-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Certified clinical booking network</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Healthcare appointments, simplified.
            </h1>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-md leading-relaxed">
              Real-time slot availability, instant doctor confirmation, and transparent consultation fees.
            </p>
          </div>

          {/* Time-slot chips showcase */}
          <div className="p-5 rounded-2xl bg-[#0B132B]/60 backdrop-blur border border-white/10 space-y-3 max-w-md">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4 text-[#38BDF8]" />
                <span>Live slot reservation</span>
              </div>
              {liveTime && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0284C7]/20 border border-[#38BDF8]/40 text-[#38BDF8] font-mono text-[11px] font-semibold lowercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping" />
                  <span>{liveTime} IST</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <SlotChip time="09:00" size="sm" isSelected={false} />
              <SlotChip time="09:30" size="sm" isBooked={true} />
              <SlotChip time="10:00" size="sm" isSelected={true} />
              <SlotChip time="10:30" size="sm" isSelected={false} />
            </div>
            <p className="text-[11px] text-[#94A3B8] pt-1">
              Booked slots are instantly locked and struck through to prevent duplicate visits.
            </p>
          </div>
        </div>

        {/* Security guarantee footer */}
        <div className="mt-8 pt-6 border-t border-white/10 relative z-10 flex items-center gap-3 text-xs text-[#94A3B8]">
          <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0" />
          <span>Protected by hospital-grade 256-bit encryption & medical data compliance.</span>
        </div>
      </div>

      {/* Right Panel: Clean White Form Card */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white dark:bg-[#132338] rounded-2xl border border-[#CBD5E1] dark:border-[#1E293B] p-6 sm:p-8 shadow-sm transition-colors">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">Sign in to Ente Hospital</h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
              Select your role to access your personalized portal.
            </p>
          </div>

          {/* Role Switcher Pills */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F1F5F9] dark:bg-[#0B132B] border border-[#CBD5E1] dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => {
                  setRole('PATIENT');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-[10px] transition-all flex items-center justify-center gap-1.5 ${
                  role === 'PATIENT'
                    ? 'bg-white dark:bg-[#132338] text-[#2563EB] dark:text-[#60A5FA] shadow-sm border border-[#E2E8F0] dark:border-[#334155]'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('DOCTOR');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-[10px] transition-all flex items-center justify-center gap-1.5 ${
                  role === 'DOCTOR'
                    ? 'bg-white dark:bg-[#132338] text-[#2563EB] dark:text-[#60A5FA] shadow-sm border border-[#E2E8F0] dark:border-[#334155]'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('ADMIN');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-[10px] transition-all flex items-center justify-center gap-1.5 ${
                  role === 'ADMIN'
                    ? 'bg-white dark:bg-[#132338] text-[#2563EB] dark:text-[#60A5FA] shadow-sm border border-[#E2E8F0] dark:border-[#334155]'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-[10px] bg-[#FEF2F2] dark:bg-[#331413] border border-[#F87171]/40 text-[#DC2626] dark:text-[#F87171] text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    role === 'ADMIN'
                      ? 'abhijithsaji or admin@sajipalackal.in'
                      : role === 'DOCTOR'
                      ? 'doctor@entehospital.demo'
                      : 'patient@example.com'
                  }
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none transition-colors"
                />
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none transition-colors"
                />
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-3 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-semibold rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB] focus-visible:outline-none mt-2"
            >
              {loading ? 'Verifying...' : `Sign in as ${role === 'ADMIN' ? 'Admin' : role === 'DOCTOR' ? 'Doctor' : 'Patient'}`}
            </button>
          </form>

          {/* Links & Notice */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0] dark:border-[#1E293B] space-y-3 text-center text-xs">
            {role === 'PATIENT' ? (
              <p className="text-[#64748B] dark:text-[#94A3B8]">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                >
                  Sign up as patient
                </Link>
              </p>
            ) : role === 'DOCTOR' ? (
              <p className="text-[#64748B] dark:text-[#94A3B8]">
                New physician or clinic?{' '}
                <Link
                  href="/signup?role=DOCTOR"
                  className="font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline inline-flex items-center gap-1"
                >
                  <span>Sign up as Doctor</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            ) : (
              <p className="text-[#64748B] dark:text-[#94A3B8]">
                Master Admin access is restricted to verified clinic operators.
              </p>
            )}

            <div className="pt-2">
              <Link
                href="/"
                className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] transition-colors"
              >
                ← Back to Ente Hospital home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] animate-pulse" />}>
      <LoginFormContent />
    </Suspense>
  );
}
