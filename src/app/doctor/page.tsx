'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { Appointment } from '@/types';
import { formatCurrencyINR, formatDateIN, formatDateLongIN, formatTime12h, getTodayISO } from '@/lib/utils';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Hospital,
  RefreshCw,
  Award,
  ChevronRight,
  Filter,
  ShieldCheck,
} from 'lucide-react';

interface DoctorOverviewData {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    hospital: string;
    fee: number;
    yearsExperience: number;
  } | null;
  stats: {
    visitsToday: number;
    awaitingReply: number;
    confirmedUpcoming: number;
  };
  todaySchedule: Appointment[];
  todayDate: string;
}

function DoctorPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const { showToast } = useToast();

  const user = session?.user as any;
  const initialTab = searchParams.get('tab') === 'all' ? 'all' : 'today';

  const [activeTab, setActiveTab] = useState<'today' | 'all'>(initialTab);
  const [overview, setOverview] = useState<DoctorOverviewData | null>(null);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Route protection
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?role=DOCTOR');
    } else if (authStatus === 'authenticated' && user?.role !== 'DOCTOR') {
      showToast('This portal requires a Doctor account.', 'warning');
      router.push('/login?role=DOCTOR');
    }
  }, [authStatus, user, router]);

  // Sync tab with searchParams
  useEffect(() => {
    if (searchParams.get('tab') === 'all') {
      setActiveTab('all');
    } else {
      setActiveTab('today');
    }
  }, [searchParams]);

  // Fetch overview data (Today's schedule & stats)
  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch('/api/doctor/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.error('Error fetching doctor overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fetch all appointments
  const fetchAllAppointments = async () => {
    setLoadingAll(true);
    try {
      let url = '/api/appointments';
      if (statusFilter !== 'ALL') {
        url += `?status=${statusFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAllAppointments(data);
      }
    } catch (err) {
      console.error('Error fetching all doctor appointments:', err);
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => {
    if (session?.user && user?.role === 'DOCTOR') {
      fetchOverview();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user && user?.role === 'DOCTOR' && activeTab === 'all') {
      fetchAllAppointments();
    }
  }, [session, activeTab, statusFilter]);

  // Handle appointment status updates (Confirm, Decline, Complete)
  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  ) => {
    setUpdatingId(appointmentId);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update appointment.');
      }

      showToast(data.message || `Appointment status updated.`, 'success');

      // Update state in both places
      if (overview) {
        setOverview((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            todaySchedule: prev.todaySchedule.map((a) =>
              a.id === appointmentId ? { ...a, status: newStatus } : a
            ),
          };
        });
      }

      setAllAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );

      // Refresh overview stats
      fetchOverview();
    } catch (err: any) {
      showToast(err.message || 'Error updating status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B132B]">
        <div className="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B132B] text-[#0F172A] dark:text-[#F8FAFC] font-sans transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header with Doctor Bio & Portal Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#BFDBFE] dark:border-[#3B82F6]/30 text-[#2563EB] dark:text-[#60A5FA] text-xs font-semibold mb-1">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Verified Clinical Practice</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              {overview?.doctor?.name || user?.name || 'Doctor portal'}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              {overview?.doctor?.specialty} • {overview?.doctor?.hospital}
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] self-start sm:self-auto shadow-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab('today');
                router.replace('/doctor');
              }}
              className={`px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'today'
                  ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Today's schedule</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                router.replace('/doctor?tab=all');
                fetchAllAppointments();
              }}
              className={`px-4 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-sm'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>All appointments</span>
            </button>
          </div>
        </div>

        {/* TAB 1: TODAY'S SCHEDULE & STATS */}
        {activeTab === 'today' && (
          <div className="pt-6 space-y-6">
            {/* 3 Operational Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Card 1: Visits today */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    Visits today
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                  {loadingOverview ? '...' : overview?.stats.visitsToday ?? 0}
                </div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Scheduled for today ({overview?.todayDate ? formatDateIN(overview.todayDate) : 'Today'})
                </div>
              </div>

              {/* Card 2: Awaiting reply */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    Awaiting your reply
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#FEF3C7] dark:bg-[#3B2807] text-[#D97706] dark:text-[#FBBF24] flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-[#D97706] dark:text-[#FBBF24]">
                  {loadingOverview ? '...' : overview?.stats.awaitingReply ?? 0}
                </div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Pending patient bookings
                </div>
              </div>

              {/* Card 3: Confirmed upcoming */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    Confirmed upcoming
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#DCFCE7] dark:bg-[#0E3A1E] text-[#16A34A] dark:text-[#4ADE80] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-[#16A34A] dark:text-[#4ADE80]">
                  {loadingOverview ? '...' : overview?.stats.confirmedUpcoming ?? 0}
                </div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Ready for consultation
                </div>
              </div>
            </div>

            {/* Today's Schedule List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Today's consultation schedule</h2>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Patients booked for consultation today. Confirm new requests or complete finished visits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchOverview}
                  disabled={loadingOverview}
                  className="px-3 py-1.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#132338] text-xs font-medium hover:border-[#2563EB] flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingOverview ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] h-24 animate-pulse"
                    />
                  ))}
                </div>
              ) : overview?.todaySchedule.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B]">
                  <Clock className="w-10 h-10 text-[#2563EB] dark:text-[#60A5FA] mx-auto mb-3 opacity-60" />
                  <h3 className="font-bold text-base">No appointments scheduled for today</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                    Your schedule for today is currently free. Any new bookings will appear here immediately.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overview?.todaySchedule.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="px-3.5 py-2 rounded-xl bg-[#EFF6FF] dark:bg-[#1E293B] border border-[#BFDBFE] dark:border-[#3B82F6]/30 text-[#2563EB] dark:text-[#60A5FA] text-center shrink-0">
                          <div className="text-xs font-medium opacity-80">Slot</div>
                          <div className="text-base font-extrabold">{appt.time}</div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="font-bold text-base">{appt.patient?.name}</h3>
                            <StatusBadge status={appt.status} size="sm" />
                            {appt.paymentStatus === 'PAID' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                ✓ Paid Online ({appt.paymentMethod})
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                ⏳ Collect at Reception
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2">
                            <span>{appt.patient?.email}</span>
                            {appt.transactionId && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[11px] text-slate-500">Ref: {appt.transactionId}</span>
                              </>
                            )}
                          </div>
                          {appt.reason && (
                            <div className="text-xs text-[#0F172A] dark:text-[#F8FAFC] pt-1">
                              <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Reason: </span>
                              {appt.reason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {appt.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                              disabled={updatingId === appt.id}
                              className="px-3.5 py-2 text-xs font-semibold rounded-[10px] bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:outline-none"
                            >
                              {updatingId === appt.id ? 'Updating...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                              disabled={updatingId === appt.id}
                              className="px-3.5 py-2 text-xs font-semibold rounded-[10px] border border-red-200 dark:border-red-900/40 text-[#DC2626] dark:text-[#F87171] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {appt.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                            disabled={updatingId === appt.id}
                            className="px-4 py-2 text-xs font-semibold rounded-[10px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                          >
                            {updatingId === appt.id ? 'Updating...' : 'Mark completed'}
                          </button>
                        )}

                        {appt.status === 'COMPLETED' && (
                          <span className="text-xs text-[#16A34A] dark:text-[#4ADE80] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Completed
                          </span>
                        )}

                        {appt.status === 'CANCELLED' && (
                          <span className="text-xs text-[#DC2626] dark:text-[#F87171] font-medium">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ALL APPOINTMENTS */}
        {activeTab === 'all' && (
          <div className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">All patient appointments</h2>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
                  Full chronological record of consultations across all dates.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
                  Filter by:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-[10px] border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#132338] text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none shadow-sm"
                >
                  <option value="ALL">All statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {loadingAll ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] h-20 animate-pulse"
                  />
                ))}
              </div>
            ) : allAppointments.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B]">
                <Calendar className="w-10 h-10 text-[#2563EB] dark:text-[#60A5FA] mx-auto mb-3 opacity-60" />
                <h3 className="font-bold text-base">No appointments found</h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  No appointments match the selected filter.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#132338] border border-[#CBD5E1] dark:border-[#1E293B] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <StatusBadge status={appt.status} size="sm" />
                        <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                          {formatDateIN(appt.date)}
                        </span>
                        <span>•</span>
                        <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                          {appt.time} ({formatTime12h(appt.time)})
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-base text-[#0F172A] dark:text-[#F8FAFC]">
                          {appt.patient?.name}
                        </div>
                        <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          {appt.patient?.email}
                        </div>
                      </div>

                      {appt.reason && (
                        <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                          <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Reason: </span>
                          {appt.reason}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {appt.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                            disabled={updatingId === appt.id}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-[10px] bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:outline-none"
                          >
                            {updatingId === appt.id ? 'Updating...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                            disabled={updatingId === appt.id}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-[10px] border border-red-200 dark:border-red-900/40 text-[#DC2626] dark:text-[#F87171] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {appt.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                          disabled={updatingId === appt.id}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-[10px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                        >
                          {updatingId === appt.id ? 'Updating...' : 'Mark completed'}
                        </button>
                      )}

                      {appt.status === 'COMPLETED' && (
                        <span className="text-xs text-[#16A34A] dark:text-[#4ADE80] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      )}

                      {appt.status === 'CANCELLED' && (
                        <span className="text-xs text-[#DC2626] dark:text-[#F87171] font-medium">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function DoctorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] animate-pulse" />}>
      <DoctorPortalContent />
    </Suspense>
  );
}
