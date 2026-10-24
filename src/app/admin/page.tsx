'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { Doctor, Appointment, SPECIALTIES } from '@/types';
import { formatCurrencyINR, formatDateIN, formatTime12h } from '@/lib/utils';
import {
  Shield,
  Users,
  CalendarCheck,
  Calendar,
  Clock,
  IndianRupee,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle2,
  X,
  Stethoscope,
  Hospital,
  RefreshCw,
  Search,
  Activity,
} from 'lucide-react';

interface AdminOverviewData {
  stats: {
    activeBookings: number;
    pendingConfirmation: number;
    doctorsLive: number;
    bookedValueINR: number;
    onlineCollectedINR?: number;
    dueAtClinicINR?: number;
  };
  latest5Bookings: Appointment[];
  bookingsBySpecialty: Array<{
    specialty: string;
    count: number;
    percentage: number;
  }>;
}

function AdminPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const { showToast } = useToast();

  const user = session?.user as any;
  const initialTab =
    searchParams.get('tab') === 'doctors'
      ? 'doctors'
      : searchParams.get('tab') === 'appointments'
      ? 'appointments'
      : 'overview';

  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'appointments'>(initialTab);

  // Overview data
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Doctors list data
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [togglingDoctorId, setTogglingDoctorId] = useState<string | null>(null);
  const [deletingDoctorId, setDeletingDoctorId] = useState<string | null>(null);

  // Add doctor modal
  const [addDoctorModalOpen, setAddDoctorModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState<string>(SPECIALTIES[0]);
  const [newDocHospital, setNewDocHospital] = useState('');
  const [newDocFee, setNewDocFee] = useState<number>(750);
  const [newDocExp, setNewDocExp] = useState<number>(8);
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocPassword, setNewDocPassword] = useState('demo1234');
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [addDoctorError, setAddDoctorError] = useState<string | null>(null);

  // Appointments data
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentSearch, setAppointmentSearch] = useState('');

  // Route protection
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?role=ADMIN');
    } else if (authStatus === 'authenticated' && user?.role !== 'ADMIN') {
      showToast('Administrator privileges required.', 'warning');
      router.push('/login?role=ADMIN');
    }
  }, [authStatus, user, router]);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'doctors') setActiveTab('doctors');
    else if (tabParam === 'appointments') setActiveTab('appointments');
    else setActiveTab('overview');
  }, [searchParams]);

  // Fetch overview
  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.error('Error fetching admin overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fetch doctors (including inactive)
  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await fetch('/api/doctors?includeInactive=true');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Fetch all appointments
  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAllAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (session?.user && user?.role === 'ADMIN') {
      fetchOverview();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user && user?.role === 'ADMIN') {
      if (activeTab === 'doctors') fetchDoctors();
      if (activeTab === 'appointments') fetchAppointments();
    }
  }, [session, activeTab]);

  // Toggle Doctor Active State
  const handleToggleDoctorActive = async (doctor: Doctor) => {
    setTogglingDoctorId(doctor.id);
    const newActive = !doctor.active;

    try {
      const res = await fetch(`/api/admin/doctors/${doctor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update doctor.');
      }

      showToast(data.message, 'success');
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, active: newActive } : d))
      );
      // Refresh totals
      fetchOverview();
    } catch (err: any) {
      showToast(err.message || 'Error updating doctor.', 'error');
    } finally {
      setTogglingDoctorId(null);
    }
  };

  // Remove Doctor (Rule: blocked if doctor has upcoming bookings)
  const handleDeleteDoctor = async (doctor: Doctor) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${doctor.name}? This will remove their doctor profile and login account.`
    );
    if (!confirmDelete) return;

    setDeletingDoctorId(doctor.id);
    try {
      const res = await fetch(`/api/admin/doctors/${doctor.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not remove doctor.');
      }

      showToast(data.message || 'Doctor removed successfully.', 'info');
      setDoctors((prev) => prev.filter((d) => d.id !== doctor.id));
      fetchOverview();
    } catch (err: any) {
      showToast(err.message || 'Cannot remove doctor.', 'error');
    } finally {
      setDeletingDoctorId(null);
    }
  };

  // Add Doctor Form Submit
  const handleAddDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDoctorError(null);

    if (!newDocName || !newDocHospital || !newDocFee || !newDocEmail || !newDocPassword) {
      setAddDoctorError('All fields are required.');
      return;
    }

    setAddingDoctor(true);
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDocName.trim(),
          specialty: newDocSpecialty,
          hospital: newDocHospital.trim(),
          fee: Number(newDocFee),
          yearsExperience: Number(newDocExp),
          email: newDocEmail.trim().toLowerCase(),
          password: newDocPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create doctor.');
      }

      showToast(`Doctor ${newDocName} added successfully.`, 'success');
      setAddDoctorModalOpen(false);

      // Reset form
      setNewDocName('');
      setNewDocHospital('');
      setNewDocEmail('');

      // Refresh list & stats
      fetchDoctors();
      fetchOverview();
    } catch (err: any) {
      setAddDoctorError(err.message || 'Could not add doctor.');
      showToast(err.message || 'Error adding doctor.', 'error');
    } finally {
      setAddingDoctor(false);
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B132B]">
        <div className="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      </div>
    );
  }

  const filteredAppointments = allAppointments.filter((a) => {
    if (!appointmentSearch.trim()) return true;
    const term = appointmentSearch.toLowerCase();
    return (
      a.doctor?.name.toLowerCase().includes(term) ||
      a.patient?.name.toLowerCase().includes(term) ||
      a.patient?.email.toLowerCase().includes(term) ||
      a.doctor?.specialty.toLowerCase().includes(term) ||
      a.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-[#F8FAFC] font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header with Title and Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#BFDBFE] dark:border-[#3B82F6]/30 text-[#2563EB] dark:text-[#60A5FA] text-xs font-semibold mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Hospital Administrative Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Ente Hospital administration
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Live clinic metrics, doctor provisioning, and platform appointment audits.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] self-start sm:self-auto shadow-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab('overview');
                router.replace('/admin');
              }}
              className={`px-3.5 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('doctors');
                router.replace('/admin?tab=doctors');
                fetchDoctors();
              }}
              className={`px-3.5 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'doctors'
                  ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctors</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('appointments');
                router.replace('/admin?tab=appointments');
                fetchAppointments();
              }}
              className={`px-3.5 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'appointments'
                  ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Appointments</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="pt-6 space-y-6">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Stat 1: Active Bookings */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm">
                <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
                  Active bookings
                </div>
                <div className="text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                  {loadingOverview ? '...' : overview?.stats.activeBookings ?? 0}
                </div>
                <div className="text-xs text-[#2563EB] dark:text-[#60A5FA] mt-1 font-medium">
                  Pending & confirmed
                </div>
              </div>

              {/* Stat 2: Pending Confirmation */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm">
                <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
                  Pending confirmation
                </div>
                <div className="text-3xl font-extrabold text-[#D97706] dark:text-[#FBBF24]">
                  {loadingOverview ? '...' : overview?.stats.pendingConfirmation ?? 0}
                </div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Awaiting doctor reply
                </div>
              </div>

              {/* Stat 3: Doctors Live */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm">
                <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
                  Doctors live
                </div>
                <div className="text-3xl font-extrabold text-[#16A34A] dark:text-[#4ADE80]">
                  {loadingOverview ? '...' : overview?.stats.doctorsLive ?? 0}
                </div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Active accepting visits
                </div>
              </div>

              {/* Stat 4: Booked Consultation Value */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm">
                <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
                  Booked consultation value
                </div>
                <div className="text-3xl font-extrabold text-[#2563EB] dark:text-[#60A5FA]">
                  {loadingOverview ? '...' : formatCurrencyINR(overview?.stats.bookedValueINR ?? 0)}
                </div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Online: <span className="font-semibold text-emerald-600">{formatCurrencyINR(overview?.stats.onlineCollectedINR ?? 0)}</span> • Clinic: <span className="font-semibold text-amber-600">{formatCurrencyINR(overview?.stats.dueAtClinicINR ?? 0)}</span>
                </div>
              </div>
            </div>

            {/* Split Grid: Latest 5 Bookings & Bookings by Specialty */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Latest 5 Bookings (7 cols) */}
              <div className="lg:col-span-7 bg-white dark:bg-[#132338] rounded-2xl border border-[#CBD5E1] dark:border-[#1E293B] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                  <div>
                    <h2 className="text-lg font-bold">Latest 5 bookings</h2>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      Most recent consultation requests across Ente Hospital
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('appointments');
                      router.replace('/admin?tab=appointments');
                    }}
                    className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                  >
                    View all
                  </button>
                </div>

                {loadingOverview ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                      />
                    ))}
                  </div>
                ) : overview?.latest5Bookings.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
                    No bookings recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                    {overview?.latest5Bookings.map((appt) => (
                      <div
                        key={appt.id}
                        className="py-3.5 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                            {appt.doctor?.name}
                          </div>
                          <div className="text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2">
                            <span>Patient: {appt.patient?.name}</span>
                            <span>•</span>
                            <span>{formatDateIN(appt.date)}, {appt.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                            {formatCurrencyINR(appt.doctor?.fee || 0)}
                          </span>
                          <StatusBadge status={appt.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bookings by Specialty (5 cols) */}
              <div className="lg:col-span-5 bg-white dark:bg-[#132338] rounded-2xl border border-[#CBD5E1] dark:border-[#1E293B] p-6 shadow-sm">
                <div className="mb-5 pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                  <h2 className="text-lg font-bold">Bookings by specialty</h2>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Relative volume across clinical divisions
                  </p>
                </div>

                {loadingOverview ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-8 rounded bg-slate-100 dark:bg-slate-800 animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {overview?.bookingsBySpecialty.map((item) => (
                      <div key={item.specialty} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                            {item.specialty}
                          </span>
                          <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">
                            {item.count} {item.count === 1 ? 'booking' : 'bookings'} ({item.percentage}%)
                          </span>
                        </div>
                        {/* Horizontal Blue Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#0B132B] overflow-hidden">
                          <div
                            className="h-full bg-[#2563EB] dark:bg-[#3B82F6] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(item.percentage, item.count > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTORS MANAGEMENT */}
        {activeTab === 'doctors' && (
          <div className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Doctor roster & credentials</h2>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
                  Manage active listings and provision doctor credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAddDoctorModalOpen(true)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add doctor</span>
              </button>
            </div>

            {loadingDoctors ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] h-20 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#132338] rounded-2xl border border-[#CBD5E1] dark:border-[#1E293B] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F8FAFC] dark:bg-[#0B132B] border-b border-[#E2E8F0] dark:border-[#1E293B] text-[#64748B] dark:text-[#94A3B8] uppercase font-semibold text-[11px] tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Doctor name</th>
                        <th className="px-4 py-3.5">Specialty</th>
                        <th className="px-4 py-3.5">Hospital</th>
                        <th className="px-4 py-3.5">Fee</th>
                        <th className="px-4 py-3.5 text-center">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                      {doctors.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-5 py-4 font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                            <div className="font-bold text-sm">{doc.name}</div>
                            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                              {doc.yearsExperience} yrs experience
                            </div>
                          </td>

                          <td className="px-4 py-4 text-[#64748B] dark:text-[#94A3B8]">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] font-medium text-xs border border-[#BFDBFE] dark:border-[#3B82F6]/30">
                              {doc.specialty}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-[#64748B] dark:text-[#94A3B8]">
                            {doc.hospital}
                          </td>

                          <td className="px-4 py-4 font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                            {formatCurrencyINR(doc.fee)}
                          </td>

                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleDoctorActive(doc)}
                              disabled={togglingDoctorId === doc.id}
                              aria-label={`Toggle active status for ${doc.name}`}
                              className="inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none rounded-md px-1"
                            >
                              {doc.active ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A] dark:text-[#4ADE80]">
                                  <ToggleRight className="w-5 h-5 text-[#16A34A] dark:text-[#4ADE80]" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                  <ToggleLeft className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                  Inactive
                                </span>
                              )}
                            </button>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteDoctor(doc)}
                              disabled={deletingDoctorId === doc.id}
                              className="p-1.5 rounded-[8px] text-[#DC2626] dark:text-[#F87171] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                              title="Remove doctor"
                              aria-label={`Remove doctor ${doc.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: APPOINTMENTS AUDIT */}
        {activeTab === 'appointments' && (
          <div className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Platform appointment ledger</h2>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
                  Comprehensive log of every consultation across all doctors.
                </p>
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                  placeholder="Search doctor, patient, status..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#132338] text-xs text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none shadow-sm"
                />
                <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
              </div>
            </div>

            {loadingAppointments ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] h-16 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B]">
                <Calendar className="w-10 h-10 text-[#2563EB] dark:text-[#60A5FA] mx-auto mb-3 opacity-60" />
                <h3 className="font-bold text-base">No appointments found</h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  No appointments match the search term.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#132338] rounded-2xl border border-[#CBD5E1] dark:border-[#1E293B] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F8FAFC] dark:bg-[#0B132B] border-b border-[#E2E8F0] dark:border-[#1E293B] text-[#64748B] dark:text-[#94A3B8] uppercase font-semibold text-[11px] tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Date & Time</th>
                        <th className="px-4 py-3.5">Doctor</th>
                        <th className="px-4 py-3.5">Patient</th>
                        <th className="px-4 py-3.5">Fee</th>
                        <th className="px-4 py-3.5">Reason</th>
                        <th className="px-5 py-3.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                      {filteredAppointments.map((appt) => (
                        <tr
                          key={appt.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap">
                            <div>{formatDateIN(appt.date)}</div>
                            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                              {appt.time} ({formatTime12h(appt.time)})
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                              {appt.doctor?.name}
                            </div>
                            <div className="text-[11px] text-[#2563EB] dark:text-[#60A5FA]">
                              {appt.doctor?.specialty}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                              {appt.patient?.name}
                            </div>
                            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                              {appt.patient?.email}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                              {formatCurrencyINR(appt.doctor?.fee || 0)}
                            </div>
                            <div className="text-[10px] font-semibold mt-0.5">
                              {appt.paymentStatus === 'PAID' ? (
                                <span className="text-emerald-600 dark:text-emerald-400">✓ Paid ({appt.paymentMethod || 'UPI'})</span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400">⏳ Due at clinic</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-[#64748B] dark:text-[#94A3B8] max-w-xs truncate">
                            {appt.reason || '—'}
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <StatusBadge status={appt.status} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* ADD DOCTOR MODAL */}
      {addDoctorModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-doctor-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-[#132338] rounded-2xl border border-[#CBD5E1] dark:border-[#1E293B] shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto text-[#0F172A] dark:text-[#F8FAFC]">
            <button
              type="button"
              onClick={() => setAddDoctorModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-[10px] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <h2 id="add-doctor-title" className="text-xl font-bold tracking-tight">
                Add doctor & provision account
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Creates the public clinical doctor profile and their staff login credentials.
              </p>
            </div>

            {addDoctorError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-[10px] bg-[#FEF2F2] dark:bg-[#331413] border border-[#F87171]/40 text-[#DC2626] dark:text-[#F87171] text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addDoctorError}</span>
              </div>
            )}

            <form onSubmit={handleAddDoctorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Doctor full name</label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. Dr. Meenakshi Sundaram"
                  className="w-full px-3.5 py-2 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Specialty</label>
                  <select
                    value={newDocSpecialty}
                    onChange={(e) => setNewDocSpecialty(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                  >
                    {SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Fee in ₹</label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={50}
                    value={newDocFee}
                    onChange={(e) => setNewDocFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Hospital affiliation</label>
                  <input
                    type="text"
                    required
                    value={newDocHospital}
                    onChange={(e) => setNewDocHospital(e.target.value)}
                    placeholder="e.g. Manipal Hospital"
                    className="w-full px-3.5 py-2 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Experience (years)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newDocExp}
                    onChange={(e) => setNewDocExp(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1E293B] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
                  Doctor Login Credentials
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Staff email address</label>
                  <input
                    type="email"
                    required
                    value={newDocEmail}
                    onChange={(e) => setNewDocEmail(e.target.value)}
                    placeholder="doctor.name@entehospital.demo"
                    className="w-full px-3.5 py-2 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Initial password</label>
                  <input
                    type="password"
                    required
                    value={newDocPassword}
                    onChange={(e) => setNewDocPassword(e.target.value)}
                    placeholder="demo1234"
                    className="w-full px-3.5 py-2 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAddDoctorModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDoctor}
                  className="px-5 py-2 text-xs font-semibold rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white disabled:opacity-50"
                >
                  {addingDoctor ? 'Creating doctor...' : 'Create doctor & login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] animate-pulse" />}>
      <AdminPortalContent />
    </Suspense>
  );
}
