'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface HospitalClockProps {
  className?: string;
  showDate?: boolean;
  compact?: boolean;
}

export function HospitalClock({
  className = '',
  showDate = true,
  compact = false,
}: HospitalClockProps) {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || !time) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-400 ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
        <span>--:--:--</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50/90 dark:bg-[#0B1120]/90 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-xs backdrop-blur-xs select-none transition-colors ${className}`}
      title="Live Hospital System Time (IST)"
    >
      <div className="relative flex items-center justify-center shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
        <span className="w-2 h-2 rounded-full bg-emerald-500 relative" />
      </div>

      <Clock className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#60A5FA] shrink-0" />

      <div className="flex items-center gap-1.5 font-mono">
        <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {time}
        </span>
        {showDate && !compact && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans border-l border-slate-200 dark:border-slate-800 pl-1.5 hidden md:inline">
            {date}
          </span>
        )}
      </div>
    </div>
  );
}
