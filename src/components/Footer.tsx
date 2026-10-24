import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ShieldCheck, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { SPECIALTIES } from '@/types';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0B132B] text-[#64748B] dark:text-[#94A3B8] transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-1 space-y-4">
            <Logo />
            <p className="text-sm leading-relaxed text-[#475569] dark:text-[#94A3B8]">
              Transparent, immediate doctor appointments across certified hospitals and premier clinics.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#2563EB] dark:text-[#60A5FA] font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified medical practitioners</span>
            </div>
          </div>

          {/* Col 2: Specialties */}
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight mb-3">
              Specialties
            </h3>
            <ul className="space-y-2 text-sm">
              {SPECIALTIES.map((spec) => (
                <li key={spec}>
                  <Link
                    href={`/patient?specialty=${encodeURIComponent(spec)}`}
                    className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                  >
                    {spec}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Portal Logins */}
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight mb-3">
              Portals
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/login?role=PATIENT"
                  className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                >
                  Patient portal
                </Link>
              </li>
              <li>
                <Link
                  href="/login?role=DOCTOR"
                  className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                >
                  Doctor sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/login?role=ADMIN"
                  className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                >
                  Hospital administrator
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors"
                >
                  Register as patient
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Timings & Clinical notice */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Consultation windows
            </h3>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                <span>Morning: 09:00 to 11:30</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA]" />
                <span>Afternoon: 14:00 to 16:30</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[#64748B] dark:text-[#94A3B8] pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B]">
              For emergencies, please visit your nearest hospital emergency department or dial emergency services immediately.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#E2E8F0] dark:border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            © 2026 Ente Hospital. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Sentence case interface design</span>
            <span>All consultation fees in ₹</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
