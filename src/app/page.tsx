'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BookingModal } from '@/components/BookingModal';
import { formatCurrencyINR } from '@/lib/utils';
import { Doctor, SPECIALTIES } from '@/types';
import {
  HeartPulse,
  Sparkles,
  Baby,
  Bone,
  Stethoscope,
  Hospital,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Star,
} from 'lucide-react';

type HomeHeroDoctor = {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  fee: number;
  yearsExperience: number;
  slots: Array<{ time: string; isBooked: boolean }>;
};

type HomeFeaturedDoctor = {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  fee: number;
  yearsExperience: number;
  todayFreeSlotsCount: number;
  nextSlot: string;
};

interface HomeData {
  today: string;
  specialtyTiles: Array<{ specialty: string; count: number }>;
  heroDoctor: HomeHeroDoctor | null;
  featuredDoctors: HomeFeaturedDoctor[];
}

function HomePageContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking modal state
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [initialBookingSlot, setInitialBookingSlot] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/public/home-data');
        if (res.ok) {
          const json = (await res.json()) as HomeData;
          setData(json);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toBookingDoctor = (doctor: HomeHeroDoctor | HomeFeaturedDoctor): Doctor => ({
    id: doctor.id,
    userId: '',
    name: doctor.name,
    specialty: doctor.specialty,
    hospital: doctor.hospital,
    fee: doctor.fee,
    yearsExperience: doctor.yearsExperience,
    active: true,
  });

  const getSpecialtyIcon = (spec: string) => {
    switch (spec) {
      case 'Cardiology':
        return <HeartPulse className="w-6 h-6 text-[#2563EB] dark:text-[#60A5FA]" />;
      case 'Dermatology':
        return <Sparkles className="w-6 h-6 text-[#2563EB] dark:text-[#60A5FA]" />;
      case 'Pediatrics':
        return <Baby className="w-6 h-6 text-[#2563EB] dark:text-[#60A5FA]" />;
      case 'Orthopedics':
        return <Bone className="w-6 h-6 text-[#2563EB] dark:text-[#60A5FA]" />;
      default:
        return <Stethoscope className="w-6 h-6 text-[#2563EB] dark:text-[#60A5FA]" />;
    }
  };

  const handleBookDoctorClick = (doc: HomeFeaturedDoctor) => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/patient&role=PATIENT`);
      return;
    }
    setSelectedDoctorForBooking(toBookingDoctor(doc));
    setInitialBookingSlot('');
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-[#F8FAFC] font-sans transition-colors">
      <Navbar />

      <main className="flex-1">
        {loading && !data ? (
          <section className="px-4 py-12">
            <div className="max-w-4xl mx-auto rounded-2xl border border-[#E2E8F0] bg-white p-6 text-[#475569] dark:border-[#1E293B] dark:bg-[#132338] dark:text-[#94A3B8]">
              Loading specialists and appointment slots...
            </div>
          </section>
        ) : null}

        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-8 pb-14 md:pt-16 md:pb-20 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-gradient-to-b from-[#EFF6FF]/60 via-[#F8FAFC] to-[#F8FAFC] dark:from-[#0F1E36]/40 dark:to-[#0B132B]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#BFDBFE] dark:border-[#3B82F6]/30 text-[#2563EB] dark:text-[#60A5FA] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
              <span>24/7 Multi-Specialty Care • Instant Doctor Appointments</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-[#0F172A] dark:text-[#F8FAFC]">
              Book a doctor in <span className="text-[#2563EB] dark:text-[#60A5FA]">under a minute.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#475569] dark:text-[#94A3B8] max-w-2xl leading-relaxed">
              Direct appointment booking with verified hospital specialists. Real-time slot availability, instant confirmation, and completely digital records.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/patient"
                className="w-full sm:w-auto text-center px-6 py-3.5 text-base font-semibold rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white transition-all shadow-sm active:scale-[0.98] inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
              >
                <span>Find a specialist</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto text-center px-5 py-3.5 text-base font-medium rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#132338] hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-[#F8FAFC] transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
              >
                How it works
              </a>
            </div>

            {/* Trust stats pill bar */}
            <div className="pt-6 border-t border-[#E2E8F0] dark:border-[#1E293B] grid grid-cols-3 sm:grid-cols-4 gap-4 text-left max-w-2xl">
              <div>
                <div className="text-2xl font-black text-[#0F172A] dark:text-[#F8FAFC]">5+</div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">Clinical specialties</div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#2563EB] dark:text-[#60A5FA]">100%</div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">Verified credentials</div>
              </div>
              <div>
                <div className="text-2xl font-black text-[#0F172A] dark:text-[#F8FAFC]">30 min</div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">Dedicated slot time</div>
              </div>
              <div className="hidden sm:block">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">24/7</div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">Emergency Care</div>
              </div>
            </div>
          </div>
        </section>

        {/* BROWSE BY SPECIALTY */}
        <section id="specialties" className="py-14 md:py-20 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Browse by clinical specialty
              </h2>
              <p className="mt-1 text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8]">
                Find board-certified physicians with verified credentials and live schedule openings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {SPECIALTIES.map((spec) => {
                const count =
                  data?.specialtyTiles.find((t) => t.specialty === spec)?.count ?? 0;
                return (
                  <Link
                    key={spec}
                    href={`/patient?specialty=${encodeURIComponent(spec)}`}
                    className="p-5 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] hover:border-[#2563EB] dark:hover:border-[#3B82F6] hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#BFDBFE] dark:border-[#3B82F6]/30 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                        {getSpecialtyIcon(spec)}
                      </div>
                      <h3 className="font-bold text-base text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                        {spec}
                      </h3>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#1E293B] text-xs font-medium text-[#64748B] dark:text-[#94A3B8] flex items-center justify-between">
                      <span>{count} {count === 1 ? 'doctor' : 'doctors'} live</span>
                      <ChevronRight className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-14 md:py-20 bg-white dark:bg-[#132338] border-b border-[#E2E8F0] dark:border-[#1E293B] transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                How Ente Hospital works
              </h2>
              <p className="mt-1 text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8]">
                Three fast steps to consult with trusted healthcare specialists.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B132B]">
                <div className="w-10 h-10 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                  1
                </div>
                <h3 className="text-lg font-bold mb-2">Pick your doctor</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Filter by specialty, affiliated hospital, consultation fee, and clinical experience.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B132B]">
                <div className="w-10 h-10 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                  2
                </div>
                <h3 className="text-lg font-bold mb-2">Select a live slot</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Choose an available 30-minute window across the next 7 days. Double bookings are prevented at the database level.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#0B132B]">
                <div className="w-10 h-10 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                  3
                </div>
                <h3 className="text-lg font-bold mb-2">Get verified confirmation</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  Your appointment is instantly queued, and you receive real-time status updates directly in your patient portal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DOCTORS YOU CAN BOOK TODAY */}
        <section id="doctors" className="py-14 md:py-20 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Doctors available today
                </h2>
                <p className="mt-1 text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8]">
                  Verified physicians with immediate consultation openings available for booking.
                </p>
              </div>
              <Link
                href="/patient"
                className="text-sm font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline inline-flex items-center gap-1 shrink-0"
              >
                <span>View all doctors</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data?.featuredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm flex flex-col justify-between hover:border-[#2563EB]/50 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#BFDBFE] dark:border-[#3B82F6]/30 text-[#2563EB] dark:text-[#60A5FA] font-bold text-base flex items-center justify-center">
                        {doc.name
                          .replace('Dr. ', '')
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] font-semibold border border-[#BFDBFE] dark:border-[#3B82F6]/30">
                        {doc.specialty}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-[#0F172A] dark:text-[#F8FAFC]">
                        {doc.name}
                      </h3>
                      <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-0.5">
                        ✓ MD
                      </span>
                    </div>

                    <div className="text-xs text-[#64748B] dark:text-[#94A3B8] space-y-1.5 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Hospital className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>{doc.hospital}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{doc.yearsExperience} yrs experience</span>
                        <span className="text-[#D97706] font-medium flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                          4.8
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#1E293B]">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="text-[#64748B] dark:text-[#94A3B8]">Consultation fee</span>
                      <span className="font-extrabold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                        {formatCurrencyINR(doc.fee)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBookDoctorClick(doc)}
                      className="w-full py-2.5 text-sm font-semibold rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB] focus-visible:outline-none shadow-sm active:scale-[0.98]"
                    >
                      Book appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLINIC CALLOUT: RUN A CLINIC ON ENTE HOSPITAL */}
        <section className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] border-b border-[#1E293B] text-white py-14 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2563EB]/30 border border-[#60A5FA]/30 text-xs font-semibold text-[#93C5FD]">
                  <Hospital className="w-3.5 h-3.5" />
                  <span>Healthcare Providers & Hospital Networks</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Run your clinical practice on Ente Hospital
                </h2>
                <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
                  Join licensed physicians and clinic directors managing patient schedules, digital appointments, and queue workflows effortlessly.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                <Link
                  href="/signup?role=DOCTOR"
                  className="px-5 py-2.5 text-sm font-semibold rounded-[10px] bg-white hover:bg-slate-100 text-[#0F172A] transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shadow-sm flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Stethoscope className="w-4 h-4 text-[#2563EB]" />
                  <span>Join as a Doctor</span>
                </Link>
                <Link
                  href="/login?role=DOCTOR"
                  className="px-5 py-2.5 text-sm font-semibold rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none shadow-sm active:scale-[0.98]"
                >
                  Doctor sign in
                </Link>
                <Link
                  href="/login?role=ADMIN"
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-[10px] border border-white/20 bg-white/10 hover:bg-white/15 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  Admin sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Booking Dialog Modal / Mobile Bottom Sheet */}
      <BookingModal
        doctor={selectedDoctorForBooking}
        isOpen={bookingModalOpen}
        initialTime={initialBookingSlot}
        onClose={() => setBookingModalOpen(false)}
        onSuccess={() => {
          router.push('/patient?tab=appointments');
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B]" />}>
      <HomePageContent />
    </Suspense>
  );
}
