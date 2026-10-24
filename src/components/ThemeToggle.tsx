'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem('ente-theme') || localStorage.getItem('mediwell-theme')) as 'light' | 'dark' | 'system' | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    } else {
      applyTheme('light');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const current = localStorage.getItem('ente-theme') || localStorage.getItem('mediwell-theme') || 'system';
      if (current === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (t === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      // System default
      root.classList.remove('light');
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const toggleTheme = () => {
    let next: 'light' | 'dark' | 'system' = 'dark';
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      next = isDark ? 'light' : 'dark';
    } else if (theme === 'dark') {
      next = 'light';
    } else {
      next = 'dark';
    }

    setTheme(next);
    localStorage.setItem('ente-theme', next);
    applyTheme(next);
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 opacity-50" />
    );
  }

  const isDarkEffective =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${isDarkEffective ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme mode"
      className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131E32] text-slate-500 dark:text-slate-400 hover:text-[#2563EB] dark:hover:text-[#3B82F6] hover:border-[#2563EB]/40 dark:hover:border-[#3B82F6]/40 transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:outline-none cursor-pointer shadow-xs"
    >
      {isDarkEffective ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#2563EB]" />}
    </button>
  );
}
