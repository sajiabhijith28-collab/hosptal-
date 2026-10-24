'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import { BookingModal } from '@/components/BookingModal';
import { useToast } from '@/components/Toast';
import { Doctor, Appointment, SPECIALTIES } from '@/types';
import { formatCurrencyINR, formatDateIN, formatDateLongIN, formatTime12h } from '@/lib/utils';
import {
  Search,
  Stethoscope,
  Hospital,
  Calendar,
  Clock,
  Award,
  AlertCircle,
  XCircle,
  CheckCircle2,
  CalendarDays,
  User,
  Filter,
  ArrowRight,
  RefreshCw,
  Star,
  ShieldCheck,
} from 'lucide-react';

function PatientPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const { showToast } = useToast();

  // Active Tab: 'find' or 'appointments'
  const initialTab = searchParams.get('tab') === 'appointments' ? 'appointments' : 'find';
  const initialSpecialty = searchParams.get('specialty') || 'All';

  const [activeTab, setActiveTab] = useState<'find' | 'appointments'>(initialTab);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(initialSpecialty);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(true);
  const [loadingAppointments, setLoadingAppointments] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Booking Modal
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Sync tab with URL searchParams if it changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'appointments') {
      setActiveTab('appointments');
    }
    const specParam = searchParams.get('specialty');
    if (specParam) {
      setSelectedSpecialty(specParam);
    }
  }, [searchParams]);

  // Fetch active doctors
  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      let url = '/api/doctors?';
      if (selectedSpecialty && selectedSpecialty !== 'All') {
        url += `specialty=${encodeURIComponent(selectedSpecialty)}&`;
      }
      if (searchQuery.trim()) {
        url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Hide inactive doctors
        setDoctors(data.filter((d: Doctor) => d.active));
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Fetch patient appointments
  const fetchAppointments = async () => {
    if (!session?.user) return;
    setLoadingAppointments(true);
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpecialty, searchQuery]);

  useEffect(() => {
    if (session?.user) {
      fetchAppointments();
    }
  }, [session]);

  // Cancel Appointment
  const handleCancelAppointment = async (id: string) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this appointment? The slot will be released immediately.'
    );
    if (!confirmCancel) return;

    setCancellingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel appointment.');
      }

      showToast('Appointment cancelled. The time slot is now available again.', 'info');
      // Update local appointment state
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' } : a))
      );
      // Refresh doctors/slots in case user goes back to booking
      fetchDoctors();
    } catch (err: any) {
      showToast(err.message || 'Could not cancel appointment.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenBooking = (doc: Doctor) => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/patient&role=PATIENT`);
      return;
    }
    setSelectedDoctorForBooking(doc);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-[#F8FAFC] font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header with Title and Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA] bg-[#EFF6FF] dark:bg-[#1E293B] mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Certified Clinicians</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Patient portal
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
              Find verified medical specialists, book slots, and manage upcoming visits.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] self-start sm:self-auto shadow-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab('find');
                router.replace('/patient');
              }}
              className={`px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'find'
                  ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find a doctor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!session?.user) {
                  router.push('/login?callbackUrl=/patient?tab=appointments&role=PATIENT');
                  return;
                }
                setActiveTab('appointments');
                router.replace('/patient?tab=appointments');
                fetchAppointments();
              }}
              className={`px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'appointments'
                  ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>My appointments</span>
              {appointments.filter((a) => a.status === 'PENDING' || a.status === 'CONFIRMED').length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E293B] dark:text-[#60A5FA] text-[11px] font-bold flex items-center justify-center">
                  {appointments.filter((a) => a.status === 'PENDING' || a.status === 'CONFIRMED').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: FIND A DOCTOR */}
        {activeTab === 'find' && (
          <div className="pt-6 space-y-6">
            {/* Search and Specialty Filter Bar */}
            <div className="space-y-3">
              <div className="relative max-w-xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by doctor name, specialty, or hospital..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#132338] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none shadow-sm transition-colors"
                />
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 top-3.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3.5 text-xs text-[#64748B] hover:text-[#0F172A]"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Specialty Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1 shrink-0 mr-1">
                  <Filter className="w-3.5 h-3.5 text-[#2563EB]" />
                  Specialty:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSpecialty('All')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none ${
                    selectedSpecialty === 'All'
                      ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white border-[#2563EB] dark:border-[#3B82F6] font-semibold shadow-sm'
                      : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#132338] text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#2563EB]'
                  }`}
                >
                  All specialties
                </button>
                {SPECIALTIES.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none ${
                      selectedSpecialty === spec
                        ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white border-[#2563EB] dark:border-[#3B82F6] font-semibold shadow-sm'
                        : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#132338] text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#2563EB]'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctors Grid */}
            {loadingDoctors ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] h-60 animate-pulse"
                  />
                ))}
              </div>
            ) : doctors.length === 0 ? (
              /* Empty State */
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] my-6">
                <div className="w-14 h-14 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center mx-auto mb-4 border border-[#BFDBFE]">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  No doctors match your criteria
                </h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-sm mx-auto mt-1 mb-5">
                  Try adjusting your search keyword or clearing the specialty filter to view all available medical specialists.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSpecialty('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-[10px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm flex flex-col justify-between hover:border-[#2563EB]/50 transition-all group"
                  >
                    <div>
                      {/* Avatar & Specialty */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#BFDBFE] dark:border-[#3B82F6]/30 text-[#2563EB] dark:text-[#60A5FA] font-bold text-base flex items-center justify-center shrink-0">
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
                        <h3 className="font-bold text-lg text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
                          {doc.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-[#16A34A] bg-[#DCFCE7] dark:bg-[#14532D] dark:text-[#86EFAC] px-1.5 py-0.5 rounded">
                          ✓ MD
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                        <div className="flex items-center gap-2">
                          <Hospital className="w-3.5 h-3.5 shrink-0 text-[#2563EB]" />
                          <span className="truncate">{doc.hospital}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 shrink-0 text-[#2563EB]" />
                            <span>{doc.yearsExperience} yrs experience</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#D97706] font-medium">
                            <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                            <span>4.9</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#1E293B]">
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="text-[#64748B] dark:text-[#94A3B8]">Consultation fee</span>
                        <span className="font-extrabold text-base text-[#0F172A] dark:text-[#F8FAFC]">
                          {formatCurrencyINR(doc.fee)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenBooking(doc)}
                        className="w-full py-2.5 px-4 text-sm font-semibold rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white transition-all shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB] focus-visible:outline-none flex items-center justify-center gap-2"
                      >
                        <span>Book visit</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Your scheduled visits</h2>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
                  Track the live status of your medical appointments and cancel if needed.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchAppointments}
                disabled={loadingAppointments}
                className="px-3 py-1.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#132338] text-xs font-medium hover:border-[#2563EB] flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8] shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAppointments ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingAppointments ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] h-32 animate-pulse"
                  />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B]">
                <div className="w-14 h-14 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center mx-auto mb-4 border border-[#BFDBFE]">
                  <CalendarDays className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold">No appointments found</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-sm mx-auto mt-1 mb-5">
                  You do not have any scheduled consultations yet. Browse verified specialists and book your first visit today.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('find')}
                  className="px-5 py-2.5 text-sm font-semibold rounded-[10px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors inline-flex items-center gap-2"
                >
                  <span>Find a doctor</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => {
                  const canCancel = appt.status === 'PENDING' || appt.status === 'CONFIRMED';
                  return (
                    <div
                      key={appt.id}
                      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all"
                    >
                      {/* Left: Doctor & Date details */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusBadge status={appt.status} />
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#BFDBFE] dark:border-[#3B82F6]/30 text-[#2563EB] dark:text-[#60A5FA]">
                            {appt.doctor.specialty}
                          </span>
                          {appt.paymentStatus === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                              ✓ Paid {formatCurrencyINR(appt.doctor.fee)} ({appt.paymentMethod || 'UPI'})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 px-2.5 py-0.5 rounded-full">
                              ⏳ Pay at clinic ({formatCurrencyINR(appt.doctor.fee)})
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-lg leading-snug">
                            {appt.doctor.name}
                          </h3>
                          <div className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5 mt-0.5">
                            <Hospital className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>{appt.doctor.hospital}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#0F172A] dark:text-[#F8FAFC] font-medium pt-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>{formatDateLongIN(appt.date)}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>{formatTime12h(appt.time)} ({appt.time})</span>
                          </div>
                          <span>•</span>
                          <span className="text-[#64748B] dark:text-[#94A3B8]">
                            Consultation fee: {formatCurrencyINR(appt.doctor.fee)}
                          </span>
                        </div>

                        {appt.reason && (
                          <div className="text-xs text-[#64748B] dark:text-[#94A3B8] pt-1">
                            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Reason: </span>
                            {appt.reason}
                          </div>
                        )}

                        {appt.transactionId && (
                          <div className="text-[11px] text-slate-500 font-mono pt-0.5">
                            UPI Ref: {appt.transactionId}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center md:flex-col md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E2E8F0] dark:border-[#1E293B]">
                        <div className="text-xs text-[#64748B] dark:text-[#94A3B8] hidden md:block">
                          Booking ID: #{appt.id.slice(-6)}
                        </div>

                        {canCancel ? (
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(appt.id)}
                            disabled={cancellingId === appt.id}
                            className="px-4 py-2 text-xs font-semibold rounded-[10px] border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-[#DC2626] dark:text-[#F87171] hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none disabled:opacity-50"
                          >
                            {cancellingId === appt.id ? 'Cancelling...' : 'Cancel visit'}
                          </button>
                        ) : (
                          <div className="text-xs text-[#64748B] dark:text-[#94A3B8] italic">
                            {appt.status === 'CANCELLED' ? 'Slot released' : 'Visit completed'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* Booking Dialog Modal / Mobile Bottom Sheet */}
      <BookingModal
        doctor={selectedDoctorForBooking}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSuccess={() => {
          setActiveTab('appointments');
          fetchAppointments();
          fetchDoctors();
        }}
      />
    </div>
  );
}

export default function PatientPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] animate-pulse" />}>
      <PatientPortalContent />
    </Suspense>
  );
}
