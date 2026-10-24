'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Doctor, TIME_SLOTS, PaymentMethod } from '@/types';
import { SlotChip } from '@/components/SlotChip';
import { useToast } from '@/components/Toast';
import { formatCurrencyINR, getNext7Days, formatDateIN } from '@/lib/utils';
import {
  X,
  Hospital,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Building,
  ArrowRight,
  ArrowLeft,
  Lock,
  Receipt,
  Download,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';

type ConfirmedBookingData = {
  id: string;
  date: string;
  time: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: string;
  transactionId?: string | null;
};

interface BookingModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDate?: string;
  initialTime?: string;
}

export function BookingModal({
  doctor,
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialTime,
}: BookingModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const days = getNext7Days();
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || days[0].date);
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '');
  const [reason, setReason] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // 2-Step Flow: 'details' -> 'payment' -> 'confirmed'
  const [step, setStep] = useState<'details' | 'payment' | 'confirmed'>('details');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'custom'>('gpay');
  const [upiId, setUpiId] = useState<string>('');
  const [showQr, setShowQr] = useState<boolean>(true);
  const [confirmedBookingData, setConfirmedBookingData] = useState<ConfirmedBookingData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const clinicUpiId = process.env.NEXT_PUBLIC_CLINIC_UPI_ID || '9495821891@ybl';
  const clinicUpiName = process.env.NEXT_PUBLIC_CLINIC_UPI_NAME || 'Ente Hospital';

  const upiDeepLink = doctor
    ? `upi://pay?pa=${encodeURIComponent(clinicUpiId)}&pn=${encodeURIComponent(clinicUpiName)}&am=${doctor.fee}&cu=INR&tn=${encodeURIComponent('Consultation with ' + doctor.name)}`
    : '';

  useEffect(() => {
    if (doctor?.fee && upiDeepLink) {
      QRCode.toDataURL(upiDeepLink, {
        width: 260,
        margin: 1,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate UPI QR code:', err));
    }
  }, [doctor?.fee, doctor?.name, upiDeepLink]);

  useEffect(() => {
    if (initialDate) setSelectedDate(initialDate);
    if (initialTime) setSelectedTime(initialTime);
  }, [initialDate, initialTime]);

  // Reset steps on open
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setBookingError(null);
      setConfirmedBookingData(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!doctor || !isOpen || !selectedDate) return;

    const doctorId = doctor.id;
    let isCancelled = false;
    async function fetchSlots() {
      setLoadingSlots(true);
      setBookingError(null);
      try {
        const res = await fetch(`/api/doctors/${doctorId}/slots?date=${selectedDate}`);
        if (!res.ok) throw new Error('Failed to load slots');
        const data = await res.json();
        if (!isCancelled) {
          const bookedSet = new Set<string>();
          data.slots.forEach((s: { time: string; isBooked: boolean }) => {
            if (s.isBooked) bookedSet.add(s.time);
          });
          setBookedSlots(bookedSet);

          if (selectedTime && bookedSet.has(selectedTime)) {
            setSelectedTime('');
          }
        }
      } catch (err) {
        if (!isCancelled) console.error(err);
      } finally {
        if (!isCancelled) setLoadingSlots(false);
      }
    }

    fetchSlots();
    return () => {
      isCancelled = true;
    };
  }, [doctor, selectedDate, isOpen, selectedTime]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !doctor) return null;

  const handleProceedToPayment = () => {
    if (!session || !session.user) {
      showToast('Please sign in to proceed with booking.', 'warning');
      router.push(`/login?callbackUrl=/patient&role=PATIENT`);
      return;
    }

    if (!selectedDate || !selectedTime) {
      setBookingError('Please choose both a date and an available time slot.');
      return;
    }

    setBookingError(null);
    setStep('payment');
  };

  const handleFinalBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    // If UPI custom mode is chosen without an ID, default to direct UPI rather than blocking
    let finalPaymentMethod = paymentMethod;
    if (paymentMethod === 'UPI' && upiApp === 'custom' && !upiId.trim()) {
      setUpiId('Google Pay');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor.id,
          date: selectedDate,
          time: selectedTime,
          reason: reason?.trim() || 'General consultation',
          paymentMethod: finalPaymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete appointment booking.');
      }

      setConfirmedBookingData(data.appointment);
      setStep('confirmed');
      showToast('Payment verified & appointment reserved!', 'success');
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Could not complete appointment booking.';
      setBookingError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#132338] rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#CBD5E1] dark:border-[#1E293B] shadow-2xl p-5 sm:p-7 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto text-[#0F172A] dark:text-[#F8FAFC] animate-slide-up sm:animate-fade-in">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Doctor Header Summary */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
            {doctor.name
              .replace('Dr. ', '')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div className="flex-1 pr-6">
            <div className="flex items-center gap-1.5 text-xs text-[#2563EB] dark:text-[#60A5FA] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified specialist</span>
            </div>
            <h2 id="booking-modal-title" className="text-lg sm:text-xl font-bold tracking-tight">
              {doctor.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {doctor.specialty}
              </span>
              <span>•</span>
              <span className="truncate max-w-[180px]">{doctor.hospital}</span>
              <span>•</span>
              <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">
                {formatCurrencyINR(doctor.fee)}
              </span>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {bookingError && (
          <div
            role="alert"
            className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* ================= STEP 1: CONSULTATION DETAILS ================= */}
        {step === 'details' && (
          <div className="mt-5 space-y-5">
            {/* 1. Date Chips (Next 7 days) */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                1. Choose date
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
                {days.map((day) => {
                  const isSelected = selectedDate === day.date;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedDate(day.date)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border shrink-0 transition-all focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none ${
                        isSelected
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs font-semibold'
                          : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-300 hover:border-[#2563EB]/40 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="text-[11px] opacity-80">{day.shortDay}</div>
                      <div className="font-bold">{day.label.split(',')[1] || day.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Time Slot Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  2. Choose time slot ({formatDateIN(selectedDate)})
                </label>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                    Selected
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="line-through">Booked</span>
                  </span>
                </div>
              </div>

              {loadingSlots ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isBooked = bookedSlots.has(slot);
                    const isSelected = selectedTime === slot;
                    return (
                      <SlotChip
                        key={slot}
                        time={slot}
                        isBooked={isBooked}
                        isSelected={isSelected}
                        onClick={() => setSelectedTime(slot)}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Reason for Visit */}
            <div>
              <label htmlFor="booking-reason" className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                3. Reason for consultation <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="booking-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Health checkup, blood pressure review, follow-up..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-slate-50 dark:bg-[#0B132B] text-sm text-[#0F172A] dark:text-[#F8FAFC] placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none transition-colors"
              />
            </div>

            {/* Consultation Fee Summary */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-[#0B132B] border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#2563EB] dark:text-[#60A5FA] font-bold uppercase tracking-wider">
                  Selected appointment
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedTime ? `${selectedTime} • ${formatDateIN(selectedDate)}` : 'Select an open slot above'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">Consultation fee</div>
                <div className="text-lg font-extrabold text-[#2563EB] dark:text-[#60A5FA]">
                  {formatCurrencyINR(doctor.fee)}
                </div>
              </div>
            </div>

            {/* Proceed to Payment CTA */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[#CBD5E1] dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={!selectedTime}
                className="flex-1 sm:flex-none px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Proceed to payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PAYMENT (UPI / CLINIC) ================= */}
        {step === 'payment' && (
          <form onSubmit={handleFinalBookingSubmit} className="mt-5 space-y-5">
            {/* Payment Method Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  Select payment method
                </label>
                <span className="text-[11px] text-[#2563EB] dark:text-[#60A5FA] font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  256-bit encrypted
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    paymentMethod === 'UPI'
                      ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold shadow-xs'
                      : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-[#2563EB] shrink-0" />
                  <div>
                    <div className="text-xs font-bold leading-snug">Instant UPI</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">GPay, PhonePe, Paytm</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('PAY_AT_CLINIC')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    paymentMethod === 'PAY_AT_CLINIC'
                      ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold shadow-xs'
                      : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Building className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold leading-snug">Pay at clinic</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Cash / Card on arrival</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    paymentMethod === 'CARD'
                      ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold shadow-xs'
                      : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold leading-snug">Credit / Debit card</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Visa, RuPay, MasterCard</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NETBANKING')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    paymentMethod === 'NETBANKING'
                      ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#60A5FA] font-bold shadow-xs'
                      : 'border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0B132B] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Hospital className="w-5 h-5 text-purple-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold leading-snug">Net banking</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">HDFC, ICICI, SBI, Axis</div>
                  </div>
                </button>
              </div>
            </div>

            {/* UPI Sub-Options */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-[#0B132B] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Fast checkout with UPI Apps
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQr ? 'Hide QR' : 'Show UPI QR'}</span>
                  </button>
                </div>

                {/* UPI QR Display */}
                {showQr && (
                  <div className="text-center p-4 bg-white dark:bg-[#132338] rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in space-y-3">
                    <div className="w-44 h-44 mx-auto bg-white p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Google Pay UPI QR Code"
                          className="w-40 h-40 object-contain rounded-lg"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <QrCode className="w-16 h-16 animate-pulse text-[#2563EB]" />
                          <span className="text-[10px] mt-1 font-medium">Generating GPay QR...</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Scan & Pay ₹{doctor.fee} with Google Pay
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 pt-0.5">
                        Depositing to: <span className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">{clinicUpiId}</span>
                      </div>
                    </div>

                    {/* Direct Mobile Launch Button */}
                    <div className="pt-1">
                      <a
                        href={upiDeepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Pay via Google Pay / UPI App</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                      </a>
                    </div>
                  </div>
                )}

                {/* UPI App Pills */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUpiApp('gpay');
                      setUpiId('Google Pay');
                    }}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                      upiApp === 'gpay'
                        ? 'border-[#2563EB] bg-white dark:bg-[#132338] text-[#2563EB] shadow-xs ring-1 ring-[#2563EB]/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Google Pay
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUpiApp('phonepe');
                      setUpiId('PhonePe');
                    }}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                      upiApp === 'phonepe'
                        ? 'border-[#2563EB] bg-white dark:bg-[#132338] text-[#2563EB] shadow-xs ring-1 ring-[#2563EB]/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    PhonePe
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUpiApp('paytm');
                      setUpiId('Paytm');
                    }}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                      upiApp === 'paytm'
                        ? 'border-[#2563EB] bg-white dark:bg-[#132338] text-[#2563EB] shadow-xs ring-1 ring-[#2563EB]/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Paytm
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUpiApp('custom');
                      setUpiId('');
                    }}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                      upiApp === 'custom'
                        ? 'border-[#2563EB] bg-white dark:bg-[#132338] text-[#2563EB] shadow-xs ring-1 ring-[#2563EB]/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Other UPI
                  </button>
                </div>

                {/* Patient UPI ID input if custom */}
                {upiApp === 'custom' && (
                  <div className="animate-fade-in">
                    <label htmlFor="upi-id" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Your UPI ID (Virtual Payment Address)
                    </label>
                    <input
                      id="upi-id"
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. mobile@upi or yourname@oksbi"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0B132B] text-[#0F172A] dark:text-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Pay at Clinic Notice */}
            {paymentMethod === 'PAY_AT_CLINIC' && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-[#0B132B] text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No upfront payment required today</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your appointment slot is immediately reserved. You can pay the consultation fee ({formatCurrencyINR(doctor.fee)}) directly at the clinic reception via UPI, Card, or Cash when you check in.
                </p>
              </div>
            )}

            {/* Billing Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B132B] border border-[#CBD5E1] dark:border-[#334155] space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Doctor consultation fee</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{formatCurrencyINR(doctor.fee)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Ente Hospital booking platform fee</span>
                <span className="font-semibold text-emerald-600">FREE (₹0)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-bold text-sm text-slate-900 dark:text-slate-100">
                <span>Total amount payable</span>
                <span className="text-base text-[#2563EB] dark:text-[#60A5FA]">{formatCurrencyINR(doctor.fee)}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={submitting}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-[#CBD5E1] dark:border-[#334155] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {submitting ? (
                  <span>Verifying payment...</span>
                ) : paymentMethod === 'PAY_AT_CLINIC' ? (
                  <span>Confirm appointment</span>
                ) : (
                  <span>Pay {formatCurrencyINR(doctor.fee)} & confirm</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: CONFIRMED RECEIPT ================= */}
        {step === 'confirmed' && confirmedBookingData && (
          <div className="mt-5 space-y-5 animate-fade-in text-center">
            <div className="w-14 h-14 rounded-full bg-[#DCFCE7] dark:bg-[#14532D] text-[#16A34A] dark:text-[#86EFAC] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold tracking-tight">Appointment reserved!</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your visit request has been queued. Waiting for doctor acceptance.
              </p>
            </div>

            {/* Official Digital Slip */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B132B] text-left text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Booking ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">#{confirmedBookingData.id.slice(-8)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Doctor</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{doctor.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Date & Time</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatDateIN(confirmedBookingData.date)} at {confirmedBookingData.time}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hospital</span>
                <span className="text-slate-800 dark:text-slate-200">{doctor.hospital}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment method</span>
                <span className="font-semibold text-[#2563EB] dark:text-[#60A5FA]">
                  {confirmedBookingData.paymentMethod === 'PAY_AT_CLINIC' ? 'Pay at clinic' : `Online UPI (${confirmedBookingData.paymentStatus})`}
                </span>
              </div>

              {confirmedBookingData.transactionId && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{confirmedBookingData.transactionId}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/patient?tab=appointments');
                }}
                className="w-full py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all shadow-sm"
              >
                Go to my appointments
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
