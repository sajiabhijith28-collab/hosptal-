'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HospitalClock } from '@/components/HospitalClock';
import { Menu, X, LogOut, User, Shield, Stethoscope, ArrowRight } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = session?.user as any;
  const role = user?.role;

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#131E32]/95 backdrop-blur-md transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <Logo />

        {/* Center: Navigation Links for Public Home or Roles */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          {!role ? (
            <>
              <a
                href="/#specialties"
                className="hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-md px-1"
              >
                Specialties
              </a>
              <a
                href="/#how-it-works"
                className="hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-md px-1"
              >
                How it works
              </a>
              <a
                href="/#doctors"
                className="hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-md px-1"
              >
                Doctors
              </a>
              <Link
                href="/login?role=DOCTOR"
                className="hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-md px-1 inline-flex items-center gap-1.5 font-medium"
              >
                <Stethoscope className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Doctor portal</span>
              </Link>
            </>
          ) : role === 'PATIENT' ? (
            <>
              <Link
                href="/patient"
                className={`hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors ${
                  pathname === '/patient' ? 'text-[#2563EB] dark:text-[#3B82F6] font-semibold' : ''
                }`}
              >
                Find a doctor
              </Link>
              <Link
                href="/patient?tab=appointments"
                className="hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
              >
                My appointments
              </Link>
            </>
          ) : role === 'DOCTOR' ? (
            <>
              <Link
                href="/doctor"
                className={`hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors ${
                  pathname === '/doctor' ? 'text-[#2563EB] dark:text-[#3B82F6] font-semibold' : ''
                }`}
              >
                Today's schedule
              </Link>
              <Link
                href="/doctor?tab=all"
                className="hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
              >
                All appointments
              </Link>
            </>
          ) : role === 'ADMIN' ? (
            <>
              <Link
                href="/admin"
                className={`hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors ${
                  pathname === '/admin' ? 'text-[#2563EB] dark:text-[#3B82F6] font-semibold' : ''
                }`}
              >
                Overview
              </Link>
              <Link
                href="/admin?tab=doctors"
                className="hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
              >
                Doctors
              </Link>
              <Link
                href="/admin?tab=appointments"
                className="hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
              >
                Appointments
              </Link>
            </>
          ) : null}
        </nav>

        {/* Right: Actions & Auth */}
        <div className="flex items-center gap-2.5">
          <HospitalClock />
          <ThemeToggle />

          {status === 'loading' ? (
            <div className="w-20 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : session?.user ? (
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                {role === 'ADMIN' ? (
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                ) : role === 'DOCTOR' ? (
                  <Stethoscope className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                )}
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[130px] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-white dark:bg-[#131E32] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                  {role}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out"
                aria-label="Sign out"
                className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/signup?role=DOCTOR"
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#2563EB] dark:text-[#60A5FA] bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Join as Doctor</span>
              </Link>
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors rounded-xl focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
              >
                Sign in
              </Link>
              <Link
                href="/patient"
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm shadow-blue-500/20 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB] focus-visible:outline-none active:scale-[0.98]"
              >
                Book a visit
              </Link>
            </div>
          )}

          {/* Mobile menu toggle for drawer */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 border border-slate-200 dark:border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131E32] px-4 py-5 space-y-3 shadow-xl animate-fade-in">
          <div className="pb-1">
            <HospitalClock className="w-full justify-center py-2" />
          </div>
          <div className="flex flex-col gap-1.5">
            {!role ? (
              <>
                <a
                  href="/#specialties"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Specialties
                </a>
                <a
                  href="/#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  How it works
                </a>
                <a
                  href="/#doctors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Doctors
                </a>
                <Link
                  href="/signup?role=DOCTOR"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-semibold text-[#2563EB] dark:text-[#3B82F6] bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center gap-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>Join as Doctor (Sign up)</span>
                </Link>
                <Link
                  href="/login?role=DOCTOR"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <span>Doctor sign in</span>
                </Link>
              </>
            ) : role === 'PATIENT' ? (
              <>
                <Link
                  href="/patient"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Find a doctor
                </Link>
                <Link
                  href="/patient?tab=appointments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  My appointments
                </Link>
              </>
            ) : role === 'DOCTOR' ? (
              <>
                <Link
                  href="/doctor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Today's schedule
                </Link>
                <Link
                  href="/doctor?tab=all"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  All appointments
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Overview
                </Link>
                <Link
                  href="/admin?tab=doctors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Doctors
                </Link>
                <Link
                  href="/admin?tab=appointments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Appointments
                </Link>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            {session?.user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Role: {role}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  Sign in
                </Link>
                <Link
                  href="/patient"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 text-sm font-semibold rounded-xl bg-[#2563EB] text-white shadow-sm"
                >
                  Book visit
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
