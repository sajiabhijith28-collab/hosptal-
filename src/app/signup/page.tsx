'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/components/Toast';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Hospital,
  Clock,
  IndianRupee,
} from 'lucide-react';

function SignUpFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const initialRole = searchParams.get('role')?.toUpperCase() === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>(initialRole);
  const [specialty, setSpecialty] = useState('General Physician');
  const [hospital, setHospital] = useState('Ente Hospital');
  const [yearsExperience, setYearsExperience] = useState(8);
  const [fee, setFee] = useState(800);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          specialty,
          hospital: hospital.trim() || 'Ente Hospital',
          yearsExperience: Number(yearsExperience) || 5,
          fee: Number(fee) || 800,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register account.');
      }

      showToast(
        role === 'DOCTOR'
          ? 'Doctor account created successfully! Signing you in...'
          : 'Account created successfully! Signing you in...',
        'success'
      );

      // Automatically sign in
      const signinRes = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        role,
        redirect: false,
      });

      if (!signinRes?.error) {
        if (role === 'DOCTOR') {
          router.push('/doctor');
        } else {
          router.push('/patient');
        }
        router.refresh();
      } else {
        router.push(role === 'DOCTOR' ? '/login?role=DOCTOR' : '/login?role=PATIENT');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* Left Brand Panel */}
      <div className="w-full md:w-5/12 lg:w-1/2 bg-gradient-to-br from-[#0B132B] via-[#0F1E36] to-[#1E3A8A] border-b md:border-b-0 md:border-r border-[#1E293B] p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#2563EB]/20 blur-3xl pointer-events-none" />

        <div className="space-y-8 relative z-10">
          <div className="flex items-center justify-between">
            <Logo />
            <ThemeToggle />
          </div>

          {role === 'DOCTOR' ? (
            <div className="space-y-4 pt-4 animate-fade-in">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2563EB]/30 border border-[#60A5FA]/30 text-xs font-semibold text-blue-200">
                <Stethoscope className="w-3.5 h-3.5 text-blue-300" />
                <span>Physician & Clinic Registration</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Grow your clinical practice.
              </h1>
              <p className="text-sm sm:text-base text-[#94A3B8] max-w-md leading-relaxed">
                Connect with verified patients, automate your consultation schedule, and receive 100% direct patient fee payments to your UPI account.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-4 animate-fade-in">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-200 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant patient account activation</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Join Ente Hospital as a patient.
              </h1>
              <p className="text-sm sm:text-base text-[#94A3B8] max-w-md leading-relaxed">
                Create an account to book consultations, manage your schedule, and receive clinical visit updates.
              </p>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-[#0B132B]/60 backdrop-blur border border-white/10 space-y-3 max-w-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#60A5FA]">
              <ShieldCheck className="w-4 h-4" />
              <span>{role === 'DOCTOR' ? 'Doctor privileges' : 'Patient privileges'}</span>
            </div>

            {role === 'DOCTOR' ? (
              <ul className="text-xs space-y-2 text-[#94A3B8] animate-fade-in">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Real-time schedule with automatic double-booking prevention</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Direct UPI patient fee deposits with zero commission cuts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Dedicated physician dashboard for queue and status tracking</span>
                </li>
              </ul>
            ) : (
              <ul className="text-xs space-y-2 text-[#94A3B8] animate-fade-in">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Instant booking across leading clinical specialties</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Free cancellation for pending and confirmed visits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Transparent consultation fees with zero booking markups</span>
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-xs text-[#94A3B8] relative z-10 flex items-center justify-between">
          <span>Protected by hospital-grade 256-bit encryption.</span>
          <Link
            href={role === 'DOCTOR' ? '/login?role=DOCTOR' : '/login?role=PATIENT'}
            className="text-blue-300 hover:underline font-medium"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>

      {/* Right Form Card */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white dark:bg-[#132338] rounded-2xl border border-[#CBD5E1] dark:border-[#1E293B] p-6 sm:p-8 shadow-sm transition-colors">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              {role === 'DOCTOR' ? 'Doctor registration' : 'Create your account'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
              {role === 'DOCTOR'
                ? 'Join Ente Hospital to manage your clinic schedule and appointments.'
                : 'Sign up to schedule visits with certified doctors.'}
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-5">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F1F5F9] dark:bg-[#0B132B] border border-[#CBD5E1] dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => setRole('PATIENT')}
                className={`py-2 text-xs font-semibold rounded-[10px] transition-all flex items-center justify-center gap-1.5 ${
                  role === 'PATIENT'
                    ? 'bg-white dark:bg-[#132338] text-[#2563EB] dark:text-[#60A5FA] shadow-xs border border-[#E2E8F0] dark:border-[#334155]'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('DOCTOR')}
                className={`py-2 text-xs font-semibold rounded-[10px] transition-all flex items-center justify-center gap-1.5 ${
                  role === 'DOCTOR'
                    ? 'bg-white dark:bg-[#132338] text-[#2563EB] dark:text-[#60A5FA] shadow-xs border border-[#E2E8F0] dark:border-[#334155]'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-[10px] bg-[#FEF2F2] dark:bg-[#331413] border border-[#F87171]/40 text-[#DC2626] dark:text-[#F87171] text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullname" className="block text-xs sm:text-sm font-semibold mb-1.5">
                {role === 'DOCTOR' ? 'Doctor full name' : 'Full name'}
              </label>
              <div className="relative">
                <input
                  id="fullname"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'DOCTOR' ? 'e.g. Dr. Rajesh Kulkarni' : 'e.g. Aarav Mehta'}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none transition-colors"
                />
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Doctor Specific Profile Fields */}
            {role === 'DOCTOR' && (
              <div className="space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="specialty" className="block text-xs font-semibold mb-1.5">
                      Specialty
                    </label>
                    <select
                      id="specialty"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-xs text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                    >
                      <option value="General Physician">General Physician</option>
                      <option value="Cardiologist">Cardiologist</option>
                      <option value="Dermatologist">Dermatologist</option>
                      <option value="Pediatrician">Pediatrician</option>
                      <option value="Orthopedic">Orthopedic</option>
                      <option value="Neurologist">Neurologist</option>
                      <option value="Gynecologist">Gynecologist</option>
                      <option value="ENT Specialist">ENT Specialist</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="fee" className="block text-xs font-semibold mb-1.5 flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 text-[#2563EB]" />
                      <span>Consultation Fee</span>
                    </label>
                    <input
                      id="fee"
                      type="number"
                      min="100"
                      step="50"
                      value={fee}
                      onChange={(e) => setFee(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-xs text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="hospital" className="block text-xs font-semibold mb-1.5 flex items-center gap-1">
                      <Hospital className="w-3 h-3 text-[#2563EB]" />
                      <span>Hospital / Clinic</span>
                    </label>
                    <input
                      id="hospital"
                      type="text"
                      required={role === 'DOCTOR'}
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="e.g. City Health Clinic"
                      className="w-full px-3 py-2.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-xs text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="yearsExp" className="block text-xs font-semibold mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#2563EB]" />
                      <span>Experience (Years)</span>
                    </label>
                    <input
                      id="yearsExp"
                      type="number"
                      min="1"
                      max="60"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-xs text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold mb-1.5">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'DOCTOR' ? 'dr.name@hospital.org' : 'name@example.com'}
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
                  placeholder="At least 6 characters"
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

            <div>
              <label htmlFor="confirm-password" className="block text-xs sm:text-sm font-semibold mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none transition-colors"
                />
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-semibold rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB] focus-visible:outline-none mt-2"
            >
              {loading
                ? 'Creating account...'
                : role === 'DOCTOR'
                ? 'Register as Doctor'
                : 'Create patient account'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E2E8F0] dark:border-[#1E293B] text-center text-xs">
            <p className="text-[#64748B] dark:text-[#94A3B8]">
              Already have an account?{' '}
              <Link
                href={role === 'DOCTOR' ? '/login?role=DOCTOR' : '/login?role=PATIENT'}
                className="font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] animate-pulse" />}>
      <SignUpFormContent />
    </Suspense>
  );
}
