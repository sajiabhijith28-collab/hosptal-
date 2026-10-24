'use client';

import React from 'react';
import { formatTime12h } from '@/lib/utils';

interface SlotChipProps {
  time: string;
  isBooked?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  show12h?: boolean;
}

export function SlotChip({
  time,
  isBooked = false,
  isSelected = false,
  onClick,
  disabled = false,
  size = 'md',
  show12h = false,
}: SlotChipProps) {
  const displayTime = show12h ? formatTime12h(time) : time;
  const isInactive = isBooked || disabled;

  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs min-h-[34px]'
      : 'px-4 py-2 text-xs sm:text-sm min-h-[40px]';

  if (isBooked) {
    return (
      <button
        type="button"
        disabled
        title={`${displayTime} is already booked`}
        aria-label={`${displayTime} booked`}
        className={`${sizeClasses} inline-flex items-center justify-center font-medium rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 line-through opacity-55 cursor-not-allowed select-none`}
      >
        {displayTime}
      </button>
    );
  }

  if (isSelected) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed="true"
        aria-label={`${displayTime} selected`}
        className={`${sizeClasses} inline-flex items-center justify-center font-semibold rounded-full bg-[#2563EB] text-white border border-[#2563EB] shadow-sm shadow-blue-500/25 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB] focus-visible:outline-none active:scale-95`}
      >
        {displayTime}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isInactive}
      aria-pressed="false"
      aria-label={`${displayTime} available`}
      className={`${sizeClasses} inline-flex items-center justify-center font-medium rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131E32] text-[#0F172A] dark:text-[#F1F5F9] hover:border-[#2563EB] dark:hover:border-[#3B82F6] hover:bg-[#EFF6FF] dark:hover:bg-[#172554] active:scale-[0.98] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB] focus-visible:outline-none`}
    >
      {displayTime}
    </button>
  );
}
