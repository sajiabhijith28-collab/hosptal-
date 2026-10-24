'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  Activity,
  PhoneCall,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';

export function HeroClockCard() {
  const [time, setTime] = useState<string>('');
  const [seconds, setSeconds] = useState<string>('');
  const [period, setPeriod] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [dayName, setDayName] = useState<string>('');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const now = new Date();
      const rawTime = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const parts = rawTime.split(' ');
      setTime(parts[0] || '12:00');
      setPeriod(parts[1] || 'AM');
      setSeconds(String(now.getSeconds()).padStart(2, '0'));

      setDayName(now.toLocaleDateString('en-IN', { weekday: 'long' }));
      setDateStr(
        now.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white dark:bg-[#132338] rounded-2xl border border-[#CBD5E1] dark:border-[#1E293B] p-6 sm:p-7 shadow-lg relative overflow-hidden transition-all">
      {/* Background soft ambient glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#2563EB]/10 dark:bg-[#3B82F6]/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#10B981]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar: Live Status */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Hospital System Live • 24/7
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
          IST (UTC+05:30)
        </span>
      </div>

      {/* Main Digital Clock Display */}
      <div className="py-6 text-center">
        <div className="inline-flex items-baseline justify-center gap-1.5 font-mono select-none">
          <span className="text-5xl sm:text-6xl font-black tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
            {mounted && time ? time : '--:--'}
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-[#2563EB] dark:text-[#60A5FA]">
            :{mounted && seconds ? seconds : '00'}
          </span>
          <span className="ml-1 text-xs sm:text-sm font-bold uppercase px-2 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] border border-[#BFDBFE] dark:border-[#3B82F6]/30">
            {mounted && period ? period : 'AM'}
          </span>
        </div>

        {/* Date Display */}
        <div className="mt-2 text-sm sm:text-base font-semibold text-[#475569] dark:text-[#CBD5E1] flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
          <span>{mounted && dayName ? `${dayName}, ${dateStr}` : 'Hospital System Ready'}</span>
        </div>
      </div>

      {/* Operational Indicators */}
      <div className="grid grid-cols-2 gap-2.5 py-4 border-y border-[#E2E8F0] dark:border-[#1E293B] text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B132B] border border-[#E2E8F0] dark:border-[#1E293B] flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
          <div>
            <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">Emergency OPD</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Open 24 Hours</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B132B] border border-[#E2E8F0] dark:border-[#1E293B] flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-[#2563EB] shrink-0" />
          <div>
            <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">Doctors on Duty</div>
            <div className="text-[10px] text-[#2563EB] dark:text-[#60A5FA] font-medium">Active & Consulting</div>
          </div>
        </div>
      </div>

      {/* Fast Action Buttons */}
      <div className="pt-4 flex items-center gap-2.5">
        <Link
          href="/patient"
          className="flex-1 py-2.5 px-3 text-center text-xs font-semibold rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <span>Book an Appointment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <a
          href="tel:108"
          className="py-2.5 px-3 text-center text-xs font-semibold rounded-[10px] border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
          title="Emergency Ambulance & Trauma Service"
        >
          <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
          <span>Emergency 108</span>
        </a>
      </div>
    </div>
  );
}
