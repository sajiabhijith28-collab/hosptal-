'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Home,
  Search,
  Calendar,
  User,
  Clock,
  Shield,
  Stethoscope,
  LogIn,
} from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user as any;
  const role = user?.role;

  // Don't show on login/signup pages where focus is strictly on the form
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#131E32]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2 safe-area-bottom shadow-lg shadow-slate-900/5">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {!role ? (
          <>
            <Link
              href="/"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                pathname === '/'
                  ? 'text-[#2563EB] dark:text-[#3B82F6] font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Home</span>
            </Link>

            <Link
              href="/patient"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                pathname === '/patient'
                  ? 'text-[#2563EB] dark:text-[#3B82F6] font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Search className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Doctors</span>
            </Link>

            <Link
              href="/signup?role=DOCTOR"
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#2563EB]"
            >
              <Stethoscope className="w-5 h-5 mb-1" />
              <span className="text-[11px]">For Doctors</span>
            </Link>

            <Link
              href="/login"
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900"
            >
              <LogIn className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Sign in</span>
            </Link>
          </>
        ) : role === 'PATIENT' ? (
          <>
            <Link
              href="/"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                pathname === '/'
                  ? 'text-[#2563EB] dark:text-[#3B82F6] font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Home</span>
            </Link>

            <Link
              href="/patient"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                pathname === '/patient'
                  ? 'text-[#2563EB] dark:text-[#3B82F6] font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Search className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Find</span>
            </Link>

            <Link
              href="/patient?tab=appointments"
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400"
            >
              <Calendar className="w-5 h-5 mb-1 text-[#2563EB]" />
              <span className="text-[11px] font-medium text-[#2563EB]">Visits</span>
            </Link>

            <div className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400">
              <User className="w-5 h-5 mb-1" />
              <span className="text-[11px] max-w-[50px] truncate">{user.name?.split(' ')[0]}</span>
            </div>
          </>
        ) : role === 'DOCTOR' ? (
          <>
            <Link
              href="/doctor"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                pathname === '/doctor'
                  ? 'text-[#2563EB] dark:text-[#3B82F6] font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Clock className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Today</span>
            </Link>

            <Link
              href="/doctor?tab=all"
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400"
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-[11px]">All visits</span>
            </Link>

            <div className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400">
              <Stethoscope className="w-5 h-5 mb-1 text-[#2563EB]" />
              <span className="text-[11px]">Doctor</span>
            </div>
          </>
        ) : (
          <>
            <Link
              href="/admin"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                pathname === '/admin'
                  ? 'text-[#2563EB] dark:text-[#3B82F6] font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Shield className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Overview</span>
            </Link>

            <Link
              href="/admin?tab=doctors"
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400"
            >
              <Stethoscope className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Doctors</span>
            </Link>

            <Link
              href="/admin?tab=appointments"
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400"
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span className="text-[11px]">Bookings</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
