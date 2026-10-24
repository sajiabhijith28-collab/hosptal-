import React from 'react';
import { AppointmentStatus } from '@/types';

interface StatusBadgeProps {
  status: AppointmentStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const normalized = status.toUpperCase();
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm';

  if (normalized === 'PENDING') {
    return (
      <span
        className={`${sizeClasses} inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 select-none`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pending
      </span>
    );
  }

  if (normalized === 'CONFIRMED') {
    return (
      <span
        className={`${sizeClasses} inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 select-none`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Confirmed
      </span>
    );
  }

  if (normalized === 'COMPLETED') {
    return (
      <span
        className={`${sizeClasses} inline-flex items-center gap-1.5 font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 select-none`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
        Completed
      </span>
    );
  }

  if (normalized === 'CANCELLED') {
    return (
      <span
        className={`${sizeClasses} inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 select-none`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Cancelled
      </span>
    );
  }

  return (
    <span
      className={`${sizeClasses} inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700`}
    >
      {status}
    </span>
  );
}
